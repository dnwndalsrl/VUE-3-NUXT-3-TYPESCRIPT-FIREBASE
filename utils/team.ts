export type TeamRole = '최고관리자' | 'CS팀' | '마케팅팀' | '개발팀'

export const teamOptions: TeamRole[] = ['최고관리자', 'CS팀', '마케팅팀', '개발팀']

export const isAdminTeam = (team?: string | null) => team === '최고관리자'
