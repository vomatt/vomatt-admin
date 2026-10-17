'use client';

import { type FormEvent, useState, useTransition } from 'react';

import { buttonClass, errorClass, inputClass } from '@/components/ui/styles';
import { createTag, updateTag } from '@/lib/api/services/tags';
import { Tag, TagInput } from '@/types';

function readInput(formData: FormData): TagInput {
	const text = (name: string) => String(formData.get(name) ?? '').trim();
	return {
		name: text('name'),
		slug: text('slug') || null,
		description: text('description') || null,
		displayOrder: Number(text('displayOrder')) || 0,
	};
}

/** Creates a tag, or replaces `tag` when given. */
export function TagForm({ tag, onDone }: { tag?: Tag; onDone?: () => void }) {
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	// onSubmit, not a form action: React resets an action's form even when it fails
	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const input = readInput(new FormData(form));
		setError(null);
		startTransition(async () => {
			const result = tag ? await updateTag(tag.id, input) : await createTag(input);
			if (!result.ok) return setError(result.message);
			if (!tag) form.reset();
			onDone?.();
		});
	}

	return (
		<form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_6rem_auto] sm:items-end">
			<label className="flex flex-col gap-1 text-sm">
				Name
				<input name="name" required maxLength={30} defaultValue={tag?.name} className={inputClass} />
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Slug
				<input
					name="slug"
					maxLength={50}
					placeholder="From the name"
					defaultValue={tag?.slug}
					className={inputClass}
				/>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Description
				<input
					name="description"
					maxLength={200}
					defaultValue={tag?.description ?? ''}
					className={inputClass}
				/>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Order
				<input
					name="displayOrder"
					type="number"
					step={1}
					defaultValue={tag?.displayOrder ?? 0}
					className={inputClass}
				/>
			</label>
			<button type="submit" disabled={pending} className={buttonClass}>
				{tag ? 'Save' : 'Add tag'}
			</button>
			{error ? (
				<p role="alert" className={`${errorClass} sm:col-span-5`}>
					{error}
				</p>
			) : null}
		</form>
	);
}
