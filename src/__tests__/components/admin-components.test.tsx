import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

jest.mock('@/lib/api/services/users', () => ({ setUserRoles: jest.fn() }));

import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { Pagination } from '@/components/admin/Pagination';
import { PollStatusBadge } from '@/components/admin/PollStatusBadge';
import { RolesForm } from '@/components/users/RolesForm';
import { setUserRoles } from '@/lib/api/services/users';

describe('ConfirmAction', () => {
	it('runs the action only after confirming', async () => {
		const action = jest.fn(async () => ({ ok: true as const, data: undefined }));
		render(<ConfirmAction action={action} label="Delete" title="Delete this poll?" description="Sure?" destructive />);

		fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		expect(action).not.toHaveBeenCalled();
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }));

		await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
		expect(action).toHaveBeenCalledTimes(1);
	});

	it('keeps the dialog open with the API error', async () => {
		const action = jest.fn(async () => ({ ok: false as const, message: 'Poll is busy' }));
		render(<ConfirmAction action={action} label="Restore" title="Restore?" description="Sure?" />);

		fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
		fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Restore' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('Poll is busy');
		expect(screen.getByRole('alertdialog')).toBeInTheDocument();
	});
});

describe('Pagination', () => {
	it('keeps non-empty filters in the page links', () => {
		render(<Pagination pathname="/users" params={{ q: 'ann', role: '' }} page={2} limit={20} total={45} />);

		expect(screen.getByText(/45 results, page 2 of 3/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('href', '/users?q=ann&page=1');
		expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('href', '/users?q=ann&page=3');
	});

	it('disables Next on the last page', () => {
		render(<Pagination pathname="/users" params={{}} page={1} limit={20} total={0} />);

		expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
	});
});

describe('PollStatusBadge', () => {
	it('shows Deleted over the time status', () => {
		render(<PollStatusBadge status="open" deleted />);

		expect(screen.getByText('Deleted')).toBeInTheDocument();
	});
});

describe('RolesForm', () => {
	it('saves the picked roles in a stable order', async () => {
		jest.mocked(setUserRoles).mockResolvedValue({ ok: true, data: {} as never });
		render(<RolesForm userId="u1" roles={['user']} />);

		fireEvent.click(screen.getByRole('checkbox', { name: 'admin' }));
		fireEvent.click(screen.getByRole('button', { name: 'Save roles' }));

		expect(await screen.findByRole('status')).toHaveTextContent('Roles saved.');
		expect(setUserRoles).toHaveBeenCalledWith('u1', ['user', 'admin']);
	});

	it('shows the API error', async () => {
		jest.mocked(setUserRoles).mockResolvedValue({ ok: false, message: 'The only active admin' });
		render(<RolesForm userId="u1" roles={['admin']} />);

		fireEvent.click(screen.getByRole('checkbox', { name: 'user' }));
		fireEvent.click(screen.getByRole('button', { name: 'Save roles' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('The only active admin');
	});
});
