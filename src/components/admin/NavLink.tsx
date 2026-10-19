'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** A sidebar link, highlighted on its own section. */
export function NavLink({ href, className, ...props }: ComponentProps<typeof Link> & { href: string }) {
	const pathname = usePathname();
	const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

	return (
		<Link
			href={href}
			aria-current={active ? 'page' : undefined}
			className={cn(
				'flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-4',
				active && 'bg-muted font-medium text-foreground',
				className
			)}
			{...props}
		/>
	);
}
