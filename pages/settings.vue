<script setup lang="ts">
import type { PublicLeaveRecord } from '~/types/leave'

const authStore = useAuthStore()
const leaveStore = useLeaveStore()

const selectedYear = ref(new Date().getFullYear())
const selectedUid = ref('')
const saving = ref(false)
const deleting = ref(false)
const approvingMember = ref(false)
const reviewingRecordId = ref('')
const saved = ref(false)
const errorMessage = ref('')
const approvalPage = ref(1)
const memberPage = ref(1)
const pageSize = 5

const form = reactive({
  name: '',
  totalDays: 15,
  carryOverDays: 0
})

const loadAdminData = async () => {
  await Promise.all([
    leaveStore.fetchMemberStatuses(selectedYear.value),
    leaveStore.fetchApprovalRecords()
  ])
  selectedUid.value = leaveStore.memberStatuses.find((member) => member.uid === selectedUid.value)?.uid
    ?? leaveStore.memberStatuses[0]?.uid
    ?? ''
}

watch(
  () => authStore.profile,
  async (profile) => {
    if (!profile) {
      return
    }

    if (!authStore.isAdmin) {
      await navigateTo('/dashboard')
      return
    }

    await loadAdminData()
  },
  { immediate: true }
)

watch(selectedYear, async () => {
  if (authStore.isAdmin) {
    await loadAdminData()
  }
})

const members = computed(() => leaveStore.memberStatuses)
const pendingRecords = computed(() => leaveStore.sortedApprovalRecords)
const paginatedPendingRecords = computed(() => {
  const start = (approvalPage.value - 1) * pageSize
  return pendingRecords.value.slice(start, start + pageSize)
})
const paginatedMembers = computed(() => {
  const start = (memberPage.value - 1) * pageSize
  return members.value.slice(start, start + pageSize)
})
const selectedMember = computed(() => members.value.find((member) => member.uid === selectedUid.value) ?? null)
const actualTotalDays = computed(() => Number(form.totalDays || 0) + Number(form.carryOverDays || 0))

watch(
  () => pendingRecords.value.length,
  () => {
    approvalPage.value = 1
  }
)

watch(
  () => members.value.length,
  () => {
    memberPage.value = 1
  }
)

watch(
  selectedMember,
  (member) => {
    if (!member) {
      form.name = ''
      form.totalDays = 15
      form.carryOverDays = 0
      return
    }

    form.name = member.displayName
    form.totalDays = Number(member.setting.totalDays ?? 15)
    form.carryOverDays = Number(member.setting.carryOverDays ?? member.setting.carriedOverDays ?? 0)
  },
  { immediate: true }
)

const save = async () => {
  const member = selectedMember.value
  if (!authStore.isAdmin || !member) {
    errorMessage.value = '설정을 저장할 회원을 선택해 주세요.'
    return
  }

  const year = Number(selectedYear.value)
  const name = form.name.trim()
  const totalDays = Number(form.totalDays)
  const carryOverDays = Number(form.carryOverDays)

  if (!name) {
    errorMessage.value = '회원 이름을 입력해 주세요.'
    return
  }

  if (!year || totalDays < 0 || carryOverDays < 0) {
    errorMessage.value = '연도와 연차 수치를 올바르게 입력해 주세요.'
    return
  }

  saving.value = true
  saved.value = false
  errorMessage.value = ''

  try {
    await Promise.all([
      leaveStore.saveMemberName(member.uid, name),
      leaveStore.saveSetting(member.uid, {
        year,
        totalDays,
        carryOverDays,
        carriedOverDays: carryOverDays,
        team: member.team
      })
    ])
    await loadAdminData()
    selectedUid.value = member.uid
    saved.value = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '설정을 저장하지 못했습니다.'
  } finally {
    saving.value = false
  }
}

