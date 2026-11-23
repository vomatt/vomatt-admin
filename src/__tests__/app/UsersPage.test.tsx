jest.mock('@/lib/api/admin', () => ({
	adminFetch: jest.fn(),
	// Same contract as the real one (tested in admin-helpers), without loading the auth stack
	withQuery: (
		path: string,
		params: Record<string, string | number | undefined>
	) => {
		const query = new URLSearchParams();
		for (const [name, value] of Object.entries(params))
			if (value !== undefined && value !== '') query.set(name, String(value));
		return query.size ? `${path}?${query}` : path;
	},
}));

import { render } from '@testing-library/react';

import UsersPage from '@/app/(admin)/(console)/users/page';
import { adminFetch } from '@/lib/api/admin';

async function renderPage(query: Record<string, string>, total = 0) {
	jest
		.mocked(adminFetch)
		.mockResolvedValue({ content: [], page: 1, limit: 20, total });
	const page = await UsersPage({
		searchParams: Promise.resolve(query),
		params: Promise.resolve({}),
	} as never);
	return render(page).container;
}

describe('UsersPage email domain filter', () => {
	beforeEach(() => jest.clearAllMocks());

	it('sends the domain with the other filters and keeps it in the field', async () => {
		const container = await renderPage({
			q: 'eve',
			emailDomain: 'vomatt.test',
			status: 'any',
		});

		expect(adminFetch).toHaveBeenCalledWith(
			'/admin/users?q=eve&emailDomain=vomatt.test&page=1'
		);
		expect(
			container.querySelector<HTMLInputElement>('input[name="emailDomain"]')
				?.value
		).toBe('vomatt.test');
	});

	it('keeps the domain in the pagination links', async () => {
		const container = await renderPage({ emailDomain: 'vomatt.test' }, 25);

		const next = [...container.querySelectorAll('a')].find((a) =>
			a.href.includes('page=2')
		);
		expect(next?.getAttribute('href')).toContain('emailDomain=vomatt.test');
	});

	it('sends a typed domain "any" as text, not as the select\'s no-filter value', async () => {
		await renderPage({ emailDomain: 'any', role: 'any' });

		expect(adminFetch).toHaveBeenCalledWith(
			'/admin/users?emailDomain=any&page=1'
		);
	});
});

describe('UsersPage other filters', () => {
	beforeEach(() => jest.clearAllMocks());

	it('sends sign-in, plan and inactivity, and joined dates as Taipei midnights with an exclusive end', async () => {
		await renderPage({
			authMethod: 'google',
			plan: 'PRO',
			inactiveDays: '90',
			joinedFrom: '2026-10-01',
			joinedTo: '2026-10-31',
		});

		const sent = new URL(
			jest.mocked(adminFetch).mock.calls[0][0] as string,
			'http://x'
		).searchParams;
		expect(Object.fromEntries(sent)).toEqual({
			authMethod: 'google',
			plan: 'PRO',
			inactiveDays: '90',
			joinedFrom: '2026-10-01T00:00:00+08:00',
			joinedTo: '2026-11-01T00:00:00+08:00',
			page: '1',
		});
	});

	it('leaves "any" selections out of the request', async () => {
		await renderPage({ authMethod: 'any', plan: 'any', inactiveDays: 'any' });

		expect(adminFetch).toHaveBeenCalledWith('/admin/users?page=1');
	});

	it('ignores a joined date or select value a hand-edited link got wrong', async () => {
		await renderPage({
			joinedFrom: 'foo',
			joinedTo: '2026-13-45',
			authMethod: 'facebook',
			plan: 'constructor',
			inactiveDays: '7',
		});

		expect(adminFetch).toHaveBeenCalledWith('/admin/users?page=1');
	});
});
