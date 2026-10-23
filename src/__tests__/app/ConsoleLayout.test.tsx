jest.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
jest.mock('next/navigation', () => ({ usePathname: () => '/comments' }));
jest.mock('@/lib/api/auth', () => ({ getTokens: async () => null, decodeToken: jest.fn() }));
jest.mock('@/lib/api/services/auth', () => ({ signout: jest.fn() }));
jest.mock('@/components/admin/ThemeSwitcher', () => ({ ThemeSwitcher: () => null }));

import { render, screen, within } from '@testing-library/react';

import ConsoleLayout from '@/app/(admin)/(console)/layout';

// jsdom has no matchMedia; report a desktop viewport
window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });

function group(label: string) {
	const element = screen.getByText(label).closest<HTMLElement>('[data-slot="sidebar-group"]');
	if (!element) throw new Error(`no sidebar group labelled ${label}`);
	return within(element);
}

describe('ConsoleLayout sidebar', () => {
	it('groups the sections by what they hold', async () => {
		render(await ConsoleLayout({ children: null }));

		expect(group('People').getByRole('link', { name: 'Users' })).toBeInTheDocument();
		expect(group('Content').getAllByRole('link').map((link) => link.textContent)).toEqual(['Polls', 'Comments']);
		expect(group('Settings').getAllByRole('link').map((link) => link.textContent)).toEqual(['Tags', 'Lookups']);
		expect(group('System').getByRole('link', { name: 'Audit log' })).toBeInTheDocument();
	});

	it('marks the current section', async () => {
		render(await ConsoleLayout({ children: null }));

		expect(group('Content').getByRole('link', { name: 'Comments' })).toHaveAttribute('aria-current', 'page');
	});
});
