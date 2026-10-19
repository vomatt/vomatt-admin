import { ChartColumn, ExternalLink, FileText, ListTree, LogOut, MessageSquare, Tags, Users, Vote } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { NavLink } from '@/components/admin/NavLink';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
export default function ConsoleLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-dvh">
			<aside className="sticky top-0 flex h-dvh w-56 shrink-0 flex-col gap-1 border-r bg-sidebar p-4 text-sidebar-foreground">
				<Link href="/" className="mb-4 w-20 px-2 text-foreground">
					<BrandLogo />
					<span className="sr-only">Vomatt Admin home</span>
				</Link>
				<nav className="flex flex-col gap-1 text-sm">
					{NAV.map(({ href, label, icon: Icon }) => (
						<NavLink key={href} href={href}>
							<Icon aria-hidden />
							{label}
						</NavLink>
					))}
					<Separator className="my-2" />
					{/* No prefetch: the Studio has its own root layout, so it loads as a full page */}
					<NavLink href="/sanity" prefetch={false}>
						<ExternalLink aria-hidden />
						Content (Sanity)
					</NavLink>
				</nav>
				<form action={signout} className="mt-auto">
					<Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
						<LogOut aria-hidden />
						Sign out
					</Button>
				</form>
			</aside>
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}
