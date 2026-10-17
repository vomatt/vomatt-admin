import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockReplace = jest.fn();
const mockRequestOtp = jest.fn();
const mockVerifyOtp = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/lib/api/services/auth', () => ({
	requestOtp: (email: string) => mockRequestOtp(email),
	verifyOtp: (email: string, code: string) => mockVerifyOtp(email, code),
}));

import { LoginForm } from '@/components/LoginForm';

beforeEach(() => jest.clearAllMocks());

function submit() {
	fireEvent.submit(screen.getByRole('textbox', { name: 'Email' }).closest('form')!);
}

describe('LoginForm', () => {
	it('asks for the code once it is sent, then goes to the redirect target', async () => {
		mockRequestOtp.mockResolvedValue({ ok: true });
		mockVerifyOtp.mockResolvedValue({ ok: true });
		render(<LoginForm redirectTo="/tags" />);

		fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'a@example.com' } });
		submit();
		const code = await screen.findByRole('textbox', { name: 'Code sent to your email' });
		fireEvent.change(code, { target: { value: '123456' } });
		submit();

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/tags'));
		expect(mockVerifyOtp).toHaveBeenCalledWith('a@example.com', '123456');
	});

	it('shows why the code could not be sent', async () => {
		mockRequestOtp.mockResolvedValue({ ok: false, message: 'This account does not have admin access.' });
		render(<LoginForm redirectTo="/" />);

		submit();

		expect(await screen.findByRole('alert')).toHaveTextContent('This account does not have admin access.');
		expect(screen.queryByRole('textbox', { name: 'Code sent to your email' })).toBeNull();
	});
});
