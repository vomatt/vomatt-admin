import { fireEvent, render, screen } from '@testing-library/react';

import { ThemeSwitcher } from '@/components/admin/ThemeSwitcher';

const setTheme = jest.fn();
let theme = 'system';

jest.mock('next-themes', () => ({
	useTheme: () => ({ theme, setTheme }),
}));

describe('ThemeSwitcher', () => {
	beforeEach(() => {
		setTheme.mockClear();
		theme = 'system';
	});

	it('checks the saved theme', () => {
		theme = 'dark';
		render(<ThemeSwitcher />);

		expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
		expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'false');
	});

	it.each(['light', 'dark', 'system'])('switches to %s', (value) => {
		render(<ThemeSwitcher />);

		fireEvent.click(screen.getByRole('radio', { name: new RegExp(value, 'i') }));

		expect(setTheme).toHaveBeenCalledWith(value);
	});
});
