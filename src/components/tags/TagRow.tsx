'use client';

import { useState } from 'react';

import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { TagForm } from '@/components/tags/TagForm';
import { Button } from '@/components/ui/button';
import { deleteTag } from '@/lib/api/services/tags';
import { Tag } from '@/types';

export function TagRow({ tag }: { tag: Tag }) {
	const [editing, setEditing] = useState(false);

	if (editing) {
		return (
			<li className="flex flex-col gap-2 p-3">
				<TagForm tag={tag} onDone={() => setEditing(false)} />
				<Button variant="link" size="sm" onClick={() => setEditing(false)} className="self-start px-0">
					Cancel
				</Button>
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
			<span className="text-sm text-muted-foreground">{tag.usageCount} poll{tag.usageCount === 1 ? '' : 's'}</span>
			<Button variant="outline" size="sm" onClick={() => setEditing(true)}>
				Edit
			</Button>
			<ConfirmAction
				action={() => deleteTag(tag.id)}
				label="Delete"
				title={`Delete the tag "${tag.name}"?`}
				description="This fails while a poll still uses the tag."
				destructive
			/>
		</li>
	);
}
