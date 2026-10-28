import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockReplace = jest.fn();
const mockRequestOtp = jest.fn();
const mockVerifyOtp = jest.fn();
const mockGetOptions = jest.fn();
const mockVerifyPasskey = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/lib/api/services/auth', () => ({
	requestOtp: (email: string) => mockRequestOtp(email),
	verifyOtp: (email: string, code: string) => mockVerifyOtp(email, code),
	getPasskeyLoginOptions: () => mockGetOptions(),
	verifyPasskeyLogin: (credential: unknown) => mockVerifyPasskey(credential),
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

describe('LoginForm with a passkey', () => {
	const mockGet = jest.fn();
	const mockConditionalAvailable = jest.fn();
	const optionsJson = { challenge: 'Y2hhbGxlbmdl', rpId: 'vomatt.com' };
	const parsedOptions = { challenge: new ArrayBuffer(8) };
	const credentialJson = { id: 'cred-1', rawId: 'cred-1', type: 'public-key', response: {} };
	const credential = { toJSON: () => credentialJson };
	const passkeyButton = () => screen.getByRole('button', { name: 'Sign in with a passkey' });
	/** The autofill request: pending until a passkey is picked, rejecting like browsers do when aborted. */
	let pickPasskey: () => void;
	let conditionalSignal: AbortSignal | undefined;

	beforeEach(() => {
		mockGetOptions.mockResolvedValue({ ok: true, options: optionsJson });
		mockVerifyPasskey.mockResolvedValue({ ok: true });
		mockConditionalAvailable.mockResolvedValue(false);
		conditionalSignal = undefined;
		mockGet.mockImplementation(({ mediation, signal }: CredentialRequestOptions) => {
			if (mediation !== 'conditional') return Promise.resolve(credential);
			conditionalSignal = signal ?? undefined;
			return new Promise((resolve, reject) => {
				pickPasskey = () => resolve(credential);
				signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
			});
		});
		Object.defineProperty(window, 'PublicKeyCredential', {
			configurable: true,
			value: {
				parseRequestOptionsFromJSON: jest.fn(() => parsedOptions),
				isConditionalMediationAvailable: mockConditionalAvailable,
			},
		});
		Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get: mockGet } });
	});

	afterEach(() => {
		delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;
		delete (navigator as { credentials?: unknown }).credentials;
	});

	it('signs in from the button and goes to the redirect target', async () => {
		render(<LoginForm redirectTo="/tags" />);
		fireEvent.click(passkeyButton());

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/tags'));
		expect(mockGet).toHaveBeenCalledWith(expect.objectContaining({ publicKey: parsedOptions, mediation: undefined }));
		expect(window.PublicKeyCredential.parseRequestOptionsFromJSON).toHaveBeenCalledWith(optionsJson);
		expect(mockVerifyPasskey).toHaveBeenCalledWith(credentialJson);
	});

	it('shows why a non-admin passkey was refused', async () => {
		mockVerifyPasskey.mockResolvedValue({ ok: false, message: 'This account does not have admin access.' });
		render(<LoginForm redirectTo="/" />);
		fireEvent.click(passkeyButton());

		expect(await screen.findByRole('alert')).toHaveTextContent('This account does not have admin access.');
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('stays quiet when the user closes the passkey sheet', async () => {
		mockGet.mockRejectedValue(new DOMException('cancelled', 'NotAllowedError'));
		render(<LoginForm redirectTo="/" />);
		fireEvent.click(passkeyButton());

		await waitFor(() => expect(mockGet).toHaveBeenCalled());
		await waitFor(() => expect(passkeyButton()).not.toHaveAttribute('aria-busy'));
		expect(mockVerifyPasskey).not.toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
		expect(screen.queryByRole('alert')).toBeNull();
	});

	it('hides the button when the browser has no WebAuthn JSON helpers', () => {
		delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;
		render(<LoginForm redirectTo="/" />);
		expect(screen.queryByRole('button', { name: 'Sign in with a passkey' })).toBeNull();
		expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument();
	});

	it('hides the button once the code is sent', async () => {
		mockRequestOtp.mockResolvedValue({ ok: true });
		render(<LoginForm redirectTo="/" />);
		submit();

		await screen.findByRole('textbox', { name: 'Code sent to your email' });
		expect(screen.queryByRole('button', { name: 'Sign in with a passkey' })).toBeNull();
	});

	it('lets the email field offer passkeys in its autofill menu', () => {
		render(<LoginForm redirectTo="/" />);
		expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('autocomplete', 'username webauthn');
	});

	it('asks for an autofill passkey only when the browser supports it', async () => {
		render(<LoginForm redirectTo="/" />);
		await waitFor(() => expect(mockConditionalAvailable).toHaveBeenCalled());
		await act(async () => {});
		expect(mockGetOptions).not.toHaveBeenCalled();
		expect(mockGet).not.toHaveBeenCalled();
	});

	it('signs in with the passkey picked from autofill, like the button', async () => {
		mockConditionalAvailable.mockResolvedValue(true);
		render(<LoginForm redirectTo="/tags" />);
		await waitFor(() =>
			expect(mockGet).toHaveBeenCalledWith(expect.objectContaining({ publicKey: parsedOptions, mediation: 'conditional' }))
		);

		await act(async () => pickPasskey());

		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/tags'));
		expect(mockVerifyPasskey).toHaveBeenCalledWith(credentialJson);
	});

	it('aborts the autofill request when the button is pressed, without an error', async () => {
		mockConditionalAvailable.mockResolvedValue(true);
		render(<LoginForm redirectTo="/tags" />);
		await waitFor(() => expect(conditionalSignal).toBeDefined());

		fireEvent.click(passkeyButton());

		expect(conditionalSignal?.aborted).toBe(true);
		await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
		expect(mockVerifyPasskey).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('alert')).toBeNull();
	});

	it('aborts the autofill request when the page goes away', async () => {
		mockConditionalAvailable.mockResolvedValue(true);
		const { unmount } = render(<LoginForm redirectTo="/" />);
		await waitFor(() => expect(conditionalSignal).toBeDefined());

		unmount();

		expect(conditionalSignal?.aborted).toBe(true);
		await act(async () => {});
		expect(mockVerifyPasskey).not.toHaveBeenCalled();
	});
});
