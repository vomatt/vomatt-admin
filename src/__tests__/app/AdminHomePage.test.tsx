import { render, screen } from '@testing-library/react';

jest.mock('@/lib/api/admin', () => ({
	adminFetch: jest.fn(async () => ({
		usersTotal: 1234,
		usersNewLast7Days: 12,
		usersSuspended: 3,
		pollsInProgress: 40,
		pollsEnded: 500,
		pollsDeleted: 7,
		ballotsLast24Hours: 89,
	})),
}));

import AdminHomePage from '@/app/(admin)/(console)/page';
import { adminFetch } from '@/lib/api/admin';

describe('AdminHomePage', () => {
	it('shows the live stats', async () => {
		render(await AdminHomePage());

		expect(adminFetch).toHaveBeenCalledWith('/admin/stats');
		expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
		expect(screen.getByText('1,234')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Suspended users/ })).toHaveAttribute('href', '/users?status=suspended');
	});
});
