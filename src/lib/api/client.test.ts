import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch } from './client';
import { ApiError, stripFieldPrefix } from './error';

test('stripFieldPrefix strips the body/query/params namespace but keeps nested paths', () => {
  assert.equal(stripFieldPrefix('body.email'), 'email');
  assert.equal(stripFieldPrefix('body.slots.0.endTime'), 'slots.0.endTime');
  assert.equal(stripFieldPrefix('query.page'), 'page');
  assert.equal(stripFieldPrefix('role'), 'role');
});

const originalFetch = global.fetch;
const originalEnv = process.env.NEXT_PUBLIC_API_URL;

test.beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000/api';
});

test.afterEach(() => {
  global.fetch = originalFetch;
  process.env.NEXT_PUBLIC_API_URL = originalEnv;
});

test('apiFetch returns data on a successful envelope', async () => {
  global.fetch = (async () =>
    new Response(JSON.stringify({ success: true, message: 'ok', data: { id: '1' } }), { status: 200 })) as typeof fetch;

  const result = await apiFetch<{ id: string }>('/technicians/1');
  assert.deepEqual(result.data, { id: '1' });
});

test('apiFetch throws ApiError with errorDetails on a failed envelope', async () => {
  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        success: false,
        message: 'Validation failed',
        errorDetails: [{ field: 'email', message: 'A valid email is required' }],
      }),
      { status: 400 }
    )) as typeof fetch;

  await assert.rejects(
    () => apiFetch('/auth/register', { method: 'POST', body: { email: 'bad' } }),
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.deepEqual(err.errorDetails, [{ field: 'email', message: 'A valid email is required' }]);
      return true;
    }
  );
});

test('apiFetch throws ApiError on a network-level non-JSON failure status with no envelope fields', async () => {
  global.fetch = (async () => new Response(JSON.stringify({ success: false, message: 'Not found' }), { status: 404 })) as typeof fetch;

  await assert.rejects(
    () => apiFetch('/bookings/does-not-exist'),
    (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 404);
      assert.equal(err.errorDetails, null);
      return true;
    }
  );
});
