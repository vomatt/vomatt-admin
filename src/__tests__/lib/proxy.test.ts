/**
 * @jest-environment node
 */
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';

const SECRET = 'test-secret-for-proxy-test-0123456789';
process.env.SESSION_SECRET = SECRET;
process.env.API_URL = 'https://api.example.test';

const { proxy } = require('@/proxy') as typeof import('@/proxy');

function signToken({ roles = ['user', 'admin'], scope = 'admin', expiresIn = '15m', secret = SECRET } = {}) {
	return new SignJWT({ sub: 'user-1', roles, scope })
		.setProtectedHeader({ alg: 'HS512' })
		.setExpirationTime(expiresIn)
		.sign(new TextEncoder().encode(secret));
}

function refreshResponse(accessToken: string, refreshToken = 'r2') {
	return new Response(JSON.stringify({ success: true, data: { token: accessToken, refreshToken } }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

function requestFor(path: string, cookies: Record<string, string> = {}) {
	const cookie = Object.entries(cookies)
		.map(([name, value]) => `${name}=${value}`)
		.join('; ');
	return new NextRequest(`http://localhost:3003${path}`, { headers: cookie ? { cookie } : {} });
}

const fetchMock = jest.fn();
beforeEach(() => {
	fetchMock.mockReset();
	global.fetch = fetchMock;
});

describe('proxy', () => {
	it('redirects a signed-out request to login', async () => {
		const res = await proxy(requestFor('/tags'));
		expect(res.headers.get('location')).toBe('http://localhost:3003/login?redirect=%2Ftags');
	});

	it('guards the Studio too', async () => {
		const res = await proxy(requestFor('/sanity'));
		expect(res.headers.get('location')).toBe('http://localhost:3003/login?redirect=%2Fsanity');
	});

	it('lets a signed-out user open the login page', async () => {
		const res = await proxy(requestFor('/login'));
		expect(res.headers.get('location')).toBeNull();
	});

	it('lets an admin session through', async () => {
		const res = await proxy(requestFor('/tags', { accessToken: await signToken() }));
		expect(res.headers.get('location')).toBeNull();
	});

	it('signs out a token without the admin role', async () => {
		const res = await proxy(requestFor('/tags', { accessToken: await signToken({ roles: ['user'] }) }));

		expect(res.headers.get('location')).toBe(
			'http://localhost:3003/login?redirect=%2Ftags&session_expired=forbidden'
		);
		expect(res.cookies.get('accessToken')?.value).toBe('');
	});

	it('signs out an admin token from the consumer sign-in', async () => {
		const res = await proxy(requestFor('/tags', { accessToken: await signToken({ scope: 'user' }) }));

		expect(res.headers.get('location')).toBe(
			'http://localhost:3003/login?redirect=%2Ftags&session_expired=forbidden'
		);
	});

	it('signs out when a refresh returns a token without the admin role', async () => {
		fetchMock.mockResolvedValue(refreshResponse(await signToken({ roles: ['user'] })));

		const res = await proxy(requestFor('/tags', { refreshToken: 'r1' }));

		expect(res.headers.get('location')).toContain('session_expired=forbidden');
		expect(res.cookies.get('refreshToken')?.value).toBe('');
	});

	it('refreshes an expiring access token once and loads the page', async () => {
		const fresh = await signToken();
		fetchMock.mockResolvedValue(refreshResponse(fresh));

		const res = await proxy(
			requestFor('/tags', { accessToken: await signToken({ expiresIn: '30s' }), refreshToken: 'r1' })
		);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(res.headers.get('location')).toBeNull();
		expect(res.cookies.get('accessToken')?.value).toBe(fresh);
		expect(res.cookies.get('refreshToken')?.value).toBe('r2');
	});

	it('clears a refresh token the backend rejects', async () => {
		fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));

		const res = await proxy(requestFor('/tags', { refreshToken: 'dead' }));

		expect(res.headers.get('location')).toBe(
			'http://localhost:3003/login?redirect=%2Ftags&session_expired=expired'
		);
		expect(res.cookies.get('refreshToken')?.value).toBe('');
	});

	it('saves a rotation that fails verification and stops refreshing it', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		const foreign = await signToken({ secret: 'a-different-secret-0123456789abcdef' });
		fetchMock.mockResolvedValue(refreshResponse(foreign));

		const first = await proxy(requestFor('/tags', { refreshToken: 'r1' }));
		expect(first.cookies.get('refreshToken')?.value).toBe('r2');
		expect(first.cookies.get('auth-key-mismatch')?.value).toBe('r2');

		await proxy(requestFor('/tags', { accessToken: foreign, refreshToken: 'r2', 'auth-key-mismatch': 'r2' }));
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('sends a signed-in admin on /login to the redirect target', async () => {
		const res = await proxy(requestFor('/login?redirect=%2Flookups', { accessToken: await signToken() }));
		expect(res.headers.get('location')).toBe('http://localhost:3003/lookups');
	});
});
