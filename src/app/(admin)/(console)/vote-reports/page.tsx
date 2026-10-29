import type { Metadata } from 'next';

import { EmptyRow } from '@/components/admin/EmptyRow';
import { EntityLink } from '@/components/admin/EntityLink';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { formatDateTime } from '@/lib/format';
import { readPage } from '@/lib/search-params';
import { AdminVoteReport, Page } from '@/types';

export const metadata: Metadata = { title: 'Poll reports' };

const REASONS: Record<AdminVoteReport['reason'], string> = {
	SPAM: 'Spam',
	HARASSMENT: 'Harassment',
	HATE: 'Hate',
	MISINFORMATION: 'Misinformation',
	OTHER: 'Other',
};

export default async function VoteReportsPage({ searchParams }: PageProps<'/vote-reports'>) {
	const params = await searchParams;
	const reports = await adminFetch<Page<AdminVoteReport>>(
		withQuery('/admin/vote-reports', { page: readPage(params) })
	);

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader
				title="Poll reports"
				description="Polls users reported, newest first. Deleted ones keep their title and owner. Opening this list is recorded in the audit log."
			/>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Poll</TableHead>
							<TableHead>Owner</TableHead>
							<TableHead>Reason</TableHead>
							<TableHead>Reporter</TableHead>
							<TableHead>Reported</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{reports.content.length ? (
							reports.content.map((report) => (
								<TableRow key={report.id}>
									<TableCell className="max-w-md whitespace-normal break-words">
										<EntityLink kind="poll" id={report.voteId}>
											{report.voteTitle}
										</EntityLink>
										{report.voteDeleted ? (
											<div className="mt-1">
												<Badge variant="destructive" dot>
													Deleted
												</Badge>
											</div>
										) : null}
									</TableCell>
									<TableCell>
										<EntityLink kind="user" id={report.ownerId}>
											{report.ownerUsername}
										</EntityLink>
									</TableCell>
									<TableCell className="max-w-xs break-words whitespace-pre-wrap">
										<Badge variant="outline">{REASONS[report.reason] ?? report.reason}</Badge>
										{report.note ? <p className="mt-1 text-muted-foreground">{report.note}</p> : null}
									</TableCell>
									<TableCell>
										<EntityLink kind="user" id={report.reporterId}>
											{report.reporterUsername}
										</EntityLink>
									</TableCell>
									<TableCell className="text-muted-foreground">{formatDateTime(report.createdAt)}</TableCell>
								</TableRow>
							))
						) : (
							<EmptyRow colSpan={5}>No reports yet.</EmptyRow>
						)}
					</TableBody>
				</Table>
			</div>
			<Pagination
				pathname="/vote-reports"
				params={{}}
				page={reports.page}
				limit={reports.limit}
				total={reports.total}
			/>
		</main>
	);
}