const deleteMember = async () => {
  const member = selectedMember.value
  if (!authStore.isAdmin || !member) {
    errorMessage.value = '삭제할 회원을 선택해 주세요.'
    return
  }

  if (!confirm(`${member.displayName} 회원과 연차 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) {
    return
  }

  deleting.value = true
  saved.value = false
  errorMessage.value = ''

  try {
    await leaveStore.deleteMember(member.uid)
    await loadAdminData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '회원 정보를 삭제하지 못했습니다.'
  } finally {
    deleting.value = false
  }
}

const approveMember = async () => {
  const member = selectedMember.value
  if (!authStore.isAdmin || !member) {
    errorMessage.value = '승인할 회원을 선택해 주세요.'
    return
  }

  approvingMember.value = true
  saved.value = false
  errorMessage.value = ''

  try {
    await leaveStore.approveMember(member.uid)
    await loadAdminData()
    selectedUid.value = member.uid
    saved.value = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '회원 승인에 실패했습니다.'
  } finally {
    approvingMember.value = false
  }
}

const reviewRecord = async (record: PublicLeaveRecord, status: 'approved' | 'rejected') => {
  if (!record.id) {
    return
  }

  reviewingRecordId.value = record.id
  errorMessage.value = ''

  try {
    await leaveStore.updateRecordApproval(record.uid, record.id, status)
    await loadAdminData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '연차 승인 상태를 변경하지 못했습니다.'
  } finally {
    reviewingRecordId.value = ''
  }
}
</script>

<template>
  <section class="page page--wide">
    <header class="page-header">
      <div>
        <p class="eyebrow">Admin Settings</p>
        <h1>회원 연차 관리</h1>
      </div>
    </header>

    <section class="content-panel approval-panel">
      <div class="panel-header">
        <div>
          <h2>연차 승인 대기</h2>
          <p>승인된 연차만 공용 캘린더와 팀별 현황에 반영됩니다.</p>
        </div>
        <span v-if="leaveStore.approvalLoading">불러오는 중</span>
        <AppButton v-else variant="secondary" @click="leaveStore.fetchApprovalRecords">새로고침</AppButton>
      </div>

      <p v-if="leaveStore.approvalError" class="form-error">{{ leaveStore.approvalError }}</p>

      <div v-else-if="pendingRecords.length" class="record-list-group">
        <div class="record-list approval-list">
          <article v-for="record in paginatedPendingRecords" :key="record.id" class="record-item record-item--editable approval-item">
            <div>
              <strong>{{ record.ownerName }}</strong>
              <p>
                {{ record.startDate || record.date }}
                <template v-if="record.endDate && record.endDate !== (record.startDate || record.date)">
                  - {{ record.endDate }}
                </template>
                · {{ leaveTypeLabels[record.type] }} · {{ formatLeaveDays(record.days ?? getLeaveDays(record.type)) }}
              </p>
              <small>{{ record.memo || record.note || record.reason || '사유 없음' }}</small>
            </div>
            <div class="record-actions">
              <AppButton
                variant="secondary"
                :disabled="reviewingRecordId === record.id"
                @click="reviewRecord(record, 'approved')"
              >승인</AppButton>
              <AppButton
                variant="danger"
                :disabled="reviewingRecordId === record.id"
                @click="reviewRecord(record, 'rejected')"
              >비승인</AppButton>
            </div>
          </article>
        </div>
        <AppPagination v-model:page="approvalPage" :total="pendingRecords.length" :page-size="pageSize" />
      </div>
      <p v-else class="empty-state">승인 대기 중인 연차가 없습니다.</p>
    </section>

    <div class="settings-admin-layout">
      <section class="content-panel">
        <div class="panel-header">
          <h2>회원 선택</h2>
          <span v-if="leaveStore.memberStatusLoading">불러오는 중</span>
        </div>

        <label class="field">
          <span class="field__label">기준 연도</span>
          <input v-model.number="selectedYear" class="field__control" type="number" min="2000" max="2100">
        </label>

        <div v-if="members.length" class="settings-member-list-group">
          <div class="settings-member-list">
            <button
              v-for="member in paginatedMembers"
              :key="member.uid"
              type="button"
              class="settings-member"
              :class="{ 'settings-member--active': member.uid === selectedUid }"
              @click="selectedUid = member.uid"
            >
              <strong>{{ member.displayName }}</strong>
              <span>{{ member.team }} · {{ member.userId || '아이디 없음' }} · {{ member.approved ? '승인됨' : '승인 대기' }}</span>
              <small v-if="member.pendingRecordsCount">연차 승인 대기 {{ member.pendingRecordsCount }}건</small>
            </button>
          </div>
          <AppPagination v-model:page="memberPage" :total="members.length" :page-size="pageSize" />
        </div>
        <p v-else class="empty-state">관리할 회원이 없습니다.</p>
      </section>

      <section class="form-card">
        <div class="panel-header">
          <h2>{{ selectedMember?.displayName || '회원 선택' }}</h2>
          <span>{{ selectedMember?.approved ? '승인됨' : '승인 대기' }}</span>
        </div>

        <form class="admin-setting-form" @submit.prevent="save">
          <AppInput v-model="form.name" label="이름" placeholder="캘린더와 목록에 표시될 이름" />
          <AppInput v-model="form.totalDays" label="올해 총 연차" type="number" :min="0" :step="0.5" />
          <AppInput v-model="form.carryOverDays" label="이월 연차" type="number" :min="0" :step="0.5" />

          <div class="readonly-field">
            <span>실제 총 연차</span>
            <strong>{{ formatLeaveDays(actualTotalDays) }}</strong>
          </div>

          <div class="admin-setting-actions">
            <AppButton
              v-if="selectedMember && !selectedMember.approved"
              variant="secondary"
              :disabled="saving || deleting || approvingMember"
              @click="approveMember"
            >회원 승인</AppButton>
            <AppButton type="submit" :disabled="saving || deleting || approvingMember || !selectedMember">설정 저장</AppButton>
            <AppButton variant="danger" :disabled="saving || deleting || approvingMember || !selectedMember" @click="deleteMember">
              회원 삭제
            </AppButton>
          </div>
        </form>

        <p v-if="saved" class="success-message">회원 연차 설정을 저장했습니다.</p>
        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
      </section>
    </div>
  </section>
</template>