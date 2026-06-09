export const SUPER_ADMIN_ROLE = 'super_admin'
export const ADMIN_ROLE = 'admin'

export const OWNER_ROLES = ['bar', 'distillery', 'event_host', 'tour_operator']

export const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  bar: 'Bar Owner',
  distillery: 'Distillery Owner',
  tour_operator: 'Tour Operator',
  event_host: 'Event Host',
}

export const isSuperAdmin = (role?: string) => role === SUPER_ADMIN_ROLE
export const isAdmin = (role?: string) => role === ADMIN_ROLE
export const isPlatformRole = (role?: string) => role === SUPER_ADMIN_ROLE || role === ADMIN_ROLE
export const isOwnerRole = (role?: string) => !!role && OWNER_ROLES.includes(role)
