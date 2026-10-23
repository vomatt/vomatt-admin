jest.mock('@/lib/api/admin', () => ({
	adminFetch: jest.fn(),
	withQuery: (path: string, params: Record<string, string | number | undefined>) => {
		const query = new URLSearchParams();
		for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== '') query.set(name, String(value));
		return query.size ? `${path}?${query}` : path;
	},
}));
jest.mock('@/lib/entity-name', () => ({ entityName: jest.fn() }));

import { render } from '@testing-library/react';

import FeedbackPage from '@/app/(admin)/(console)/feedback/page';
import { adminFetch } from '@/lib/api/admin';
import { entityName } from '@/lib/entity-name';
import { AdminFeedback } from '@/types';

const item: AdminFeedback = {
	id: 'f1',
	userId: 'u1',
	username: 'alice',
	content: 'Please add dark mode.',
	createdAt: '2026-10-23T10:00:00+08:00',
};

async function renderPage(query: Record<string, string>, rows: AdminFeedback[]) {
	jest.mocked(adminFetch).mockResolvedValue({ content: rows, page: 1, limit: 20, total: rows.length });
	const page = await FeedbackPage({ searchParams: Promise.resolve(query), params: Promise.resolve({}) } as never);
	return render(page).container;
}

describe('FeedbackPage', () => {
	beforeEach(() => jest.clearAllMocks());

	it('lists the feedback with its sender', async () => {
		const container = await renderPage({}, [item]);

		expect(adminFetch).toHaveBeenCalledWith('/admin/feedback?page=1');
		expect(container.textContent).toContain('Please add dark mode.');
		expect(container.textContent).toContain('alice');
	});

	it('says so when there is none', async () => {
		const container = await renderPage({}, []);

		expect(container.textContent).toContain('No feedback yet.');
	});

	it('narrows to one sender', async () => {
		jest.mocked(entityName).mockResolvedValue('alice');
		await renderPage({ userId: 'u1' }, [item]);

		expect(adminFetch).toHaveBeenCalledWith('/admin/feedback?userId=u1&page=1');
		expect(entityName).toHaveBeenCalledWith('user', 'u1');
	});
});
