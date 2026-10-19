import type { ReactNode } from 'react';

export function PageHeader({ title, description, children }: { title: ReactNode; description?: ReactNode; children?: ReactNode }) {
	return (
		<header className="flex flex-wrap items-end justify-between gap-4">
			<div className="flex flex-col gap-1">
				<h1 className="display-heading text-2xl">{title}</h1>
				{/* div, not p: descriptions can hold badges */}
				{description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
			</div>
			{children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
		</header>
	);
}
