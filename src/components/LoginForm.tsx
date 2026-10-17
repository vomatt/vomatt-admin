'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState, useTransition } from 'react';

import { buttonClass, errorClass, inputClass } from '@/components/ui/styles';
import { requestOtp, verifyOtp } from '@/lib/api/services/auth';

/** Two steps: email → emailed code. `redirectTo` is already a safe same-origin path. */
export function LoginForm({ redirectTo, notice }: { redirectTo: string; notice?: string }) {
	const router = useRouter();
	const [codeSent, setCodeSent] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	// onSubmit, not a form action: React resets an action's form even when it fails
	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const email = String(data.get('email') ?? '');
		const code = String(data.get('code') ?? '');
		setError(null);
		startTransition(async () => {
			if (!codeSent) {
				const result = await requestOtp(email);
				if (result.ok) setCodeSent(true);
				else setError(result.message);
				return;
			}
			const result = await verifyOtp(email, code);
			if (result.ok) router.replace(redirectTo);
			else setError(result.message);
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
			{notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
			<label className="flex flex-col gap-1.5 text-sm">
				Email
				<input
					type="email"
					name="email"
					required
					autoComplete="email"
					readOnly={codeSent}
					className={inputClass}
				/>
			</label>
			{codeSent ? (
				<label className="flex flex-col gap-1.5 text-sm">
					Code sent to your email
					<input
						name="code"
						required
						inputMode="numeric"
						autoComplete="one-time-code"
						pattern="[0-9]{6}"
						maxLength={6}
						autoFocus
						className={inputClass}
					/>
				</label>
			) : null}
			{error ? (
				<p role="alert" className={errorClass}>
					{error}
				</p>
			) : null}
			<button type="submit" disabled={pending} className={buttonClass}>
				{codeSent ? 'Sign in' : 'Send code'}
			</button>
			{codeSent ? (
				<button
					type="button"
					onClick={() => {
						setCodeSent(false);
						setError(null);
					}}
					className="text-sm text-muted-foreground underline"
				>
					Use a different email
				</button>
			) : null}
		</form>
	);
}
