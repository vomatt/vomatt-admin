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
import { ThemeSwitcher } from '@/components/admin/ThemeSwitcher';
import { BrandLogo } from '@/components/BrandLogo';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarSeparator,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import { adminFetch } from '@/lib/api/admin';
import { signout } from '@/lib/api/services/auth';

const NAV = [
	{ items: [{ href: '/', label: 'Overview', icon: RiBarChartBoxLine }] },
	{ label: 'People', items: [{ href: '/users', label: 'Users', icon: RiGroupLine }] },
	{
		label: 'Content',
		items: [
			{ href: '/polls', label: 'Polls', icon: RiSurveyLine },
			{ href: '/comments', label: 'Comments', icon: RiChat3Line },
		],
	},
	{
		label: 'Settings',
		items: [
			{ href: '/tags', label: 'Tags', icon: RiPriceTag3Line },
			{ href: '/lookups', label: 'Lookups', icon: RiNodeTree },
		],
	},
	{ label: 'System', items: [{ href: '/audit-logs', label: 'Audit log', icon: RiFileList3Line }] },
];

/** The access token no longer carries the email, so ask the API; the sidebar works without it. */
async function signedInEmail() {
	try {
		return (await adminFetch<{ email: string | null }>('/users/me')).email ?? undefined;
	} catch {
		return undefined;
	}
}

// Signed-in views; the proxy has already checked the admin session
export default async function ConsoleLayout({ children }: { children: ReactNode }) {
	// SidebarProvider saves the collapsed state in this cookie
	const sidebarOpen = (await cookies()).get('sidebar_state')?.value !== 'false';
	const email = await signedInEmail();

	return (
		<SidebarProvider defaultOpen={sidebarOpen} style={{ '--sidebar-width': '14rem' } as CSSProperties}>
			<Sidebar>
				<SidebarHeader>
					<Link href="/" className="mt-2 w-20 px-2 text-foreground">
						<BrandLogo />
						<span className="sr-only">Vomatt Admin home</span>
					</Link>
				</SidebarHeader>
				<SidebarContent className="gap-0 p-2">
					{NAV.map(({ label, items }) => (
						<SidebarGroup key={items[0].href} className="p-0 pb-2">
							{label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
							<SidebarMenu>
								{items.map(({ href, label, icon: Icon }) => (
									<NavLink key={href} href={href}>
										<Icon aria-hidden />
										{label}
									</NavLink>
								))}
							</SidebarMenu>
						</SidebarGroup>
					))}
					<SidebarSeparator className="mx-0 mb-2" />
					<SidebarMenu>
						{/* No prefetch: the Studio has its own root layout, so it loads as a full page */}
						<NavLink href="/sanity" prefetch={false}>
							<RiExternalLinkLine aria-hidden />
							Content (Sanity)
						</NavLink>
					</SidebarMenu>
				</SidebarContent>
				<SidebarFooter>
					<ThemeSwitcher />
					<SignedInAs email={email} />
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
