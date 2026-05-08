import { defineStore } from 'pinia'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore
} from 'firebase/firestore'
import type { LeaveRecord, LeaveSetting, LeaveSummary, LeaveType } from '~/types/leave'
import { calculateLeaveSummary } from '~/utils/leave'

type LeaveTypeFilter = LeaveType | 'all'

interface LeaveState {
  currentYear: number
  setting: LeaveSetting
  records: LeaveRecord[]
  loading: boolean
  displayName: string
  historyFilters: {
    year: string
    month: string
    type: LeaveTypeFilter
  }
}

const createDefaultSetting = (year = new Date().getFullYear()): LeaveSetting => ({
  year,
  totalDays: 15,
  carriedOverDays: 0,
  memo: ''
})

export const useLeaveStore = defineStore('leave', {
  state: (): LeaveState => ({
    currentYear: new Date().getFullYear(),
    setting: createDefaultSetting(),
    records: [],
    loading: false,
    displayName: '',
    historyFilters: {
      year: String(new Date().getFullYear()),
      month: 'all',
      type: 'all'
    }
  }),
  getters: {
    summary: (state): LeaveSummary =>
      calculateLeaveSummary(state.setting.totalDays, state.setting.carriedOverDays, state.records),
    sortedRecords: (state): LeaveRecord[] =>
      [...state.records].sort((a, b) => (b.startDate ?? b.date).localeCompare(a.startDate ?? a.date)),
    availableYears: (state): string[] => {
      const years = new Set<string>([state.historyFilters.year])

      state.records.forEach((record) => {
        const recordYear = (record.startDate ?? record.date).slice(0, 4)
        if (recordYear) {
          years.add(recordYear)
        }
      })

      return [...years].sort((a, b) => b.localeCompare(a))
    },
    filteredRecords(): LeaveRecord[] {
      return this.sortedRecords.filter((record) => {
        const targetDate = record.startDate ?? record.date
        const recordYear = targetDate.slice(0, 4)
        const recordMonth = targetDate.slice(5, 7)
        const matchesYear = this.historyFilters.year === 'all' || recordYear === this.historyFilters.year
        const matchesMonth = this.historyFilters.month === 'all' || recordMonth === this.historyFilters.month
        const matchesType = this.historyFilters.type === 'all' || record.type === this.historyFilters.type

        return matchesYear && matchesMonth && matchesType
      })
    }
  },
  actions: {
    getDb(): Firestore {
      const { $db, $firebaseConfigError } = useNuxtApp()

      if (!$db) {
        throw new Error($firebaseConfigError ?? 'Firebase 설정이 필요합니다.')
      }

      return $db
    },
    setHistoryFilter<K extends keyof LeaveState['historyFilters']>(
      key: K,
      value: LeaveState['historyFilters'][K]
    ) {
      this.historyFilters[key] = value
    },
    resetHistoryFilters() {
      this.historyFilters = {
        year: String(this.currentYear),
        month: 'all',
        type: 'all'
      }
    },
    userRoot(uid: string) {
      return doc(this.getDb(), 'users', uid)
    },
    settingsDoc(uid: string, year?: number) {
      return doc(this.getDb(), 'users', uid, 'leaveSettings', String(year ?? this.currentYear))
    },
    recordsCollection(uid: string) {
      return collection(this.getDb(), 'users', uid, 'leaveRecords')
    },
    async ensureUser(uid: string, profile: { displayName?: string | null; email?: string | null }) {
      this.displayName = profile.displayName ?? this.displayName
      await setDoc(
        this.userRoot(uid),
        {
          displayName: profile.displayName ?? '',
          email: profile.email ?? '',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
    },
    async fetchUser(uid: string) {
      const snap = await getDoc(this.userRoot(uid))
      this.displayName = snap.exists() ? (snap.data().displayName ?? '') : ''
    },
    async saveDisplayName(uid: string, displayName: string) {
      this.displayName = displayName
      await setDoc(
        this.userRoot(uid),
        {
          displayName,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
    },
    async fetchSetting(uid: string, year?: number) {
      const targetYear = year ?? this.currentYear
      this.currentYear = targetYear
      const snap = await getDoc(this.settingsDoc(uid, targetYear))

      if (!snap.exists()) {
        this.setting = createDefaultSetting(targetYear)
        return
      }

      const data = snap.data()
      const carriedOverDays = Number(data.carryOverDays ?? data.carriedOverDays ?? 0)

      this.setting = {
        ...createDefaultSetting(targetYear),
        ...data,
        year: targetYear,
        totalDays: Number(data.totalDays ?? 0),
        carryOverDays: carriedOverDays,
        carriedOverDays
      } as LeaveSetting
    },
    async saveSetting(uid: string, setting: LeaveSetting) {
      const totalDays = Number(setting.totalDays)
      const carryOverDays = Number(setting.carryOverDays ?? setting.carriedOverDays ?? 0)

      this.setting = {
        ...setting,
        totalDays,
        carryOverDays,
        carriedOverDays: carryOverDays
      }

      await setDoc(
        this.settingsDoc(uid, setting.year),
        {
          year: Number(setting.year),
          totalDays,
          carryOverDays,
          memo: setting.memo ?? '',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
    },
    async fetchRecords(uid: string) {
      const recordsQuery = query(this.recordsCollection(uid), orderBy('date', 'desc'))
      const snap = await getDocs(recordsQuery)
      this.records = snap.docs.map((recordDoc) => ({
        id: recordDoc.id,
        ...recordDoc.data()
      })) as LeaveRecord[]
    },
    async load(uid: string, year?: number) {
      const targetYear = year ?? this.currentYear
      this.loading = true
      try {
        await Promise.all([this.fetchSetting(uid, targetYear), this.fetchRecords(uid)])
      } finally {
        this.loading = false
      }
    },
    async addRecord(uid: string, record: LeaveRecord) {
      await addDoc(this.recordsCollection(uid), {
        date: record.startDate ?? record.date,
        startDate: record.startDate ?? record.date,
        endDate: record.endDate ?? record.startDate ?? record.date,
        type: record.type,
        days: Number(record.days ?? 0),
        reason: record.reason ?? '',
        memo: record.memo ?? record.note ?? '',
        note: record.note ?? '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      await this.fetchRecords(uid)
    },
    async updateRecord(uid: string, recordId: string, record: LeaveRecord) {
      await updateDoc(doc(this.getDb(), 'users', uid, 'leaveRecords', recordId), {
        date: record.startDate ?? record.date,
        startDate: record.startDate ?? record.date,
        endDate: record.endDate ?? record.startDate ?? record.date,
        type: record.type,
        days: Number(record.days ?? 0),
        reason: record.reason ?? '',
        memo: record.memo ?? record.note ?? '',
        note: record.note ?? '',
        updatedAt: serverTimestamp()
      })
      await this.fetchRecords(uid)
    },
    async deleteRecord(uid: string, recordId: string) {
      await deleteDoc(doc(this.getDb(), 'users', uid, 'leaveRecords', recordId))
      this.records = this.records.filter((record) => record.id !== recordId)
    }
  }
})





