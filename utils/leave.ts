import type { LeaveApprovalStatus, LeaveRecord, LeaveSummary, LeaveType } from '~/types/leave'

export const leaveTypeLabels: Record<LeaveType, string> = {
  full: '연차',
  morning: '오전 반차',
  afternoon: '오후 반차',
  reserveTraining: '특별휴가'
}

export const leaveApprovalStatusLabels: Record<LeaveApprovalStatus, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '비승인'
}

export const getLeaveApprovalStatus = (record: LeaveRecord): LeaveApprovalStatus =>
  record.approvalStatus ?? 'approved'

export const isApprovedLeaveRecord = (record: LeaveRecord) => getLeaveApprovalStatus(record) === 'approved'

export const getLeaveDays = (type: LeaveType) => {
  if (type === 'reserveTraining') {
    return 0
  }

  return type === 'full' ? 1 : 0.5
}

export const calculateLeaveRecordDays = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) {
    return 0
  }

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const diff = end.getTime() - start.getTime()

  if (Number.isNaN(diff) || diff < 0) {
    return 0
  }

  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

export const calculateLeaveSummary = (
  annualDays: number,
  carriedOverDays: number,
  records: LeaveRecord[]
): LeaveSummary => {
  const total = annualDays + carriedOverDays
  const approvedRecords = records.filter(isApprovedLeaveRecord)
  const used = approvedRecords.reduce((sum, record) => sum + (record.days ?? getLeaveDays(record.type)), 0)

  return {
    total,
    used,
    remaining: Math.max(total - used, 0)
  }
}

export const formatLeaveDays = (days: number) => {
  if (Number.isInteger(days)) {
    return `${days}일`
  }

  return `${days.toFixed(1)}일`
}
