import { render, screen } from '@testing-library/react';

import { SignedInAs } from '@/components/admin/SignedInAs';

describe('SignedInAs', () => {
	it('shows the full email of the signed-in admin', () => {
		render(<SignedInAs email="admin@example.com" />);

		expect(screen.getByText('Signed in as')).toBeInTheDocument();
		expect(screen.getByText('admin@example.com')).toBeInTheDocument();
	});

	it.each([undefined, ''])('renders nothing without an email (%p)', (email) => {
		const { container } = render(<SignedInAs email={email} />);

		expect(container).toBeEmptyDOMElement();
	});
});
