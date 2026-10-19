'use client';

import { type FormEvent, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { suspendUser } from '@/lib/api/services/users';

/** Asks for an optional reason, which only the audit log keeps. */
export function SuspendDialog({ userId, username }: { userId: string; username: string }) {
	const [open, setOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
		setError(null);
		startTransition(async () => {
			const result = await suspendUser(userId, reason || null);
			if (result.ok) setOpen(false);
			else setError(result.message);
		});
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (pending) return;
				setOpen(next);
				setError(null);
			}}
		>
			<DialogTrigger asChild>
				<Button variant="destructive" size="sm">
					Suspend
				</Button>
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<DialogHeader>
						<DialogTitle>Suspend {username}?</DialogTitle>
						<DialogDescription>
							They are signed out everywhere and can&apos;t sign in or write until unsuspended.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="suspend-reason">Reason (audit log only)</Label>
						<Textarea id="suspend-reason" name="reason" maxLength={500} rows={3} />
					</div>
					{error ? (
						<p role="alert" className="text-sm text-destructive">
							{error}
						</p>
					) : null}
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline" disabled={pending}>
								Cancel
							</Button>
						</DialogClose>
						<Button type="submit" variant="destructive" disabled={pending}>
							Suspend
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
