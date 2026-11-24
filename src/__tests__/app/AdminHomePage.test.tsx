import { render, screen } from '@testing-library/react';

const TOTALS: Record<string, number> = {
	'/admin/votes?status=scheduled&deleted=false&limit=1': 6,
	'/admin/comments?deleted=false&limit=1': 4321,
};

jest.mock('server-only', () => ({}));
jest.mock('next/cache', () => ({ refresh: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn(), unstable_rethrow: jest.fn() }));
jest.mock('@/lib/api/client', () => ({
	ApiError: class ApiError extends Error {},
	AuthError: class AuthError extends Error {},
	apiClient: jest.fn(),
}));

import AdminHomePage from '@/app/(admin)/(console)/page';
import { apiClient } from '@/lib/api/client';

const STATS = {
	usersTotal: 1234,
	usersNewLast7Days: 12,
	usersSuspended: 3,
	pollsInProgress: 40,
	pollsEnded: 500,
	pollsDeleted: 7,
	ballotsLast24Hours: 89,
};

describe('AdminHomePage', () => {
	beforeEach(() => {
		jest.mocked(apiClient).mockImplementation(async (path: string) => {
			if (path === '/admin/stats') return STATS;
			if (path in TOTALS) return { content: [], total: TOTALS[path], page: 1, limit: 1 };
			throw new Error(`Unexpected request: ${path}`);
		});
	});

	it('shows the live stats', async () => {
		render(await AdminHomePage());

		expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
		expect(screen.getByText('1,234')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Suspended/ })).toHaveAttribute('href', '/users?status=suspended');
	});

	it('counts scheduled polls and live comments from the list totals', async () => {
		render(await AdminHomePage());

		expect(screen.getByRole('link', { name: 'Polls: Scheduled, 6' })).toHaveAttribute(
			'href',
			'/polls?status=scheduled&deleted=false'
		);
		expect(screen.getByRole('link', { name: 'Activity: Comments, 4,321' })).toHaveAttribute(
			'href',
			'/comments?deleted=false'
		);
	});

	it('does not read the audited report, feedback and contact lists', async () => {
		render(await AdminHomePage());

		const paths = jest.mocked(apiClient).mock.calls.map(([path]) => path);
		expect(paths.filter((path) => /report|feedback|contact/.test(path))).toEqual([]);
	});

	it('shows a dash for a count that failed and keeps the rest', async () => {
		jest.mocked(apiClient).mockImplementation(async (path: string) => {
			if (path === '/admin/stats') return STATS;
			throw new Error('API down');
		});

		render(await AdminHomePage());

		expect(screen.getByRole('link', { name: 'Activity: Comments, —' })).toBeInTheDocument();
		expect(screen.getByText('1,234')).toBeInTheDocument();
	});
});
