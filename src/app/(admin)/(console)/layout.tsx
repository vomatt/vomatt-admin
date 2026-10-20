import {
	RiBarChartBoxLine,
	RiChat3Line,
	RiExternalLinkLine,
	RiFileList3Line,
	RiGroupLine,
	RiLogoutBoxRLine,
	RiNodeTree,
	RiPriceTag3Line,
	RiSurveyLine,
} from '@remixicon/react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import { NavLink } from '@/components/admin/NavLink';
import { SignedInAs } from '@/components/admin/SignedInAs';
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
import { ACCESS_TOKEN } from '@/lib/api/constants';
import { signout } from '@/lib/api/services/auth';
import { verifyAccessToken } from '@/lib/api/tokens';

const NAV = [
	{ href: '/', label: 'Overview', icon: RiBarChartBoxLine },
	{ href: '/users', label: 'Users', icon: RiGroupLine },
	{ href: '/polls', label: 'Polls', icon: RiSurveyLine },
	{ href: '/comments', label: 'Comments', icon: RiChat3Line },
	{ href: '/audit-logs', label: 'Audit log', icon: RiFileList3Line },
	{ href: '/tags', label: 'Tags', icon: RiPriceTag3Line },
	{ href: '/lookups', label: 'Lookups', icon: RiNodeTree },
];

// Signed-in views; the proxy has already checked the admin session
export default async function ConsoleLayout({ children }: { children: ReactNode }) {
	// SidebarProvider saves the collapsed state in this cookie
	const cookieStore = await cookies();
	const sidebarOpen = cookieStore.get('sidebar_state')?.value !== 'false';
	const accessToken = cookieStore.get(ACCESS_TOKEN)?.value;
	const email = accessToken ? (await verifyAccessToken(accessToken))?.email : undefined;

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
							<RiExternalLinkLine aria-hidden />
							Content (Sanity)
						</NavLink>
					</SidebarMenu>
				</SidebarContent>
				<SidebarFooter>
					{email ? <SignedInAs email={email} /> : null}
					<form action={signout}>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton type="submit" className="text-muted-foreground">
									<RiLogoutBoxRLine aria-hidden />
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
