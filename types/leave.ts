export type LeaveType = 'full' | 'morning' | 'afternoon'

export interface LeaveSetting {
  year: number
  totalDays: number
  carryOverDays?: number
  carriedOverDays: number
  memo?: string
  updatedAt?: Date
}

export interface LeaveRecord {
  id?: string
  uid?: string
  ownerName?: string
  ownerEmail?: string
  date: string
  startDate?: string
  endDate?: string
  type: LeaveType
  days?: number
  reason?: string
  memo?: string
  note?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface PublicLeaveRecord extends LeaveRecord {
  uid: string
  ownerName: string
}

export interface LeaveSummary {
  total: number
  used: number
  remaining: number
}
