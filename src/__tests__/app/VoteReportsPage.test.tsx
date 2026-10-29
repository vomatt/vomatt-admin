jest.mock('@/lib/api/admin', () => ({
	adminFetch: jest.fn(),
	withQuery: (path: string, params: Record<string, string | number | undefined>) => {
		const query = new URLSearchParams();
		for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== '') query.set(name, String(value));
		return query.size ? `${path}?${query}` : path;
	},
}));

import { render } from '@testing-library/react';

import VoteReportsPage from '@/app/(admin)/(console)/vote-reports/page';
import { adminFetch } from '@/lib/api/admin';
import { AdminVoteReport } from '@/types';

const report: AdminVoteReport = {
	id: 'r1',
	voteId: 'v1',
	voteTitle: 'Does garlic cure the flu?',
	voteDeleted: true,
	ownerId: 'u1',
	ownerUsername: 'troll',
	reporterId: 'u2',
	reporterUsername: 'alice',
	reason: 'MISINFORMATION',
	note: 'The options spread a false health claim.',
	createdAt: '2026-10-26T10:00:00+08:00',
};

async function renderPage(rows: AdminVoteReport[]) {
	jest.mocked(adminFetch).mockResolvedValue({ content: rows, page: 1, limit: 20, total: rows.length });
	const page = await VoteReportsPage({ searchParams: Promise.resolve({}), params: Promise.resolve({}) } as never);
	return render(page).container;
}

describe('VoteReportsPage', () => {
	beforeEach(() => jest.clearAllMocks());

	it('lists the reports with poll, people, reason and note', async () => {
		const container = await renderPage([report]);

		expect(adminFetch).toHaveBeenCalledWith('/admin/vote-reports?page=1');
		for (const text of ['Does garlic cure the flu?', 'troll', 'alice', 'Misinformation', 'The options spread a false health claim.', 'Deleted']) {
			expect(container.textContent).toContain(text);
		}
	});

	it('says so when there are none', async () => {
		const container = await renderPage([]);

		expect(container.textContent).toContain('No reports yet.');
	});
});
