import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageHeader({
	title,
	description,
	parent,
	children,
}: {
	title: ReactNode;
	description?: ReactNode;
	/** The list a detail page belongs to, shown as a breadcrumb above the title */
	parent?: { href: string; label: string };
	children?: ReactNode;
}) {
	return (
		<header className="flex flex-wrap items-end justify-between gap-4">
			<div className="flex flex-col gap-1">
				{parent ? (
					<nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
						<Link href={parent.href} className="hover:text-foreground hover:underline">
							{parent.label}
						</Link>
						<span aria-hidden className="mx-1.5">
							/
						</span>
					</nav>
				) : null}
				<h1 className="display-heading text-2xl">{title}</h1>
				{/* div, not p: descriptions can hold badges */}
				{description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
			</div>
			{children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
		</header>
	);
}
