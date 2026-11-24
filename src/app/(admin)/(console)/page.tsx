import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { AdminStats, Page } from '@/types';

export const metadata: Metadata = { title: 'Overview' };

interface Stat {
	label: string;
	value: number;
	href?: string;
}

const number = new Intl.NumberFormat('en');

/** How many rows a list endpoint holds, read from a one-row page; the stats endpoint has no count for these. */
async function total(path: string, filters: Record<string, string> = {}) {
	return (await adminFetch<Page<unknown>>(withQuery(path, { ...filters, limit: 1 }))).total;
}

export default async function AdminHomePage() {
	const [stats, pollsScheduled, comments, commentReports, pollReports, feedback, contactMessages] = await Promise.all([
		adminFetch<AdminStats>('/admin/stats'),
		total('/admin/votes', { status: 'scheduled', deleted: 'false' }),
		total('/admin/comments'),
		total('/admin/comment-reports'),
		total('/admin/vote-reports'),
		total('/admin/feedback'),
		total('/admin/contact-messages'),
	]);

	const sections: { title: string; stats: Stat[] }[] = [
		{
			title: 'Users',
			stats: [
				{ label: 'Users', value: stats.usersTotal, href: '/users' },
				{ label: 'New, last 7 days', value: stats.usersNewLast7Days, href: '/users' },
				{ label: 'Suspended', value: stats.usersSuspended, href: '/users?status=suspended' },
			],
		},
		{
			title: 'Polls',
			stats: [
				{ label: 'Open', value: stats.pollsInProgress, href: '/polls?status=open&deleted=false' },
				{ label: 'Scheduled', value: pollsScheduled, href: '/polls?status=scheduled&deleted=false' },
				{ label: 'Ended', value: stats.pollsEnded, href: '/polls?status=ended&deleted=false' },
				{ label: 'Deleted', value: stats.pollsDeleted, href: '/polls?deleted=true' },
			],
		},
		{
			title: 'Activity',
			stats: [
				{ label: 'Ballots, last 24 hours', value: stats.ballotsLast24Hours },
				{ label: 'Comments', value: comments, href: '/comments' },
			],
		},
		{
			title: 'Inbox',
			stats: [
				{ label: 'Comment reports', value: commentReports, href: '/comment-reports' },
				{ label: 'Poll reports', value: pollReports, href: '/vote-reports' },
				{ label: 'Feedback', value: feedback, href: '/feedback' },
				{ label: 'Contact messages', value: contactMessages, href: '/contact-messages' },
			],
		},
	];

	return (
		<main className="flex flex-col gap-6 p-4 sm:p-8">
			<PageHeader title="Overview" description="Live counts from vomatt-api." />
			{sections.map(({ title, stats }) => (
				<section key={title} aria-labelledby={`stats-${title}`} className="flex flex-col gap-3">
					<h2 id={`stats-${title}`} className="text-sm font-medium text-muted-foreground">
						{title}
					</h2>
					<ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
						{stats.map(({ label, value, href }) => {
							const card = (
								<Card size="sm" className={href ? 'h-full transition-colors hover:bg-muted/50' : 'h-full'}>
									<CardHeader>
										<CardDescription>{label}</CardDescription>
										<CardTitle className="text-2xl tabular-nums sm:text-3xl">{number.format(value)}</CardTitle>
									</CardHeader>
								</Card>
							);
							return (
								<li key={label}>
									{href ? (
										<Link
											href={href}
											aria-label={`${title}: ${label}, ${number.format(value)}`}
											className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
										>
											{card}
										</Link>
									) : (
										card
									)}
								</li>
							);
						})}
					</ul>
				</section>
			))}
		</main>
	);
}
