/**
 * @jest-environment node
 *
 * Bounded exhaustive check of refresh-token rotation (see
 * .claude/skills/verify-refresh-rotation/SKILL.md). Runs the real proxy and
 * tokens code under every ordering of browser requests, proxy instances, API
 * replies and cookie deliveries up to the bounds below, against a stand-in
 * for vomatt-api's RefreshTokenService.rotate. Not part of `npm test`:
 *   npx jest --testMatch '**\/verification/*.check.ts'
 */

import type { NextRequest } from 'next/server';

// jose stand-in: tokens are JSON, expiry is exact against the controlled clock.
// Signatures are out of scope; every token the API issues verifies.
let clock = 0;
jest.mock('jose', () => ({
	jwtVerify: async (token: string) => {
		const payload = JSON.parse(token);
		if (payload.exp * 1000 <= clock) throw new Error('expired');
		return { payload };
	},
	decodeJwt: (token: string) => JSON.parse(token),
}));

jest.spyOn(Date, 'now').mockImplementation(() => clock);

process.env.SESSION_SECRET = 'verification-secret';
process.env.API_URL = 'http://api.test';
process.env.API_LOG = '0';

const { NextRequest: Request } = require('next/server') as typeof import('next/server');
const { ACCESS_TOKEN_EXPIRY, ACCESS_TOKEN_REFRESH_LEEWAY } =
	require('@/lib/api/constants') as typeof import('@/lib/api/constants');

/** vomatt-api `jwt.refresh-grace-seconds` default. */
const GRACE_SECONDS = 10;

const BOUNDS = { proxyInstances: 2, requests: 3, waits: 2 };

// Each instance is a separate module copy, so each has its own in-flight map,
// like separate serverless instances.
type Proxy = (request: NextRequest) => Promise<Response & { cookies: any; headers: Headers }>;
const instances: Proxy[] = Array.from({ length: BOUNDS.proxyInstances }, () => {
	let proxy!: Proxy;
	jest.isolateModules(() => {
		proxy = require('@/proxy').proxy;
	});
	return proxy;
});

type Pair = { accessToken: string; refreshToken: string };

/** RefreshTokenService.rotate for one sign-in: grace hit, live rotation, reuse detection, revoked session. */
class Api {
	private next = 0;
	live = new Set<string>();
	consumed = new Set<string>();
	grace = new Map<string, { pair: Pair; until: number }>();
	revoked = false;
	reuseDetected = false;

	issue(): Pair {
		const n = this.next++;
		const accessToken = JSON.stringify({ sub: 'admin', roles: ['user', 'admin'], exp: clock / 1000 + ACCESS_TOKEN_EXPIRY, n });
		const refreshToken = `r${n}`;
		this.live.add(refreshToken);
		return { accessToken, refreshToken };
	}

	rotate(old: string): { status: number; body: unknown } {
		const cached = this.grace.get(old);
		if (cached && clock < cached.until) return ok(cached.pair);
		if (this.live.delete(old)) {
			if (this.revoked) return fail('auth.refresh_token.invalid');
			const pair = this.issue();
			this.grace.set(old, { pair, until: clock + GRACE_SECONDS * 1000 });
			this.consumed.add(old);
			return ok(pair);
		}
		if (this.consumed.has(old)) {
			this.revoked = true;
			this.reuseDetected = true;
			return fail('auth.suspicious_login');
		}
		return fail('auth.refresh_token.invalid');
	}
}
const ok = (pair: Pair) => ({ status: 200, body: { success: true, data: { token: pair.accessToken, refreshToken: pair.refreshToken } } });
const fail = (errorCode: string) => ({ status: 401, body: { success: false, errorCode } });

type Action =
	| { kind: 'send'; instance: number }
	| { kind: 'reply'; fetch: number }
	| { kind: 'deliver'; request: number }
	| { kind: 'drop'; request: number }
	| { kind: 'wait'; seconds: number; why: string };

type Scope = { dropResponses: boolean };

interface RequestState {
	instance: number;
	refreshToken?: string;
	response?: Awaited<ReturnType<Proxy>>;
	done: boolean;
}

class World {
	api = new Api();
	jar = new Map<string, string>();
	requests: RequestState[] = [];
	fetches: { token: string; resolve: (r: unknown) => void; answered: boolean }[] = [];
	waits = 0;
	log: string[] = [];
	violation?: string;

	constructor() {
		clock = 1_800_000_000_000;
		const pair = this.api.issue(); // OTP sign-in
		this.jar.set('accessToken', pair.accessToken);
		this.jar.set('refreshToken', pair.refreshToken);
		global.fetch = ((_url: string, init: RequestInit) =>
			new Promise<unknown>((resolve) => {
				this.fetches.push({ token: JSON.parse(String(init.body)).refreshToken, resolve, answered: false });
			})) as typeof fetch;
	}

	inFlight() {
		return this.requests.some((r) => !r.done) || this.fetches.some((f) => !f.answered);
	}

