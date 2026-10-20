'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';

import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';

/** A sidebar link, highlighted on its own section. */
export function NavLink({ href, onClick, ...props }: ComponentProps<typeof Link> & { href: string }) {
	const pathname = usePathname();
	const { setOpenMobile } = useSidebar();
	const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={active}>
				<Link
					href={href}
					aria-current={active ? 'page' : undefined}
					onClick={(event) => {
						setOpenMobile(false);
						onClick?.(event);
					}}
					{...props}
				/>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}
