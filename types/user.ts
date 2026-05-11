import type { TeamRole } from '~/utils/team'

export interface UserProfile {
  uid: string
  userId: string
  name: string
  team: TeamRole
  displayName: string
  email: string
  approved?: boolean
}
