'use client';

import { type MouseEvent, type ReactNode, useState, useTransition } from 'react';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ActionResult } from '@/lib/api/action';

/**
 * A button that asks before running `action` (usually a bound Server Action).
 * The dialog stays open while it runs and shows the API's error if it fails.
 */
export function ConfirmAction({
	action,
	label,
	title,
	description,
	confirmLabel = label,
	destructive = false,
}: {
	action: () => Promise<ActionResult<unknown>>;
	label: string;
	title: string;
	description: ReactNode;
	confirmLabel?: string;
	destructive?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	function handleConfirm(event: MouseEvent) {
		event.preventDefault(); // close only once the action succeeds
		setError(null);
		startTransition(async () => {
			const result = await action();
			if (result.ok) setOpen(false);
			else setError(result.message);
		});
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (pending) return;
				setOpen(next);
				setError(null);
			}}
		>
			<AlertDialogTrigger asChild>
				<Button variant={destructive ? 'destructive' : 'outline'} size="sm">
					{label}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				{error ? (
					<p role="alert" className="text-sm text-destructive">
						{error}
					</p>
				) : null}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant={destructive ? 'destructive' : 'default'}
						disabled={pending}
						onClick={handleConfirm}
					>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
