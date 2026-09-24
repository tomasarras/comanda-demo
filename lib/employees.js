import { ROLES } from "@/lib/roles";

export const ASSIGNABLE_ROLE_IDS = ROLES.map((r) => r.id);

export function serializeEmployee(e) {
  return { ...e, createdAt: e.createdAt.toISOString?.() ?? e.createdAt };
}

export function isValidRoleId(roleId) {
  return ASSIGNABLE_ROLE_IDS.includes(roleId);
}
