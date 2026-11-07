jest.mock('@/lib/api/admin', () => ({
	adminFetch: jest.fn(),
	withQuery: (path: string, params: Record<string, string | number | undefined>) => {
		const query = new URLSearchParams();
		for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== '') query.set(name, String(value));
		return query.size ? `${path}?${query}` : path;
	},
}));

import { render, screen } from '@testing-library/react';

import ContactMessagesPage from '@/app/(admin)/(console)/contact-messages/page';
import { adminFetch } from '@/lib/api/admin';
import { AdminContactMessage } from '@/types';

const item: AdminContactMessage = {
	id: 'c1',
	name: 'Mei',
	email: 'mei@example.com',
	message: 'Hello,\nhow do I delete a poll?',
	locale: 'zh',
	createdAt: '2026-10-23T10:00:00+08:00',
};

async function renderPage(query: Record<string, string>, rows: AdminContactMessage[]) {
	jest.mocked(adminFetch).mockResolvedValue({ content: rows, page: 1, limit: 20, total: rows.length });
	const page = await ContactMessagesPage({ searchParams: Promise.resolve(query), params: Promise.resolve({}) } as never);
	return render(page).container;
}

describe('ContactMessagesPage', () => {
	beforeEach(() => jest.clearAllMocks());

	it('lists the messages with their sender and language', async () => {
		const container = await renderPage({}, [item]);

		expect(adminFetch).toHaveBeenCalledWith('/admin/contact-messages?page=1');
		expect(container.textContent).toContain('Mei');
		expect(container.textContent).toContain('zh');
		expect(screen.getByText(/how do I delete a poll/).textContent).toBe('Hello,\nhow do I delete a poll?');
	});

	it('links the email for a reply', async () => {
		await renderPage({}, [item]);

		expect(screen.getByRole('link', { name: 'mei@example.com' })).toHaveAttribute('href', 'mailto:mei@example.com');
	});

	it('asks for the requested page', async () => {
		await renderPage({ page: '3' }, [item]);

		expect(adminFetch).toHaveBeenCalledWith('/admin/contact-messages?page=3');
	});

	it('says so when there are none', async () => {
		const container = await renderPage({}, []);

		expect(container.textContent).toContain('No messages yet.');
	});
});
