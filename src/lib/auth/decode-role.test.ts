import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeRoleFromToken } from './decode-role';

const makeFakeToken = (payload: Record<string, unknown>): string => {
  const base64url = (input: string) =>
    Buffer.from(input, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
};

test('decodeRoleFromToken reads a valid role claim', () => {
  const token = makeFakeToken({ userId: 'abc', role: 'TECHNICIAN' });
  assert.equal(decodeRoleFromToken(token), 'TECHNICIAN');
});

test('decodeRoleFromToken returns null for an unrecognized role', () => {
  const token = makeFakeToken({ userId: 'abc', role: 'SUPERUSER' });
  assert.equal(decodeRoleFromToken(token), null);
});

test('decodeRoleFromToken returns null for a malformed token', () => {
  assert.equal(decodeRoleFromToken('not-a-jwt'), null);
});
