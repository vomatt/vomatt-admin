import { fireEvent, render, screen } from '@testing-library/react';

import { NavLink } from '@/components/admin/NavLink';
import { SidebarMenu, SidebarProvider, useSidebar } from '@/components/ui/sidebar';

jest.mock('next/navigation', () => ({ usePathname: () => '/polls/p1' }));

// jsdom has no matchMedia; report a phone-sized viewport
window.matchMedia = jest.fn().mockReturnValue({
	matches: true,
	addEventListener: jest.fn(),
	removeEventListener: jest.fn(),
});

function MobileState() {
	const { openMobile, setOpenMobile } = useSidebar();
	return (
		<button type="button" onClick={() => setOpenMobile(true)}>
			{openMobile ? 'open' : 'closed'}
		</button>
	);
}

function renderNav(onClick?: () => void) {
	render(
		<SidebarProvider>
			<MobileState />
			<SidebarMenu>
				<NavLink href="/">Overview</NavLink>
				<NavLink href="/polls" onClick={onClick}>
					Polls
				</NavLink>
			</SidebarMenu>
		</SidebarProvider>
	);
}

describe('NavLink', () => {
	it('marks the link for the current section', () => {
		renderNav();

		expect(screen.getByRole('link', { name: 'Polls' })).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('link', { name: 'Polls' })).toHaveAttribute('data-active', 'true');
		expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
	});

	it('closes the mobile sidebar and still runs the caller onClick', () => {
		const onClick = jest.fn();
		renderNav(onClick);
		fireEvent.click(screen.getByRole('button', { name: 'closed' }));
		expect(screen.getByRole('button', { name: 'open' })).toBeInTheDocument();

		fireEvent.click(screen.getByRole('link', { name: 'Polls' }));

		expect(screen.getByRole('button', { name: 'closed' })).toBeInTheDocument();
		expect(onClick).toHaveBeenCalled();
	});
});
