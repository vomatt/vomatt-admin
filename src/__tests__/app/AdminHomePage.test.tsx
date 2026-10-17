import { render, screen } from '@testing-library/react';

import AdminHomePage from '@/app/(admin)/(console)/page';

describe('AdminHomePage', () => {
	it('renders the app title', () => {
		render(<AdminHomePage />);

		expect(screen.getByRole('heading', { name: 'Vomatt Admin' })).toBeInTheDocument();
	});
});
