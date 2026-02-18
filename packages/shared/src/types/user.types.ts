export type UserRole = 'owner' | 'admin' | 'editor' | 'agent' | 'viewer'

export const USER_ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 5,
  admin: 4,
  editor: 3,
  agent: 2,
  viewer: 1,
}
