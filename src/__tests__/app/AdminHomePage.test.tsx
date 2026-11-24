import { render, screen } from '@testing-library/react';

const TOTALS: Record<string, number> = {
	'/admin/votes?status=scheduled&deleted=false&limit=1': 6,
	'/admin/comments?limit=1': 4321,
	'/admin/comment-reports?limit=1': 5,
	'/admin/vote-reports?limit=1': 2,
	'/admin/feedback?limit=1': 11,
	'/admin/contact-messages?limit=1': 8,
};

jest.mock('@/lib/api/admin', () => ({
	withQuery: (path: string, params: Record<string, string | number | undefined>) => {
		const query = new URLSearchParams();
		for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== '') query.set(name, String(value));
		return query.size ? `${path}?${query}` : path;
	},
	adminFetch: jest.fn(async (path: string) =>
		path === '/admin/stats'
			? {
					usersTotal: 1234,
					usersNewLast7Days: 12,
					usersSuspended: 3,
					pollsInProgress: 40,
					pollsEnded: 500,
					pollsDeleted: 7,
					ballotsLast24Hours: 89,
				}
			: { content: [], total: TOTALS[path], page: 1, limit: 1 }
	),
}));

import AdminHomePage from '@/app/(admin)/(console)/page';

describe('AdminHomePage', () => {
	it('shows the live stats', async () => {
		render(await AdminHomePage());

		expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
		expect(screen.getByText('1,234')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Suspended/ })).toHaveAttribute('href', '/users?status=suspended');
	});

	it('counts scheduled polls, comments and the inbox from the list totals', async () => {
		render(await AdminHomePage());

		expect(screen.getByRole('link', { name: 'Polls: Scheduled, 6' })).toHaveAttribute(
			'href',
			'/polls?status=scheduled&deleted=false'
		);
		expect(screen.getByRole('link', { name: 'Activity: Comments, 4,321' })).toHaveAttribute('href', '/comments');
		expect(screen.getByRole('link', { name: 'Inbox: Comment reports, 5' })).toHaveAttribute('href', '/comment-reports');
		expect(screen.getByRole('link', { name: 'Inbox: Poll reports, 2' })).toHaveAttribute('href', '/vote-reports');
		expect(screen.getByRole('link', { name: 'Inbox: Feedback, 11' })).toHaveAttribute('href', '/feedback');
		expect(screen.getByRole('link', { name: 'Inbox: Contact messages, 8' })).toHaveAttribute('href', '/contact-messages');
	});
});
