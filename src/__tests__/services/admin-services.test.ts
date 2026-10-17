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
import { setLookupActive } from '@/lib/api/services/lookups';
import { createTag, deleteTag } from '@/lib/api/services/tags';

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

describe('requestOtp', () => {
	it('asks for an admin-only code', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: true, data: null }));

		await requestOtp(' Admin@Example.com ');

		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			email: 'admin@example.com',
			checkRole: 'true',
		});
	});

	it('explains a non-admin account', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: false, errorCode: 'auth.admin.forbidden' }, 403));

		expect(await requestOtp('user@example.com')).toEqual({
			ok: false,
			message: 'This account does not have admin access.',
		});
	});
});
