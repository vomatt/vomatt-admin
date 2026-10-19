import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ANY } from '@/lib/search-params';

/** A GET form: submitting puts the filters in the URL and starts at page 1. */
export function Filters({ pathname, children }: { pathname: string; children: ReactNode }) {
	return (
		<form action={pathname} className="flex flex-wrap items-end gap-3">
			{children}
			<Button type="submit">Filter</Button>
			<Button variant="ghost" asChild>
				<Link href={pathname}>Reset</Link>
			</Button>
		</form>
	);
}

export function FilterInput({
	name,
	label,
	defaultValue,
	className,
	...props
}: { name: string; label: string; defaultValue: string; className?: string } & Omit<
	React.ComponentProps<'input'>,
	'name' | 'defaultValue'
>) {
	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={`filter-${name}`}>{label}</Label>
			<Input
				id={`filter-${name}`}
				name={name}
				defaultValue={defaultValue}
				className={className ?? 'w-48'}
				{...props}
			/>
		</div>
	);
}

/** `options` maps query values to labels; "Any" sends no filter. */
export function FilterSelect({
	name,
	label,
	defaultValue,
	options,
}: {
	name: string;
	label: string;
	defaultValue: string;
	options: Record<string, string>;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={`filter-${name}`}>{label}</Label>
			<Select name={name} defaultValue={defaultValue || ANY}>
				<SelectTrigger id={`filter-${name}`} className="w-40">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ANY}>Any</SelectItem>
					{Object.entries(options).map(([value, text]) => (
						<SelectItem key={value} value={value}>
							{text}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
