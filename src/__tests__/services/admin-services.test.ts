/**
 * @jest-environment node
 */
const mockRefresh = jest.fn();

jest.mock('server-only', () => ({}));
jest.mock('next/navigation', () => ({
	redirect: (path: string) => {
		throw new Error(`NEXT_REDIRECT ${path}`);
	},
	// Like Next's: lets redirects through attempt()
	unstable_rethrow: (error: unknown) => {
		if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) throw error;
	},
}));
jest.mock('next/cache', () => ({ refresh: () => mockRefresh() }));
jest.mock('next/headers', () => ({
	cookies: async () => ({
		get: (name: string) => (name === 'accessToken' ? { value: 'admin-token' } : undefined),
	}),
}));

process.env.API_URL = 'https://api.example.test';

import { requestOtp } from '@/lib/api/services/auth';
import { deleteComment } from '@/lib/api/services/comments';
import { setLookupActive } from '@/lib/api/services/lookups';
import { closePoll, deletePoll, restorePoll } from '@/lib/api/services/polls';
import { createTag, deleteTag } from '@/lib/api/services/tags';
import { setUserRoles, suspendUser, unlockUserLogin } from '@/lib/api/services/users';

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

const fetchMock = jest.fn();
beforeEach(() => {
	jest.clearAllMocks();
	fetchMock.mockReset();
	global.fetch = fetchMock;
});

const input = { name: 'Food', slug: null, description: null, displayOrder: 0 };

describe('tag actions', () => {
	it('returns the created tag and refreshes the page', async () => {
		const tag = { id: 't1', name: 'Food', slug: 'food', description: null, displayOrder: 0, usageCount: 0 };
		fetchMock.mockResolvedValue(jsonResponse({ success: true, data: tag }));

		const result = await createTag(input);

		expect(result).toEqual({ ok: true, data: tag });
		expect(mockRefresh).toHaveBeenCalled();
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.example.test/api/admin/tags');
		expect(init.method).toBe('POST');
		expect(new Headers(init.headers).get('Authorization')).toBe('Bearer admin-token');
	});

	it('returns the API error code and message without refreshing', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse({ success: false, errorCode: 'tag.in_use', message: 'Tag is in use' }, 409)
		);

		const result = await deleteTag('t1');

		expect(result).toEqual({ ok: false, status: 409, errorCode: 'tag.in_use', message: 'Tag is in use' });
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it('sends the user back to login when the API forbids the request', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: false, errorCode: 'common.forbidden' }, 403));

		await expect(createTag(input)).rejects.toThrow('NEXT_REDIRECT /login?session_expired=forbidden');
	});
});

describe('lookup actions', () => {
	it('deactivates through the PATCH endpoint', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { success: true } }));

		await setLookupActive('l1', false);

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.example.test/api/admin/lookups/l1/deactivate');
		expect(init.method).toBe('PATCH');
	});
});

describe('user actions', () => {
	it('replaces the roles with PUT', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { id: 'u1' } }));

		await setUserRoles('u1', ['user', 'moderator']);

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.example.test/api/admin/users/u1/roles');
		expect(init.method).toBe('PUT');
		expect(JSON.parse(init.body)).toEqual({ roles: ['user', 'moderator'] });
	});

	it('sends the suspend reason', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { id: 'u1', active: false } }));

		await suspendUser('u1', 'Spam');

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.example.test/api/admin/users/u1/suspend');
		expect(init.method).toBe('PATCH');
		expect(JSON.parse(init.body)).toEqual({ reason: 'Spam' });
	});

	it('sends the unlock-login scope', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { clearedEntries: 3 } }));

		const result = await unlockUserLogin('u1', { channels: ['email'], clear: [], ip: '203.0.113.5' });

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.example.test/api/admin/users/u1/unlock-login');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body)).toEqual({ channels: ['email'], clear: [], ip: '203.0.113.5' });
		expect(result).toMatchObject({ ok: true, data: { clearedEntries: 3 } });
	});

	it('keeps the session when the API refuses a self-action', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(
				{ success: false, errorCode: 'admin.self_action_forbidden', message: 'You cannot suspend yourself' },
				403
			)
		);

		expect(await suspendUser('me', null)).toEqual({
			ok: false,
			status: 403,
			errorCode: 'admin.self_action_forbidden',
			message: 'You cannot suspend yourself',
		});
	});

	it('sends a suspended admin back to login', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: false, errorCode: 'auth.account_banned' }, 403));

		await expect(suspendUser('u1', null)).rejects.toThrow('NEXT_REDIRECT /login?session_expired=forbidden');
	});
});

describe('poll and comment actions', () => {
	it.each([
		['close', () => closePoll('v1'), 'PUT', '/api/admin/votes/v1/close'],
		['delete', () => deletePoll('v1'), 'DELETE', '/api/admin/votes/v1'],
		['restore', () => restorePoll('v1'), 'PATCH', '/api/admin/votes/v1/restore'],
		['delete comment', () => deleteComment('c1'), 'DELETE', '/api/admin/comments/c1'],
	])('%s calls %s', async (_name, run, method, path) => {
		fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { success: true } }));

		const result = await run();

		expect(result.ok).toBe(true);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(`https://api.example.test${path}`);
		expect(init.method).toBe(method);
		expect(mockRefresh).toHaveBeenCalled();
	});
});

describe('requestOtp', () => {
	it('asks the admin console endpoint for a code', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: true, data: null }));

		await requestOtp(' Admin@Example.com ');

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.example.test/api/auth/admin/send-otp');
		expect(JSON.parse(init.body)).toEqual({ email: 'admin@example.com' });
	});

	it('explains a non-admin account', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: false, errorCode: 'auth.admin.forbidden' }, 403));

		expect(await requestOtp('user@example.com')).toEqual({
			ok: false,
			message: 'This account does not have admin access.',
		});
	});
});
