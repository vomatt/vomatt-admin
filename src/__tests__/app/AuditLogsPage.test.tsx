jest.mock('@/lib/api/admin', () => ({
	adminFetch: jest.fn(),
	// Same contract as the real one (tested in admin-helpers), without loading the auth stack
	withQuery: (path: string, params: Record<string, string | number | undefined>) => {
		const query = new URLSearchParams();
		for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== '') query.set(name, String(value));
		return query.size ? `${path}?${query}` : path;
	},
}));
jest.mock('@/lib/entity-name', () => ({ entityName: jest.fn(), findUser: jest.fn() }));

import { render } from '@testing-library/react';

import AuditLogsPage from '@/app/(admin)/(console)/audit-logs/page';
import { adminFetch } from '@/lib/api/admin';
import { findUser } from '@/lib/entity-name';
import { AuditLog } from '@/types';

const row = {
	id: 'a1',
	userId: 'u1',
	username: 'ann@example.com',
	action: 'SUSPEND',
	resourceType: 'USER',
	resourceId: 'u2',
	success: true,
	createdAt: '2026-10-22T12:00:00+08:00',
} as AuditLog;

async function renderPage(query: Record<string, string>, rows: AuditLog[] = []) {
	jest.mocked(adminFetch).mockResolvedValue({ content: rows, page: 1, limit: 20, total: rows.length });
	const page = await AuditLogsPage({ searchParams: Promise.resolve(query), params: Promise.resolve({}) } as never);
	return render(page).container;
}

const selected = (container: HTMLElement, name: string) =>
	container.querySelector<HTMLSelectElement>(`select[name="${name}"]`)?.value;

describe('AuditLogsPage filters', () => {
	beforeEach(() => jest.clearAllMocks());

	it('reads a lowercase action and resource type as the API values', async () => {
		const container = await renderPage({ action: 'force_delete', resourceType: 'comment' });

		expect(adminFetch).toHaveBeenCalledWith('/admin/audit-logs?action=FORCE_DELETE&resourceType=COMMENT&page=1');
		expect(selected(container, 'action')).toBe('FORCE_DELETE');
		expect(selected(container, 'resourceType')).toBe('COMMENT');
	});

	it('keeps an action missing from the known list, so a submit keeps the filter', async () => {
		const container = await renderPage({ action: 'LOGIN' });

		expect(selected(container, 'action')).toBe('LOGIN');
	});

	it("names the actor chip as the rows do, without fetching the user", async () => {
		const container = await renderPage({ userId: 'u1' }, [row]);

		expect(container.textContent).toContain('Actorann@example.com');
		expect(findUser).not.toHaveBeenCalled();
	});
});
