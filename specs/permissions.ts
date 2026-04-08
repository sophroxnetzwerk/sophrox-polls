import { Role } from "./types"

export type Permission = 
  | "view:poll"
  | "vote:poll"
  | "create:poll"
  | "edit:own_polls"
  | "delete:any_poll"
  | "manage:all_polls"
  | "manage:users"
  | "assign:roles"

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  voter: [
    "view:poll",
    "vote:poll",
  ],
  creator: [
    "view:poll",
    "vote:poll",
    "create:poll",
    "edit:own_polls",
  ],
  admin: [
    "view:poll",
    "vote:poll",
    "create:poll",
    "edit:own_polls",
    "delete:any_poll",
    "manage:all_polls",
    "manage:users",
    "assign:roles",
  ],
}

export const can = (role: Role, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export const hasPermission = (userRole: Role, permission: Permission): boolean => {
  return can(userRole, permission)
}
