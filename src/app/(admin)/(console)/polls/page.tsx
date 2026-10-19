import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyRow } from '@/components/admin/EmptyRow';
import { FilterInput, Filters, FilterSelect } from '@/components/admin/Filters';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { PollStatusBadge } from '@/components/admin/PollStatusBadge';
import { AUDIENCE_LABELS } from '@/components/polls/labels';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { formatDateTime, pollStatus } from '@/lib/format';
import { readPage, readParam } from '@/lib/search-params';
import { AdminPoll, Page } from '@/types';

export const metadata: Metadata = { title: 'Polls' };

export default async function PollsPage({ searchParams }: PageProps<'/polls'>) {
	const params = await searchParams;
	const filters = {
		q: readParam(params, 'q'),
		status: readParam(params, 'status'),
		audience: readParam(params, 'audience'),
		deleted: readParam(params, 'deleted'),
		creatorId: readParam(params, 'creatorId'),
	};
	const polls = await adminFetch<Page<AdminPoll>>(withQuery('/admin/votes', { ...filters, page: readPage(params) }));

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader title="Polls" description="Every poll, any audience, deleted ones included, newest first." />
			<Filters pathname="/polls">
				<FilterInput name="q" label="Search" placeholder="Title or description" minLength={2} defaultValue={filters.q} className="w-64" />
				<FilterSelect
					name="status"
					label="Status"
					defaultValue={filters.status}
					options={{ scheduled: 'Scheduled', open: 'Open', ended: 'Ended' }}
				/>
				<FilterSelect name="audience" label="Audience" defaultValue={filters.audience} options={AUDIENCE_LABELS} />
				<FilterSelect
					name="deleted"
					label="Deleted"
					defaultValue={filters.deleted}
					options={{ false: 'Not deleted', true: 'Deleted only' }}
				/>
				{filters.creatorId ? <input type="hidden" name="creatorId" value={filters.creatorId} /> : null}
			</Filters>
			{filters.creatorId ? (
				<p className="text-sm text-muted-foreground">
					Showing polls by one creator.{' '}
					<Link href="/polls" className="underline">
						Show all
					</Link>
				</p>
			) : null}

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Poll</TableHead>
							<TableHead>Creator</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Audience</TableHead>
							<TableHead className="text-right">Turnout</TableHead>
							<TableHead>Ends</TableHead>
							<TableHead>Created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{polls.content.length ? (
							polls.content.map(({ vote, deletedAt }) => (
								<TableRow key={vote.id}>
									<TableCell className="max-w-sm whitespace-normal">
										<Link href={`/polls/${vote.id}`} className="font-medium hover:underline">
											{vote.title}
										</Link>
									</TableCell>
									<TableCell>
										<Link href={`/users/${vote.creatorId}`} className="hover:underline">
											{vote.creatorUsername}
										</Link>
									</TableCell>
									<TableCell>
										<PollStatusBadge status={pollStatus(vote)} deleted={deletedAt !== null} />
									</TableCell>
									<TableCell className="text-muted-foreground">{AUDIENCE_LABELS[vote.audience]}</TableCell>
									<TableCell className="text-right tabular-nums">{vote.participantCount}</TableCell>
									<TableCell className="text-muted-foreground">{formatDateTime(vote.endTime)}</TableCell>
									<TableCell className="text-muted-foreground">{formatDateTime(vote.createdAt)}</TableCell>
								</TableRow>
							))
						) : (
							<EmptyRow colSpan={7}>No polls match these filters.</EmptyRow>
						)}
					</TableBody>
				</Table>
			</div>
			<Pagination pathname="/polls" params={filters} page={polls.page} limit={polls.limit} total={polls.total} />
		</main>
	);
}
