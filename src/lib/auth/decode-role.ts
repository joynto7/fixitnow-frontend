export type Role = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';

const VALID_ROLES: Role[] = ['CUSTOMER', 'TECHNICIAN', 'ADMIN'];

// Edge-runtime-safe (no Buffer): normalizes base64url to base64 and pads it before atob.
export const decodeRoleFromToken = (token: string): Role | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = JSON.parse(atob(padded)) as { role?: unknown };
    return VALID_ROLES.includes(json.role as Role) ? (json.role as Role) : null;
  } catch {
    return null;
  }
};
