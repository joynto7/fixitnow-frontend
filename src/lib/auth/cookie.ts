import Cookies from 'js-cookie';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE_DAYS } from './constants';

export const setAuthCookie = (token: string): void => {
  Cookies.set(AUTH_COOKIE_NAME, token, { expires: AUTH_COOKIE_MAX_AGE_DAYS, sameSite: 'lax' });
};

export const getAuthCookie = (): string | undefined => Cookies.get(AUTH_COOKIE_NAME);

export const clearAuthCookie = (): void => {
  Cookies.remove(AUTH_COOKIE_NAME);
};
