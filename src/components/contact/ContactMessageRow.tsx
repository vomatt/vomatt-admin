'use client';

import { type MouseEvent, useState } from 'react';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { TableCell, TableRow } from '@/components/ui/table';
import { AdminContactMessage } from '@/types';

/** One contact message as a table row; the message is clamped and the row opens it in full. */
export function ContactMessageRow({ item, received }: { item: AdminContactMessage; received: string }) {
	const [open, setOpen] = useState(false);

	function handleRowClick(event: MouseEvent<HTMLTableRowElement>) {
		const target = event.target as Element;
		// The dialog is portaled out of the row, but React still bubbles its clicks here.
		if (!event.currentTarget.contains(target)) return;
		if (target.closest('a, button')) return;
		if (window.getSelection()?.toString()) return;
		setOpen(true);
	}

	return (
		<TableRow className="cursor-pointer" onClick={handleRowClick}>
			<TableCell className="align-top text-muted-foreground">{received}</TableCell>
			<TableCell className="align-top">{item.name}</TableCell>
			<TableCell className="align-top">
				<EmailLink email={item.email} className="underline underline-offset-4" />
			</TableCell>
			<TableCell className="align-top">{item.locale}</TableCell>
			<TableCell className="max-w-xl align-top whitespace-normal">
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<button
							type="button"
							aria-label={`Read message from ${item.name}`}
							className="line-clamp-2 w-full cursor-pointer rounded-sm text-left wrap-anywhere outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
						>
							{item.message}
						</button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-lg">
						<DialogHeader>
							<DialogTitle>Message from {item.name}</DialogTitle>
							<DialogDescription>
								<EmailLink email={item.email} /> · {item.locale} · {received}
							</DialogDescription>
						</DialogHeader>
						<p className="max-h-[60vh] overflow-y-auto break-words whitespace-pre-wrap">{item.message}</p>
					</DialogContent>
				</Dialog>
			</TableCell>
		</TableRow>
	);
}

function EmailLink({ email, className }: { email: string; className?: string }) {
	return (
		<a href={`mailto:${email}`} className={className}>
			{email}
		</a>
	);
}
