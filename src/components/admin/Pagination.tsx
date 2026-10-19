import Link from 'next/link';

import { Button } from '@/components/ui/button';

/** Prev/next links that keep the current filters; empty ones are left out. */
export function Pagination({
	pathname,
	params,
	page,
	limit,
	total,
}: {
	pathname: string;
	params: Record<string, string>;
	page: number;
	limit: number;
	total: number;
}) {
	const pages = Math.max(1, Math.ceil(total / limit));
	const href = (target: number) => {
		const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
		query.set('page', String(target));
		return `${pathname}?${query}`;
	};

	return (
		<nav aria-label="Pagination" className="flex items-center justify-between gap-4 text-sm">
			<p className="text-muted-foreground">
				{total} result{total === 1 ? '' : 's'} · page {page} of {pages}
			</p>
			<div className="flex gap-2">
				{page > 1 ? (
					<Button variant="outline" size="sm" asChild>
						<Link href={href(page - 1)}>Previous</Link>
					</Button>
				) : (
					<Button variant="outline" size="sm" disabled>
						Previous
					</Button>
				)}
				{page < pages ? (
					<Button variant="outline" size="sm" asChild>
						<Link href={href(page + 1)}>Next</Link>
					</Button>
				) : (
					<Button variant="outline" size="sm" disabled>
						Next
					</Button>
				)}
			</div>
		</nav>
	);
}