	enabled(scope: Scope): Action[] {
		const actions: Action[] = [];
		if (this.requests.length < BOUNDS.requests) {
			instances.forEach((_, instance) => actions.push({ kind: 'send', instance }));
		}
		this.fetches.forEach((f, fetch) => !f.answered && actions.push({ kind: 'reply', fetch }));
		this.requests.forEach((r, request) => {
			if (r.done || !r.response) return;
			actions.push({ kind: 'deliver', request });
			if (scope.dropResponses) actions.push({ kind: 'drop', request });
		});
		// Scope: every request completes within the grace window, so time only moves while nothing is in flight
		if (this.waits < BOUNDS.waits && !this.inFlight()) {
			actions.push({ kind: 'wait', seconds: GRACE_SECONDS + 1, why: 'past the grace window' });
			actions.push({
				kind: 'wait',
				seconds: ACCESS_TOKEN_EXPIRY - ACCESS_TOKEN_REFRESH_LEEWAY + 1,
				why: 'into the access token refresh leeway',
			});
		}
		return actions;
	}

	async apply(action: Action) {
		switch (action.kind) {
			case 'send': {
				const state: RequestState = { instance: action.instance, refreshToken: this.jar.get('refreshToken'), done: false };
				const index = this.requests.push(state) - 1;
				const cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ');
				instances[action.instance](new Request('http://localhost:3003/tags', { headers: cookie ? { cookie } : {} })).then(
					(response) => (state.response = response)
				);
				this.log.push(`request ${index}: browser sends GET /tags with refreshToken=${state.refreshToken ?? 'none'} to proxy instance ${action.instance}`);
				break;
			}
			case 'reply': {
				const f = this.fetches[action.fetch];
				const { status, body } = this.api.rotate(f.token);
				f.answered = true;
				f.resolve({ status, ok: status < 300, json: async () => body });
				const outcome = status === 200 ? `new pair ${(body as any).data.refreshToken}` : (body as any).errorCode;
				this.log.push(`API answers POST /api/auth/refresh with ${f.token}: ${outcome}`);
				if (this.api.reuseDetected) this.violation ??= `the API saw spent refresh token ${f.token} after its grace window and ended the session`;
				break;
			}
			case 'deliver':
			case 'drop': {
				const r = this.requests[action.request];
				r.done = true;
				const location = r.response!.headers.get('location');
				if (action.kind === 'deliver') {
					for (const c of r.response!.cookies.getAll()) {
						const expired = c.expires !== undefined && new Date(c.expires).getTime() <= clock;
						if (c.value === '' || expired) this.jar.delete(c.name);
						else this.jar.set(c.name, c.value);
					}
				}
				this.log.push(
					`request ${action.request}: response ${action.kind === 'drop' ? 'lost before the browser stored its cookies' : 'reaches the browser'}` +
						`${location ? ` (redirect to ${location})` : ''}; cookie jar refreshToken=${this.jar.get('refreshToken') ?? 'none'}`
				);
				if (location?.includes('/login')) this.violation ??= `the signed-in admin was sent to ${location}`;
				break;
			}
			case 'wait':
				clock += action.seconds * 1000;
				this.waits++;
				this.log.push(`${action.seconds} s pass with nothing in flight (${action.why})`);
				break;
		}
		// Every await in the code under test is a microtask or a fetch this world holds, so one turn settles it
		await new Promise((resolve) => setImmediate(resolve));
		await new Promise((resolve) => setImmediate(resolve));
	}

	/** Answers whatever is still pending so the instances' in-flight maps are empty for the next run. */
	async drain() {
		for (const f of this.fetches) if (!f.answered) f.resolve({ status: 503, ok: false, json: async () => ({}) });
		await new Promise((resolve) => setImmediate(resolve));
		await new Promise((resolve) => setImmediate(resolve));
	}
}

/** Depth-first over every action sequence, replaying each prefix from a fresh world. */
async function check(scope: Scope): Promise<{ explored: number; counterexample?: string[] }> {
	let explored = 0;
	async function visit(prefix: Action[]): Promise<string[] | undefined> {
		const world = new World();
		for (const action of prefix) await world.apply(action);
		explored++;
		const { violation, log } = world;
		const next = violation ? [] : world.enabled(scope);
		await world.drain();
		if (violation) return [...log, `VIOLATION: ${violation}`];
		for (const action of next) {
			const found = await visit([...prefix, action]);
			if (found) return found;
		}
		return undefined;
	}
	const counterexample = await visit([]);
	return { explored, counterexample };
}

const report = (counterexample?: string[]) => (counterexample ? `\n  ${counterexample.join('\n  ')}` : 'none');

jest.setTimeout(600_000);

describe('refresh-token rotation', () => {
	it('an admin whose responses all reach the browser is never signed out by reuse detection', async () => {
		const { explored, counterexample } = await check({ dropResponses: false });
		console.log(`delivered responses: ${explored} states explored, counterexample: ${report(counterexample)}`);
		expect(counterexample).toBeUndefined();
	});

	it('an admin whose response is lost after the proxy rotated is never signed out by reuse detection', async () => {
		const { explored, counterexample } = await check({ dropResponses: true });
		console.log(`lost responses: ${explored} states explored, counterexample: ${report(counterexample)}`);
		expect(counterexample).toBeUndefined();
	});
});
