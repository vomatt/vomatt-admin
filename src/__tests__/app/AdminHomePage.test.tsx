import { render, screen } from '@testing-library/react';

import AdminHomePage from '@/app/(admin)/page';

describe('AdminHomePage', () => {
	it('renders the app title', () => {
		render(<AdminHomePage />);

		expect(screen.getByRole('heading', { name: 'Vomatt Admin' })).toBeInTheDocument();
	});
});
