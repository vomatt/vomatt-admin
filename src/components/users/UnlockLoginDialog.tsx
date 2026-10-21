'use client';

import { type FormEvent, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { unlockUserLogin } from '@/lib/api/services/users';

const CHANNEL_LABELS: Record<string, string> = { email: 'Email OTP', phone: 'Phone OTP', admin: 'Admin console' };
const TARGET_LABELS: Record<string, string> = {
	lock: 'Lockout',
	attempts: 'Wrong-code counters (discards the current OTP)',
	cooldown: 'Resend cooldown',
};

/** Clears OTP sign-in limits; nothing ticked means every channel and kind. */
export function UnlockLoginDialog({
	userId,
	username,
	channels,
	targets,
}: {
	userId: string;
	username: string;
	channels: string[];
	targets: string[];
}) {
	const [open, setOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cleared, setCleared] = useState<number | null>(null);
	const [pending, startTransition] = useTransition();

	function handleOpenChange(next: boolean) {
		if (pending) return;
		setOpen(next);
		setError(null);
		setCleared(null);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const ip = String(data.get('ip') ?? '').trim();
		setError(null);
		setCleared(null);
		startTransition(async () => {
			const result = await unlockUserLogin(userId, {
				channels: data.getAll('channels').map(String),
				clear: data.getAll('clear').map(String),
				ip: ip || null,
			});
			if (result.ok) setCleared(result.data.clearedEntries);
			else setError(result.message);
		});
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					Unlock login
				</Button>
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<DialogHeader>
						<DialogTitle>Unlock sign-in for {username}?</DialogTitle>
						<DialogDescription>
							Clears OTP lockouts so they can request and verify codes again. This is not an unsuspend. Leave a
							group empty to clear all of it.
						</DialogDescription>
					</DialogHeader>
					<CheckboxGroup legend="Channels" name="channels" values={channels} labels={CHANNEL_LABELS} />
					<CheckboxGroup legend="Clear" name="clear" values={targets} labels={TARGET_LABELS} />
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="unlock-ip">Client IP (optional)</Label>
						<Input id="unlock-ip" name="ip" placeholder="All IPs" />
					</div>
					<FieldError>{error}</FieldError>
					{cleared !== null ? (
						<p role="status" className="text-sm text-muted-foreground">
							{cleared === 0 ? 'Nothing to clear.' : `Cleared ${cleared} ${cleared === 1 ? 'entry' : 'entries'}.`}
						</p>
					) : null}
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline" disabled={pending}>
								Close
							</Button>
						</DialogClose>
						<Button type="submit" loading={pending}>
							Unlock
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function CheckboxGroup({
	legend,
	name,
	values,
	labels,
}: {
	legend: string;
	name: string;
	values: string[];
	labels: Record<string, string>;
}) {
	return (
		<fieldset className="flex flex-col gap-2">
			<legend className="mb-1 text-sm font-medium">{legend}</legend>
			{values.map((value) => (
				<div key={value} className="flex items-center gap-2">
					<Checkbox id={`${name}-${value}`} name={name} value={value} />
					<Label htmlFor={`${name}-${value}`}>{labels[value] ?? value}</Label>
				</div>
			))}
		</fieldset>
	);
}
