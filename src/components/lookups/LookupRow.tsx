'use client';

import { useState, useTransition } from 'react';

import { LookupForm } from '@/components/lookups/LookupForm';
import { errorClass, secondaryButtonClass } from '@/components/ui/styles';
import { ActionResult } from '@/lib/api/action';
import { deleteLookup, setLookupActive } from '@/lib/api/services/lookups';
import { Lookup } from '@/types';

export function LookupRow({ lookup }: { lookup: Lookup }) {
	const [editing, setEditing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	function run(action: () => Promise<ActionResult<void>>) {
		setError(null);
		startTransition(async () => {
			const result = await action();
			if (!result.ok) setError(result.message);
		});
	}

	function handleDelete() {
		if (!confirm(`Delete ${lookup.lookupType}/${lookup.lookupKey}? Deactivate it instead if it may come back.`)) {
			return;
		}
		run(() => deleteLookup(lookup.id));
	}

	if (editing) {
		return (
			<li className="flex flex-col gap-2 p-3">
				<LookupForm lookup={lookup} onDone={() => setEditing(false)} />
				<button type="button" onClick={() => setEditing(false)} className="self-start text-sm underline">
					Cancel
				</button>
			</li>
		);
	}

	return (
		<li className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
			<span className="w-10 text-sm text-muted-foreground tabular-nums">{lookup.seq}</span>
			<div className="min-w-0 flex-1">
				<p className="font-medium">
					<span className="font-mono">{lookup.lookupKey}</span>
					{lookup.isActive ? null : <span className="ml-2 text-xs text-muted-foreground">inactive</span>}
					{lookup.frontendUsing ? <span className="ml-2 text-xs text-muted-foreground">frontend</span> : null}
				</p>
				<p className="truncate font-mono text-xs text-muted-foreground">
					{JSON.stringify(lookup.lookupValue)}
				</p>
				{lookup.description ? <p className="text-sm text-muted-foreground">{lookup.description}</p> : null}
				{lookup.parentType ? (
					<p className="text-xs text-muted-foreground">
						Parent: {lookup.parentType}/{lookup.parentKey}
					</p>
				) : null}
			</div>
			<button type="button" onClick={() => setEditing(true)} className={secondaryButtonClass}>
				Edit
			</button>
			<button
				type="button"
				onClick={() => run(() => setLookupActive(lookup.id, !lookup.isActive))}
				disabled={pending}
				className={secondaryButtonClass}
			>
				{lookup.isActive ? 'Deactivate' : 'Activate'}
			</button>
			<button type="button" onClick={handleDelete} disabled={pending} className={secondaryButtonClass}>
				Delete
			</button>
			{error ? (
				<p role="alert" className={`${errorClass} basis-full`}>
					{error}
				</p>
			) : null}
		</li>
	);
}
