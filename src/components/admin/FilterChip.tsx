import { RiCloseLine } from '@remixicon/react';
import Link from 'next/link';

import { EntityLink } from '@/components/admin/EntityLink';
import { type EntityKind } from '@/lib/entities';

/**
 * A filter on one record, shown by name. Removing it keeps the other filters.
 * `name` is null when the ID matched nothing; the raw ID shows instead.
 */
export function FilterChip({
	label,
	kind,
	id,
	name,
	pathname,
	params,
	param,
}: {
	label: string;
	kind: EntityKind;
	id: string;
	name: string | null;
	pathname: string;
	params: Record<string, string>;
	param: string;
}) {
	const rest = new URLSearchParams(Object.entries(params).filter(([key, value]) => key !== param && value));
	const removeHref = rest.size ? `${pathname}?${rest}` : pathname;

	return (
		<span className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/40 py-0.5 pr-1 pl-3 text-sm">
			<span className="text-muted-foreground">{label}</span>
			{name === null ? (
				<span className="truncate font-mono text-xs">{id}</span>
			) : (
				<span className="truncate">
					<EntityLink kind={kind} id={id}>
						{name}
					</EntityLink>
				</span>
			)}
			<Link
				href={removeHref}
				aria-label={`Remove ${label.toLowerCase()} filter`}
				className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
			>
				<RiCloseLine aria-hidden className="size-4" />
			</Link>
		</span>
	);
}
