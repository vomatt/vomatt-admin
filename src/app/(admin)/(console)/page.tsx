import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminFetch } from '@/lib/api/admin';
import { AdminStats } from '@/types';

export const metadata: Metadata = { title: 'Overview' };

const STATS: { key: keyof AdminStats; label: string; href?: string }[] = [
	{ key: 'usersTotal', label: 'Users', href: '/users' },
	{ key: 'usersNewLast7Days', label: 'New users, last 7 days', href: '/users' },
	{ key: 'usersSuspended', label: 'Suspended users', href: '/users?status=suspended' },
	{ key: 'pollsInProgress', label: 'Open polls', href: '/polls?status=open&deleted=false' },
	{ key: 'pollsEnded', label: 'Ended polls', href: '/polls?status=ended&deleted=false' },
	{ key: 'pollsDeleted', label: 'Deleted polls', href: '/polls?deleted=true' },
	{ key: 'ballotsLast24Hours', label: 'Ballots, last 24 hours' },
];

const number = new Intl.NumberFormat('en');

export default async function AdminHomePage() {
	const stats = await adminFetch<AdminStats>('/admin/stats');

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader title="Overview" description="Live counts from vomatt-api." />
			<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{STATS.map(({ key, label, href }) => {
					const card = (
						<Card className={href ? 'transition-colors hover:bg-muted/50' : undefined}>
							<CardHeader>
								<CardDescription>{label}</CardDescription>
								<CardTitle className="text-3xl tabular-nums">{number.format(stats[key])}</CardTitle>
							</CardHeader>
						</Card>
					);
					return (
						<li key={key}>
							{href ? (
								<Link href={href} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
									{card}
								</Link>
							) : (
								card
							)}
						</li>
					);
				})}
			</ul>
		</main>
	);
}
