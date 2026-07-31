import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, ROLE_DASHBOARD_PATH } from '@/lib/auth/constants';
import { decodeRoleFromToken } from '@/lib/auth/decode-role';

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const role = decodeRoleFromToken(token);
  const expectedSegment = role ? ROLE_DASHBOARD_PATH[role] : undefined;

  if (!expectedSegment) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const requestedSegment = request.nextUrl.pathname.split('/')[2];
  if (requestedSegment !== expectedSegment) {
    return NextResponse.redirect(new URL(`/dashboard/${expectedSegment}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
