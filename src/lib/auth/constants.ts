import type { Role } from './decode-role';

export const AUTH_COOKIE_NAME = 'fixitnow_token';
export const AUTH_COOKIE_MAX_AGE_DAYS = 7;

export const ROLE_DASHBOARD_PATH: Record<Role, string> = {
  CUSTOMER: 'customer',
  TECHNICIAN: 'technician',
  ADMIN: 'admin',
};
