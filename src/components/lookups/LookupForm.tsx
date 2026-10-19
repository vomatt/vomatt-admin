'use client';

import { type FormEvent, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createLookup, updateLookup } from '@/lib/api/services/lookups';
import { Lookup, LookupInput } from '@/types';

/** Exported for tests. `lookupValue` must be JSON: quote plain strings. */
export function readLookupInput(formData: FormData): LookupInput | string {
	const text = (name: string) => String(formData.get(name) ?? '').trim();
	let lookupValue: unknown;
	try {
		lookupValue = JSON.parse(text('lookupValue'));
	} catch {
		return 'Value must be valid JSON, e.g. "label", 24 or {"hours": 24}.';
	}
	if (lookupValue === null) return 'Value cannot be null.';
	return {
		lookupType: text('lookupType'),
		lookupKey: text('lookupKey'),
		lookupValue,
		description: text('description') || null,
		parentType: text('parentType') || null,
		parentKey: text('parentKey') || null,
		seq: Number(text('seq')) || 0,
		frontendUsing: formData.get('frontendUsing') === 'on',
	};
}

/**
 * Creates an item, or updates `lookup` when given. The API's update is
 * partial, so emptied optional fields keep their old value.
 */
export function LookupForm({
	lookup,
	defaultType,
	onDone,
}: {
	lookup?: Lookup;
	defaultType?: string;
	onDone?: () => void;
}) {
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	// onSubmit, not a form action: React resets an action's form even when it fails
	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const input = readLookupInput(new FormData(form));
		if (typeof input === 'string') return setError(input);
		setError(null);
		startTransition(async () => {
			const result = lookup ? await updateLookup(lookup.id, input) : await createLookup(input);
			if (!result.ok) return setError(result.message);
			if (!lookup) form.reset();
			onDone?.();
		});
	}

	const field = (name: keyof LookupInput, label: string, value?: string | null, required = false) => (
		<Label className="flex-col items-stretch gap-1.5">
			{label}
			<Input name={name} required={required} maxLength={50} defaultValue={value ?? ''} />
		</Label>
	);

	return (
		<form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-4">
			{field('lookupType', 'Type', lookup?.lookupType ?? defaultType, true)}
			{field('lookupKey', 'Key', lookup?.lookupKey, true)}
			{field('parentType', 'Parent type', lookup?.parentType)}
			{field('parentKey', 'Parent key', lookup?.parentKey)}
			<Label className="flex-col items-stretch gap-1.5 sm:col-span-2">
				Value (JSON)
				<Textarea
					name="lookupValue"
					required
					rows={3}
					defaultValue={lookup ? JSON.stringify(lookup.lookupValue, null, 2) : ''}
					className="font-mono"
				/>
			</Label>
			<Label className="flex-col items-stretch gap-1.5 sm:col-span-2">
				Description
				<Input name="description" maxLength={100} defaultValue={lookup?.description ?? ''} />
			</Label>
			<Label className="flex-col items-stretch gap-1.5">
				Order
				<Input name="seq" type="number" step={1} defaultValue={lookup?.seq ?? 0} />
			</Label>
			<Label className="self-end pb-2">
				<Checkbox name="frontendUsing" defaultChecked={lookup?.frontendUsing} />
				In frontend dictionary
			</Label>
			<Button type="submit" disabled={pending} className="self-end sm:col-start-4">
				{lookup ? 'Save' : 'Add item'}
			</Button>
			{lookup ? (
				<p className="text-sm text-muted-foreground sm:col-span-4">
					Emptied optional fields keep their current value: the API can&apos;t clear them.
				</p>
			) : null}
			{error ? (
				<p role="alert" className="text-sm text-destructive sm:col-span-4">
					{error}
				</p>
			) : null}
		</form>
	);
}
