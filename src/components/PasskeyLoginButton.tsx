'use client';

// Mirrors vomatt-web src/features/passkeys/PasskeyLoginButton.tsx; change both.
// Admin differences: errors are English messages, and support is checked here
// (web's support.ts also needs the registration helpers, which admin doesn't use).

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { getPasskeyLoginOptions, verifyPasskeyLogin } from '@/lib/api/services/auth';

/** The user closed the browser's passkey sheet, it timed out, or the request was aborted: nothing to report. */
const CANCELLED = ['NotAllowedError', 'AbortError'];

const subscribe = () => () => {};

/** False on the server and during hydration, so the button never mismatches. */
function useSupportsPasskeys() {
	return useSyncExternalStore(
		subscribe,
		() =>
			typeof window.PublicKeyCredential?.parseRequestOptionsFromJSON === 'function' &&
			typeof navigator.credentials?.get === 'function',
		() => false
	);
}

type PasskeyLoginButtonProps = {
	onSignedIn: () => void;
	/** Called with null when a new attempt starts. */
	onError: (message: string | null) => void;
};

/**
 * Signs in with a passkey from this button, or, while it is mounted, from the
 * autofill menu of an input with `autoComplete="username webauthn"`.
 */
export function PasskeyLoginButton({ onSignedIn, onError }: PasskeyLoginButtonProps) {
	const isSupported = useSupportsPasskeys();
	const [isSigningIn, setIsSigningIn] = useState(false);
	const autofill = useRef<AbortController | null>(null);

	/** The autofill request stays quiet until a passkey is picked: it starts on page load, unasked. */
	async function signIn(mediation?: CredentialMediationRequirement, signal?: AbortSignal) {
		const quiet = mediation === 'conditional';
		try {
			const options = await getPasskeyLoginOptions();
			if (!options.ok) {
				if (!quiet) onError(options.message);
				return;
			}
			const credential = await navigator.credentials.get({
				publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options.options),
				mediation,
				signal,
			});
			if (!credential) return;
			const result = await verifyPasskeyLogin((credential as PublicKeyCredential).toJSON());
			if (!result.ok) onError(result.message);
			else onSignedIn();
		} catch (error) {
			const name = (error as { name?: string } | null)?.name ?? '';
			if (!quiet && !CANCELLED.includes(name)) onError('Something went wrong. Try again.');
		}
	}

	const startAutofill = useEffectEvent((signal: AbortSignal) => signIn('conditional', signal));

	useEffect(() => {
		const controller = new AbortController();
		autofill.current = controller;
		(async () => {
			const available =
				typeof window.PublicKeyCredential?.parseRequestOptionsFromJSON === 'function' &&
				(await window.PublicKeyCredential.isConditionalMediationAvailable?.());
			if (available && !controller.signal.aborted) await startAutofill(controller.signal);
		})();
		return () => controller.abort();
	}, []);

	// ponytail: autofill isn't restarted after the button or a failed verify; restart it if users miss it
	const signInWithButton = async () => {
		// A page may run one WebAuthn request at a time
		autofill.current?.abort();
		onError(null);
		setIsSigningIn(true);
		try {
			await signIn();
		} finally {
			setIsSigningIn(false);
		}
	};

	if (!isSupported) return null;
	return (
		<Button type="button" variant="outline" loading={isSigningIn} onClick={signInWithButton}>
			Sign in with a passkey
		</Button>
	);
}
