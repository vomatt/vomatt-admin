import Link from 'next/link';
import type { ReactNode } from 'react';

import { secondaryButtonClass } from '@/components/ui/styles';
import { signout } from '@/lib/api/services/auth';

const NAV = [
	{ href: '/tags', label: 'Tags' },
	{ href: '/lookups', label: 'Lookups' },
];
const navLinkClass = 'rounded-md px-2 py-1.5 hover:bg-muted';

// Signed-in views; the proxy has already checked the admin session
export default function ConsoleLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-dvh">
			<aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-border p-4">
				<Link href="/" className="mb-4 font-semibold">
					Vomatt Admin
				</Link>
				<nav className="flex flex-col gap-1 text-sm">
					{NAV.map(({ href, label }) => (
						<Link key={href} href={href} className={navLinkClass}>
							{label}
						</Link>
					))}
					{/* No prefetch: the Studio has its own root layout, so it loads as a full page */}
					<Link href="/sanity" prefetch={false} className={navLinkClass}>
						Content (Sanity)
					</Link>
				</nav>
				<form action={signout} className="mt-auto">
					<button type="submit" className={secondaryButtonClass}>
						Sign out
					</button>
				</form>
			</aside>
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}
