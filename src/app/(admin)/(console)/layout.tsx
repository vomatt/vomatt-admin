import { ChartColumn, ExternalLink, FileText, ListTree, LogOut, MessageSquare, Tags, Users, Vote } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import { NavLink } from '@/components/admin/NavLink';
import { BrandLogo } from '@/components/BrandLogo';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarSeparator,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import { signout } from '@/lib/api/services/auth';

const NAV = [
	{ href: '/', label: 'Overview', icon: ChartColumn },
	{ href: '/users', label: 'Users', icon: Users },
	{ href: '/polls', label: 'Polls', icon: Vote },
	{ href: '/comments', label: 'Comments', icon: MessageSquare },
	{ href: '/audit-logs', label: 'Audit log', icon: FileText },
	{ href: '/tags', label: 'Tags', icon: Tags },
	{ href: '/lookups', label: 'Lookups', icon: ListTree },
];

// Signed-in views; the proxy has already checked the admin session
export default async function ConsoleLayout({ children }: { children: ReactNode }) {
	// SidebarProvider saves the collapsed state in this cookie
	const sidebarOpen = (await cookies()).get('sidebar_state')?.value !== 'false';

	return (
		<SidebarProvider defaultOpen={sidebarOpen} style={{ '--sidebar-width': '14rem' } as CSSProperties}>
			<Sidebar>
				<SidebarHeader>
					<Link href="/" className="mt-2 w-20 px-2 text-foreground">
						<BrandLogo />
						<span className="sr-only">Vomatt Admin home</span>
					</Link>
				</SidebarHeader>
				<SidebarContent className="p-2">
					<SidebarMenu>
						{NAV.map(({ href, label, icon: Icon }) => (
							<NavLink key={href} href={href}>
								<Icon aria-hidden />
								{label}
							</NavLink>
						))}
					</SidebarMenu>
					<SidebarSeparator className="mx-0" />
					<SidebarMenu>
						{/* No prefetch: the Studio has its own root layout, so it loads as a full page */}
						<NavLink href="/sanity" prefetch={false}>
							<ExternalLink aria-hidden />
							Content (Sanity)
						</NavLink>
					</SidebarMenu>
				</SidebarContent>
				<SidebarFooter>
					<form action={signout}>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton type="submit" className="text-muted-foreground">
									<LogOut aria-hidden />
									Sign out
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</form>
				</SidebarFooter>
			</Sidebar>
			<div className="min-w-0 flex-1">
				<SidebarTrigger className="m-2" />
				{children}
			</div>
		</SidebarProvider>
	);
}
