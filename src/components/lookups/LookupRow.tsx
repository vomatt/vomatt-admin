'use client';

import { useState, useTransition } from 'react';

import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { LookupForm } from '@/components/lookups/LookupForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { deleteLookup, setLookupActive } from '@/lib/api/services/lookups';
import { Lookup } from '@/types';

export function LookupRow({ lookup }: { lookup: Lookup }) {
	const [editing, setEditing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	function toggleActive() {
		setError(null);
		startTransition(async () => {
			const result = await setLookupActive(lookup.id, !lookup.isActive);
			if (!result.ok) setError(result.message);
		});
	}

	if (editing) {
		return (
			<li className="flex flex-col gap-2 p-3">
				<LookupForm lookup={lookup} onDone={() => setEditing(false)} />
				<Button variant="link" size="sm" onClick={() => setEditing(false)} className="self-start px-0">
					Cancel
				</Button>
			</li>
		);
	}

	return (
		<li className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
			<span className="w-10 text-sm text-muted-foreground tabular-nums">{lookup.seq}</span>
			<div className="min-w-0 flex-1">
				<p className="flex items-center gap-2 font-medium">
					<span className="font-mono">{lookup.lookupKey}</span>
					{lookup.isActive ? null : <Badge variant="outline">inactive</Badge>}
					{lookup.frontendUsing ? <Badge variant="secondary">frontend</Badge> : null}
				</p>
				<p className="truncate font-mono text-xs text-muted-foreground">{JSON.stringify(lookup.lookupValue)}</p>
				{lookup.description ? <p className="text-sm text-muted-foreground">{lookup.description}</p> : null}
				{lookup.parentType ? (
					<p className="text-xs text-muted-foreground">
						Parent: {lookup.parentType}/{lookup.parentKey}
					</p>
				) : null}
			</div>
			<Button variant="outline" size="sm" onClick={() => setEditing(true)}>
				Edit
			</Button>
			<Button variant="outline" size="sm" onClick={toggleActive} loading={pending}>
				{lookup.isActive ? 'Deactivate' : 'Activate'}
			</Button>
			<ConfirmAction
				action={() => deleteLookup(lookup.id)}
				label="Delete"
				title={`Delete ${lookup.lookupType}/${lookup.lookupKey}?`}
				description="This can't be undone. Deactivate it instead if it may come back."
				destructive
			/>
			<FieldError className="basis-full">{error}</FieldError>
		</li>
	);
}
