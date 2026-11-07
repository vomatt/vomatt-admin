jest.mock('@/lib/api/admin', () => ({
	adminFetch: jest.fn(),
	withQuery: (path: string, params: Record<string, string | number | undefined>) => {
		const query = new URLSearchParams();
		for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== '') query.set(name, String(value));
		return query.size ? `${path}?${query}` : path;
	},
}));

import { render } from '@testing-library/react';

import ContactMessagesPage from '@/app/(admin)/(console)/contact-messages/page';
import { adminFetch } from '@/lib/api/admin';
import { AdminContactMessage } from '@/types';

const item: AdminContactMessage = {
	id: 'm1',
	name: 'Alice Chen',
	email: 'alice@example.com',
	message: 'Can my school use Vomatt?',
	locale: 'en',
	createdAt: '2026-11-07T10:00:00+08:00',
};

async function renderPage(query: Record<string, string>, rows: AdminContactMessage[]) {
	jest.mocked(adminFetch).mockResolvedValue({ content: rows, page: 1, limit: 20, total: rows.length });
	const page = await ContactMessagesPage({ searchParams: Promise.resolve(query), params: Promise.resolve({}) } as never);
	return render(page).container;
}

describe('ContactMessagesPage', () => {
	beforeEach(() => jest.clearAllMocks());

	it('lists the messages with their sender', async () => {
		const container = await renderPage({}, [item]);

		expect(adminFetch).toHaveBeenCalledWith('/admin/contact-messages?page=1');
		expect(container.textContent).toContain('Can my school use Vomatt?');
		expect(container.textContent).toContain('Alice Chen');
		expect(container.querySelector('a[href="mailto:alice@example.com"]')).not.toBeNull();
	});

	it('asks for the requested page', async () => {
		await renderPage({ page: '2' }, [item]);

		expect(adminFetch).toHaveBeenCalledWith('/admin/contact-messages?page=2');
	});

	it('says so when there is none', async () => {
		const container = await renderPage({}, []);

		expect(container.textContent).toContain('No contact messages yet.');
	});
});
