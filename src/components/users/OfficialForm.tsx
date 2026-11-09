'use client';

import { type FormEvent, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOfficial } from '@/lib/api/services/officials';

/** Creates an official account (a group's page) and its first owner. */
export function OfficialForm() {
	const [error, setError] = useState<string | null>(null);
	const [created, setCreated] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	// onSubmit, not a form action: React resets an action's form even when it fails
	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		const text = (name: string) => String(data.get(name) ?? '').trim();
		setError(null);
		setCreated(null);
		startTransition(async () => {
			const result = await createOfficial({
				username: text('username'),
				displayName: text('displayName'),
				ownerUserId: text('ownerUserId'),
			});
			if (!result.ok) return setError(result.message);
			form.reset();
			setCreated(result.data.username);
		});
	}

	return (
		<form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
			<Label className="flex-col items-stretch gap-1.5">
				Username
				<Input name="username" required minLength={3} maxLength={50} pattern="[a-z0-9_]+" placeholder="sunrise_tower" />
			</Label>
			<Label className="flex-col items-stretch gap-1.5">
				Group name
				<Input name="displayName" required maxLength={100} />
			</Label>
			<Label className="flex-col items-stretch gap-1.5">
				Owner user ID
				<Input name="ownerUserId" required className="font-mono" />
			</Label>
			<Button type="submit" loading={pending}>
				Create
			</Button>
			<FieldError className="sm:col-span-4">{error}</FieldError>
			{created ? (
				<p role="status" className="text-sm text-muted-foreground sm:col-span-4">
					Created @{created}.
				</p>
			) : null}
		</form>
	);
}
