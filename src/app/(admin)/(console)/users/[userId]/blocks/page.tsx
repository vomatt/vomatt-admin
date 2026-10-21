import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EmptyRow } from '@/components/admin/EmptyRow';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserStatusBadge } from '@/components/users/UserBadges';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { formatDateTime } from '@/lib/format';
import { readPage, readParam } from '@/lib/search-params';
import { AdminUserBlock, AdminUserDetail, Page } from '@/types';

export const metadata: Metadata = { title: 'User blocks' };

const DIRECTIONS = {
	blocking: { label: 'Blocking', description: 'Users this user has blocked, most recent first.' },
	'blocked-by': { label: 'Blocked by', description: 'Users who have blocked this user, most recent first.' },
} as const;

export default async function UserBlocksPage({ params, searchParams }: PageProps<'/users/[userId]/blocks'>) {
	const [{ userId }, query] = await Promise.all([params, searchParams]);
	// Any other direction is a 400 from the API; fall back to the default
	const direction = readParam(query, 'direction') === 'blocked-by' ? 'blocked-by' : 'blocking';
	const userPath = `/admin/users/${encodeURIComponent(userId)}`;

	let user: AdminUserDetail;
	let blocks: Page<AdminUserBlock>;
	try {
		[user, blocks] = await Promise.all([
			adminFetch<AdminUserDetail>(userPath),
			adminFetch<Page<AdminUserBlock>>(withQuery(`${userPath}/blocks`, { direction, page: readPage(query) })),
		]);
	} catch (error) {
		// 400: not a UUID
		if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 400)) notFound();
		throw error;
	}

	const pathname = `/users/${user.id}/blocks`;

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader title={`Blocks: ${user.username}`} description={DIRECTIONS[direction].description}>
				<Button variant="outline" size="sm" asChild>
					<Link href={`/users/${user.id}`}>Back to user</Link>
				</Button>
			</PageHeader>

			<nav aria-label="Direction" className="flex gap-2">
				{(Object.keys(DIRECTIONS) as (keyof typeof DIRECTIONS)[]).map((key) => (
					<Button key={key} variant={key === direction ? 'secondary' : 'outline'} size="sm" asChild>
						<Link href={`${pathname}?direction=${key}`} aria-current={key === direction ? 'page' : undefined}>
							{DIRECTIONS[key].label}
						</Link>
					</Button>
				))}
			</nav>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Display name</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Blocked</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{blocks.content.length ? (
							blocks.content.map((block) => (
								<TableRow key={block.userId}>
									<TableCell>
										<Link href={`/users/${block.userId}`} className="hover:underline">
											{block.username}
										</Link>
									</TableCell>
									<TableCell>{block.displayName ?? '—'}</TableCell>
									<TableCell>
										<UserStatusBadge active={block.active} />
									</TableCell>
									<TableCell className="text-muted-foreground">{formatDateTime(block.blockedAt)}</TableCell>
								</TableRow>
							))
						) : (
							<EmptyRow colSpan={4}>No blocks in this direction.</EmptyRow>
						)}
					</TableBody>
				</Table>
			</div>
			<Pagination
				pathname={pathname}
				params={{ direction }}
				page={blocks.page}
				limit={blocks.limit}
				total={blocks.total}
			/>
		</main>
	);
}
