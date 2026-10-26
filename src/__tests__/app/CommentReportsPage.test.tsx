jest.mock('@/lib/api/admin', () => ({
	adminFetch: jest.fn(),
	withQuery: (path: string, params: Record<string, string | number | undefined>) => {
		const query = new URLSearchParams();
		for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== '') query.set(name, String(value));
		return query.size ? `${path}?${query}` : path;
	},
}));

import { render } from '@testing-library/react';

import CommentReportsPage from '@/app/(admin)/(console)/comment-reports/page';
import { adminFetch } from '@/lib/api/admin';
import { AdminCommentReport } from '@/types';

const report: AdminCommentReport = {
	id: 'r1',
	commentId: 'c1',
	voteId: 'v1',
	parentId: null,
	commentText: 'You are an idiot.',
	commentDeleted: true,
	authorId: 'u1',
	authorUsername: 'troll',
	reporterId: 'u2',
	reporterUsername: 'alice',
	reason: 'HARASSMENT',
	note: 'Insults me in every thread.',
	createdAt: '2026-10-26T10:00:00+08:00',
};

async function renderPage(rows: AdminCommentReport[]) {
	jest.mocked(adminFetch).mockResolvedValue({ content: rows, page: 1, limit: 20, total: rows.length });
	const page = await CommentReportsPage({ searchParams: Promise.resolve({}), params: Promise.resolve({}) } as never);
	return render(page).container;
}

describe('CommentReportsPage', () => {
	beforeEach(() => jest.clearAllMocks());

	it('lists the reports with comment, people, reason and note', async () => {
		const container = await renderPage([report]);

		expect(adminFetch).toHaveBeenCalledWith('/admin/comment-reports?page=1');
		for (const text of ['You are an idiot.', 'troll', 'alice', 'Harassment', 'Insults me in every thread.', 'Deleted']) {
			expect(container.textContent).toContain(text);
		}
	});

	it('says so when there are none', async () => {
		const container = await renderPage([]);

		expect(container.textContent).toContain('No reports yet.');
	});
});
