/**
 * @jest-environment node
 */
const mockSetAuthTokens = jest.fn();
jest.mock('server-only', () => ({}));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('@/lib/api/auth', () => ({
	setAuthTokens: (tokens: unknown) => mockSetAuthTokens(tokens),
	getTokens: jest.fn(),
	clearAuthTokens: jest.fn(),
}));
process.env.API_URL = 'https://api.example.test';

import { getPasskeyLoginOptions, type PasskeyCredentialJSON, verifyPasskeyLogin } from '@/lib/api/services/auth';

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

describe('passkey sign-in', () => {
	const credential = { id: 'c1', rawId: 'c1', type: 'public-key' } as PasskeyCredentialJSON;

	it('asks the shared endpoint for request options', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { challenge: 'abc' } }));

		expect(await getPasskeyLoginOptions()).toEqual({ ok: true, options: { challenge: 'abc' } });
		expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/api/auth/passkey/login/options');
	});

	it('verifies at the admin endpoint and stores both tokens', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse({ success: true, data: { token: 'a1', refreshToken: 'r1', isNewUser: false, user: {} } })
		);

		expect(await verifyPasskeyLogin(credential)).toEqual({ ok: true });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.example.test/api/auth/admin/passkey/login/verify');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body)).toEqual({ credential });
		expect(mockSetAuthTokens).toHaveBeenCalledWith({ accessToken: 'a1', refreshToken: 'r1' });
	});

	it.each([
		[403, 'auth.admin.forbidden', 'This account does not have admin access.'],
		[403, 'auth.account_banned', 'This account is suspended.'],
		[401, 'auth.passkey.invalid', 'That passkey could not be verified. Try again.'],
	])('maps a %i %s without storing tokens', async (status, errorCode, message) => {
		fetchMock.mockResolvedValue(jsonResponse({ success: false, errorCode, message: 'no' }, status));

		expect(await verifyPasskeyLogin(credential)).toEqual({ ok: false, message });
		expect(mockSetAuthTokens).not.toHaveBeenCalled();
	});
});
