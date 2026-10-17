'use client';

import { useState, useTransition } from 'react';

import { TagForm } from '@/components/tags/TagForm';
import { errorClass, secondaryButtonClass } from '@/components/ui/styles';
import { ActionResult } from '@/lib/api/action';
import { deleteTag } from '@/lib/api/services/tags';
import { Tag } from '@/types';

export function TagRow({ tag }: { tag: Tag }) {
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
		if (confirm(`Delete the tag "${tag.name}"?`)) run(() => deleteTag(tag.id));
	}

	if (editing) {
		return (
			<li className="flex flex-col gap-2 p-3">
				<TagForm tag={tag} onDone={() => setEditing(false)} />
				<button type="button" onClick={() => setEditing(false)} className="self-start text-sm underline">
					Cancel
				</button>
			</li>
		);
	}

	return (
		<li className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
			<span className="w-10 text-sm text-muted-foreground tabular-nums">{tag.displayOrder}</span>
			<div className="min-w-0 flex-1">
				<p className="font-medium">
					{tag.name} <span className="font-mono text-xs text-muted-foreground">{tag.slug}</span>
				</p>
				{tag.description ? <p className="text-sm text-muted-foreground">{tag.description}</p> : null}
			</div>
			<span className="text-sm text-muted-foreground">{tag.usageCount} polls</span>
			<button type="button" onClick={() => setEditing(true)} className={secondaryButtonClass}>
				Edit
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
