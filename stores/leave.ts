import { defineStore } from 'pinia'
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore
} from 'firebase/firestore'
import type {
  LeaveApprovalStatus,
  LeaveRecord,
  LeaveSetting,
  LeaveSummary,
  LeaveType,
  MemberLeaveStatus,
  PublicLeaveRecord
} from '~/types/leave'
import { calculateLeaveSummary, getLeaveApprovalStatus, isApprovedLeaveRecord } from '~/utils/leave'

type LeaveTypeFilter = LeaveType | 'all'

interface LeaveState {
  currentYear: number
  setting: LeaveSetting
  records: LeaveRecord[]
  publicRecords: PublicLeaveRecord[]
  allPublicRecords: PublicLeaveRecord[]
  approvalRecords: PublicLeaveRecord[]
  memberStatuses: MemberLeaveStatus[]
  allMemberStatuses: MemberLeaveStatus[]
  loading: boolean
  publicLoading: boolean
  approvalLoading: boolean
  memberStatusLoading: boolean
  publicError: string
  approvalError: string
  memberStatusError: string
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

const normalizeRecord = (record: LeaveRecord): LeaveRecord => ({
  ...record,
  approvalStatus: getLeaveApprovalStatus(record)
})

export const useLeaveStore = defineStore('leave', {
  state: (): LeaveState => ({
    currentYear: new Date().getFullYear(),
    setting: createDefaultSetting(),
    records: [],
    publicRecords: [],
    allPublicRecords: [],
    approvalRecords: [],
    memberStatuses: [],
    allMemberStatuses: [],
    loading: false,
    publicLoading: false,
    approvalLoading: false,
    memberStatusLoading: false,
    publicError: '',
    approvalError: '',
    memberStatusError: '',
    displayName: '',
    historyFilters: {
      year: String(new Date().getFullYear()),
      month: 'all',
      type: 'all'
    }
  }),
  getters: {
    approvedRecords: (state): LeaveRecord[] => state.records.filter(isApprovedLeaveRecord),
    summary: (state): LeaveSummary =>
      calculateLeaveSummary(state.setting.totalDays, state.setting.carriedOverDays, state.records),
    sortedRecords: (state): LeaveRecord[] =>
      [...state.records].sort((a, b) => (b.startDate ?? b.date).localeCompare(a.startDate ?? a.date)),
    sortedPublicRecords: (state): PublicLeaveRecord[] =>
      [...state.publicRecords].sort((a, b) => (a.startDate ?? a.date).localeCompare(b.startDate ?? b.date)),
    sortedAllPublicRecords: (state): PublicLeaveRecord[] =>
      [...state.allPublicRecords].sort((a, b) => (a.startDate ?? a.date).localeCompare(b.startDate ?? b.date)),
    sortedApprovalRecords: (state): PublicLeaveRecord[] =>
      [...state.approvalRecords].sort((a, b) => (a.startDate ?? a.date).localeCompare(b.startDate ?? b.date)),
    sortedMemberStatuses: (state): MemberLeaveStatus[] =>
      [...state.memberStatuses].sort((a, b) => b.summary.remaining - a.summary.remaining),
    sortedAllMemberStatuses: (state): MemberLeaveStatus[] =>
      [...state.allMemberStatuses].sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko')),
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
    usersCollection() {
      return collection(this.getDb(), 'users')
    },
    async fetchVisibleUsers(options: { includeAll?: boolean } = {}) {
      const authStore = useAuthStore()
      const team = authStore.profile?.team ?? ''
      const visibleUsersQuery = options.includeAll || authStore.isAdmin
        ? query(this.usersCollection())
        : query(this.usersCollection(), where('team', '==', team))

      return getDocs(visibleUsersQuery)
    },
    async ensureUser(uid: string, profile: { displayName?: string | null; email?: string | null; team?: string; userId?: string; name?: string }) {
      const authStore = useAuthStore()
      const displayName = profile.name ?? profile.displayName ?? authStore.profile?.name ?? this.displayName
      const team = profile.team ?? authStore.profile?.team ?? ''
      this.displayName = displayName
      await setDoc(
        this.userRoot(uid),
        {
          displayName,
          name: profile.name ?? authStore.profile?.name ?? displayName,
          userId: profile.userId ?? authStore.profile?.userId ?? '',
          team,
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
          name: displayName,
          displayName,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
    },
    async saveMemberName(uid: string, name: string) {
      const trimmedName = name.trim()
      await setDoc(
        this.userRoot(uid),
        {
          name: trimmedName,
          displayName: trimmedName,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
    },
    async approveMember(uid: string) {
      const authStore = useAuthStore()

      if (!authStore.isAdmin) {
        throw new Error('회원 승인 권한이 없습니다.')
      }

      await setDoc(
        this.userRoot(uid),
        {
          approved: true,
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
      const authStore = useAuthStore()

      this.setting = {
        ...createDefaultSetting(targetYear),
        ...data,
        year: targetYear,
        totalDays: Number(data.totalDays ?? 0),
        carryOverDays: carriedOverDays,
        carriedOverDays,
        team: data.team ?? authStore.profile?.team ?? ''
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
          team: setting.team ?? useAuthStore().profile?.team ?? '',
          memo: setting.memo ?? '',
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
    },
    async fetchRecords(uid: string) {
      const recordsQuery = query(this.recordsCollection(uid), orderBy('date', 'desc'))
      const snap = await getDocs(recordsQuery)
      this.records = snap.docs.map((recordDoc) => normalizeRecord({
        id: recordDoc.id,
        ...recordDoc.data()
      } as LeaveRecord))
    },
    async fetchRecordsForVisibleUsers(options: { includeAll?: boolean } = {}) {
      const usersSnap = await this.fetchVisibleUsers(options)
      const recordSnaps = await Promise.all(usersSnap.docs.map((userDoc) => getDocs(this.recordsCollection(userDoc.id))))

      return recordSnaps.flatMap((snap, index) => {
        const userDoc = usersSnap.docs[index]
        const user = userDoc.data()

        return snap.docs.map((recordDoc) => {
          const data = normalizeRecord(recordDoc.data() as LeaveRecord)

          return {
            id: recordDoc.id,
            ...data,
            uid: userDoc.id,
            ownerName: user.name || user.displayName || data.ownerName || user.userId || '사용자',
            team: data.team ?? user.team ?? ''
          }
        })
      }) as PublicLeaveRecord[]
    },
    async fetchPublicRecords() {
      this.publicLoading = true
      this.publicError = ''
      try {
        this.publicRecords = (await this.fetchRecordsForVisibleUsers())
          .filter(isApprovedLeaveRecord)
          .sort((a, b) => (b.startDate ?? b.date).localeCompare(a.startDate ?? a.date))
      } catch (error) {
        this.publicRecords = []
        this.publicError = error instanceof Error ? error.message : '공용 캘린더를 불러오지 못했습니다.'
      } finally {
        this.publicLoading = false
      }
    },
    async fetchAllPublicRecords() {
      this.publicLoading = true
      this.publicError = ''
      try {
        this.allPublicRecords = (await this.fetchRecordsForVisibleUsers({ includeAll: true }))
          .filter(isApprovedLeaveRecord)
          .sort((a, b) => (b.startDate ?? b.date).localeCompare(a.startDate ?? a.date))
      } catch (error) {
        this.allPublicRecords = []
        this.publicError = error instanceof Error ? error.message : '전체 회원 연차 일정을 불러오지 못했습니다.'
      } finally {
        this.publicLoading = false
      }
    },
    async fetchApprovalRecords() {
      const authStore = useAuthStore()

      if (!authStore.isAdmin) {
        this.approvalRecords = []
        return
      }

      this.approvalLoading = true
      this.approvalError = ''
      try {
        this.approvalRecords = (await this.fetchRecordsForVisibleUsers())
          .filter((record) => getLeaveApprovalStatus(record) === 'pending')
          .sort((a, b) => (a.startDate ?? a.date).localeCompare(b.startDate ?? b.date))
      } catch (error) {
        this.approvalRecords = []
        this.approvalError = error instanceof Error ? error.message : '승인 대기 내역을 불러오지 못했습니다.'
      } finally {
        this.approvalLoading = false
      }
    },
    async buildMemberStatuses(year: number, options: { includeAll?: boolean } = {}) {
      const usersSnap = await this.fetchVisibleUsers(options)

      return Promise.all(usersSnap.docs.map(async (userDoc) => {
        const uid = userDoc.id
        const user = userDoc.data()
        const [settingSnap, recordsSnap] = await Promise.all([
          getDoc(this.settingsDoc(uid, year)),
          getDocs(this.recordsCollection(uid))
        ])

        const settingData = settingSnap.exists() ? settingSnap.data() : null
        const carriedOverDays = Number(settingData?.carryOverDays ?? settingData?.carriedOverDays ?? 0)
        const setting = settingData
          ? ({
              ...createDefaultSetting(year),
              ...settingData,
              year,
              totalDays: Number(settingData.totalDays ?? 0),
              carryOverDays: carriedOverDays,
              carriedOverDays,
              team: settingData.team ?? user.team ?? ''
            } as LeaveSetting)
          : createDefaultSetting(year)
        const records = recordsSnap.docs
          .map((recordDoc) => normalizeRecord({
            id: recordDoc.id,
            ...recordDoc.data(),
            uid
          } as LeaveRecord))
          .filter((record) => (record.startDate ?? record.date).startsWith(String(year)))
        const approvedRecords = records.filter(isApprovedLeaveRecord)
        const summary = calculateLeaveSummary(setting.totalDays, setting.carriedOverDays, approvedRecords)

        return {
          uid,
          userId: user.userId ?? '',
          displayName: user.name || user.displayName || user.userId || user.email || '사용자',
          email: user.email ?? '',
          team: user.team ?? '',
          approved: Boolean(user.approved) || user.team === '최고관리자',
          setting,
          summary,
          recordsCount: approvedRecords.length,
          pendingRecordsCount: records.filter((record) => getLeaveApprovalStatus(record) === 'pending').length,
          rejectedRecordsCount: records.filter((record) => getLeaveApprovalStatus(record) === 'rejected').length
        }
      }))
    },
    async fetchMemberStatuses(year?: number) {
      const targetYear = year ?? this.currentYear
      this.memberStatusLoading = true
      this.memberStatusError = ''

      try {
        this.memberStatuses = await this.buildMemberStatuses(targetYear)
      } catch (error) {
        this.memberStatuses = []
        this.memberStatusError = error instanceof Error ? error.message : '회원별 연차 현황을 불러오지 못했습니다.'
      } finally {
        this.memberStatusLoading = false
      }
    },
    async fetchAllMembersOverview(year?: number) {
      const targetYear = year ?? this.currentYear
      this.memberStatusLoading = true
      this.memberStatusError = ''

      try {
        const usersSnap = await this.fetchVisibleUsers({ includeAll: true })
        this.allMemberStatuses = usersSnap.docs.map((userDoc) => {
          const user = userDoc.data()
          const setting = createDefaultSetting(targetYear)

          return {
            uid: userDoc.id,
            userId: user.userId ?? '',
            displayName: user.name || user.displayName || user.userId || user.email || '사용자',
            email: user.email ?? '',
            team: user.team ?? '',
            approved: Boolean(user.approved) || user.team === '최고관리자',
            setting,
            summary: calculateLeaveSummary(setting.totalDays, setting.carriedOverDays, []),
            recordsCount: 0,
            pendingRecordsCount: 0,
            rejectedRecordsCount: 0
          }
        })
      } catch (error) {
        this.allMemberStatuses = []
        this.memberStatusError = error instanceof Error ? error.message : '전체 회원 현황을 불러오지 못했습니다.'
      } finally {
        this.memberStatusLoading = false
      }
    },    async fetchAllMemberStatuses(year?: number) {
      const targetYear = year ?? this.currentYear
      this.memberStatusLoading = true
      this.memberStatusError = ''

      try {
        this.allMemberStatuses = await this.buildMemberStatuses(targetYear, { includeAll: true })
      } catch (error) {
        this.allMemberStatuses = []
        this.memberStatusError = error instanceof Error ? error.message : '전체 회원 현황을 불러오지 못했습니다.'
      } finally {
        this.memberStatusLoading = false
      }
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
      const authStore = useAuthStore()
      const ownerName = authStore.profile?.name || authStore.user?.displayName || this.displayName || authStore.profile?.userId || '사용자'
      const ownerEmail = authStore.user?.email ?? ''
      const team = authStore.profile?.team ?? ''
      const approvalStatus: LeaveApprovalStatus = authStore.isAdmin ? 'approved' : 'pending'
      const payload: Record<string, unknown> = {
        uid,
        ownerName,
        ownerEmail,
        team,
        date: record.startDate ?? record.date,
        startDate: record.startDate ?? record.date,
        endDate: record.endDate ?? record.startDate ?? record.date,
        type: record.type,
        days: Number(record.days ?? 0),
        reason: record.reason ?? '',
        memo: record.memo ?? record.note ?? '',
        note: record.note ?? '',
        approvalStatus,
        approvalMemo: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      if (approvalStatus === 'approved') {
        payload.approvedAt = serverTimestamp()
        payload.reviewedBy = authStore.user?.uid ?? ''
      }

      await addDoc(this.recordsCollection(uid), payload)
      await this.fetchRecords(uid)
    },
    async updateRecord(uid: string, recordId: string, record: LeaveRecord) {
      const authStore = useAuthStore()
      const payload: Record<string, unknown> = {
        team: authStore.profile?.team ?? record.team ?? '',
        date: record.startDate ?? record.date,
        startDate: record.startDate ?? record.date,
        endDate: record.endDate ?? record.startDate ?? record.date,
        type: record.type,
        days: Number(record.days ?? 0),
        reason: record.reason ?? '',
        memo: record.memo ?? record.note ?? '',
        note: record.note ?? '',
        updatedAt: serverTimestamp()
      }

      if (!authStore.isAdmin) {
        payload.approvalStatus = 'pending'
        payload.approvalMemo = ''
        payload.approvedAt = deleteField()
        payload.rejectedAt = deleteField()
        payload.reviewedBy = deleteField()
      }

      await updateDoc(doc(this.getDb(), 'users', uid, 'leaveRecords', recordId), payload)
      await this.fetchRecords(uid)
    },
    async updateRecordApproval(uid: string, recordId: string, status: Exclude<LeaveApprovalStatus, 'pending'>, memo = '') {
      const authStore = useAuthStore()

      if (!authStore.isAdmin) {
        throw new Error('연차 승인 권한이 없습니다.')
      }

      const payload: Record<string, unknown> = {
        approvalStatus: status,
        approvalMemo: memo.trim(),
        reviewedBy: authStore.user?.uid ?? '',
        updatedAt: serverTimestamp()
      }

      if (status === 'approved') {
        payload.approvedAt = serverTimestamp()
        payload.rejectedAt = deleteField()
      } else {
        payload.rejectedAt = serverTimestamp()
        payload.approvedAt = deleteField()
      }

      await updateDoc(doc(this.getDb(), 'users', uid, 'leaveRecords', recordId), payload)
      this.approvalRecords = this.approvalRecords.filter((record) => record.id !== recordId)
      await Promise.all([this.fetchMemberStatuses(this.currentYear), this.fetchPublicRecords()])
    },
    async deleteRecord(uid: string, recordId: string) {
      await deleteDoc(doc(this.getDb(), 'users', uid, 'leaveRecords', recordId))
      this.records = this.records.filter((record) => record.id !== recordId)
    },
    async deleteMember(uid: string) {
      const authStore = useAuthStore()

      if (!authStore.isAdmin) {
        throw new Error('회원 삭제 권한이 없습니다.')
      }

      if (authStore.user?.uid === uid) {
        throw new Error('현재 로그인한 최고관리자 계정은 삭제할 수 없습니다.')
      }

      const [settingsSnap, recordsSnap] = await Promise.all([
        getDocs(collection(this.getDb(), 'users', uid, 'leaveSettings')),
        getDocs(this.recordsCollection(uid))
      ])

      await Promise.all([
        ...settingsSnap.docs.map((settingDoc) => deleteDoc(settingDoc.ref)),
        ...recordsSnap.docs.map((recordDoc) => deleteDoc(recordDoc.ref))
      ])

      await deleteDoc(this.userRoot(uid))
      this.memberStatuses = this.memberStatuses.filter((member) => member.uid !== uid)
      this.allMemberStatuses = this.allMemberStatuses.filter((member) => member.uid !== uid)
      this.publicRecords = this.publicRecords.filter((record) => record.uid !== uid)
      this.allPublicRecords = this.allPublicRecords.filter((record) => record.uid !== uid)
      this.approvalRecords = this.approvalRecords.filter((record) => record.uid !== uid)
    }
  }
})