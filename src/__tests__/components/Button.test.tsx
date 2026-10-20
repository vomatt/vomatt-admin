import { fireEvent, render, screen } from '@testing-library/react';

import { Button } from '@/components/ui/button';

describe('Button', () => {
	it('shows a spinner and disables itself while loading', () => {
		render(<Button loading>Save</Button>);

		const button = screen.getByRole('button', { name: 'Save' });
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute('aria-busy', 'true');
		expect(button.querySelector('.animate-spin')).not.toBeNull();
	});

	it('puts the spinner inside a slotted child', () => {
		render(
			<Button asChild loading>
				<a href="/next">Next</a>
			</Button>
		);

		const link = screen.getByRole('link', { name: 'Next' });
		expect(link).toHaveAttribute('aria-busy', 'true');
		expect(link.querySelector('.animate-spin')).not.toBeNull();
	});

	it('blocks clicks on a slotted link while loading', () => {
		render(
			<Button asChild loading>
				<a href="/next">Next</a>
			</Button>
		);

		const link = screen.getByRole('link', { name: 'Next' });
		expect(link).toHaveAttribute('aria-disabled', 'true');
		// fireEvent returns false when the click's default was prevented
		expect(fireEvent.click(link)).toBe(false);
	});

	it('has no spinner when not loading', () => {
		render(<Button>Save</Button>);

		const button = screen.getByRole('button', { name: 'Save' });
		expect(button).toBeEnabled();
		expect(button.querySelector('.animate-spin')).toBeNull();
	});
});
