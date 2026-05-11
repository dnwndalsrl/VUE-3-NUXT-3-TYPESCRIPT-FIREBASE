export type LeaveType = 'full' | 'morning' | 'afternoon' | 'reserveTraining'
export type LeaveApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveSetting {
  year: number
  totalDays: number
  carryOverDays?: number
  carriedOverDays: number
  team?: string
  memo?: string
  updatedAt?: Date
}

export interface LeaveRecord {
  id?: string
  uid?: string
  ownerName?: string
  ownerEmail?: string
  team?: string
  date: string
  startDate?: string
  endDate?: string
  type: LeaveType
  days?: number
  reason?: string
  memo?: string
  note?: string
  approvalStatus?: LeaveApprovalStatus
  approvalMemo?: string
  approvedAt?: Date
  rejectedAt?: Date
  reviewedBy?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface PublicLeaveRecord extends LeaveRecord {
  uid: string
  ownerName: string
  team?: string
}

export interface LeaveSummary {
  total: number
  used: number
  remaining: number
}

export interface MemberLeaveStatus {
  uid: string
  userId: string
  displayName: string
  email: string
  team: string
  approved: boolean
  setting: LeaveSetting
  summary: LeaveSummary
  recordsCount: number
  pendingRecordsCount: number
  rejectedRecordsCount: number
}
