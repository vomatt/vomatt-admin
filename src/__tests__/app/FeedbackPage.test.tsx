jest.mock('@/lib/api/admin', () => ({
	adminFetch: jest.fn(),
	withQuery: (path: string, params: Record<string, string | number | undefined>) => {
		const query = new URLSearchParams();
		for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== '') query.set(name, String(value));
		return query.size ? `${path}?${query}` : path;
	},
}));
jest.mock('@/lib/api/client', () => ({
	ApiError: class ApiError extends Error {
		constructor(
			message: string,
			public statusCode: number
		) {
			super(message);
		}
	},
}));
jest.mock('next/navigation', () => ({
	notFound: jest.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
}));
jest.mock('@/lib/entity-name', () => ({ entityName: jest.fn() }));

import { render } from '@testing-library/react';

import FeedbackPage from '@/app/(admin)/(console)/feedback/page';
import { adminFetch } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
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

	it('says the sender has none when filtered', async () => {
		const container = await renderPage({ userId: 'u1' }, []);

		expect(container.textContent).toContain('No feedback from this sender.');
	});

	it('is a 404 when the sender is not a UUID', async () => {
		jest.mocked(adminFetch).mockRejectedValue(new ApiError('bad', 400));

		await expect(
			FeedbackPage({ searchParams: Promise.resolve({ userId: 'x' }), params: Promise.resolve({}) } as never)
		).rejects.toThrow('NEXT_NOT_FOUND');
	});
});
