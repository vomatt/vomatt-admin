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
import { AdminCommentReport, Page } from '@/types';

export const metadata: Metadata = { title: 'Comment reports' };

const REASONS: Record<AdminCommentReport['reason'], string> = {
	SPAM: 'Spam',
	HARASSMENT: 'Harassment',
	HATE: 'Hate',
	MISINFORMATION: 'Misinformation',
	OTHER: 'Other',
};

export default async function CommentReportsPage({ searchParams }: PageProps<'/comment-reports'>) {
	const params = await searchParams;
	const reports = await adminFetch<Page<AdminCommentReport>>(
		withQuery('/admin/comment-reports', { page: readPage(params) })
	);

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader
				title="Comment reports"
				description="Comments users reported, newest first. Deleted ones keep their text. Opening this list is recorded in the audit log."
			/>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Comment</TableHead>
							<TableHead>Author</TableHead>
							<TableHead>Reason</TableHead>
							<TableHead>Reporter</TableHead>
							<TableHead>Reported</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{reports.content.length ? (
							reports.content.map((report) => (
								<TableRow key={report.id}>
									<TableCell className="max-w-md whitespace-normal">
										<p className={report.commentDeleted ? 'text-muted-foreground line-through' : undefined}>
											{report.commentText}
										</p>
										<div className="mt-1 flex gap-1">
											{report.parentId ? <Badge variant="outline">Reply</Badge> : null}
											{report.commentDeleted ? (
												<Badge variant="destructive" dot>
													Deleted
												</Badge>
											) : null}
										</div>
									</TableCell>
									<TableCell>
										<EntityLink kind="user" id={report.authorId}>
											{report.authorUsername}
										</EntityLink>
									</TableCell>
									<TableCell className="max-w-xs whitespace-pre-wrap">
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
				pathname="/comment-reports"
				params={{}}
				page={reports.page}
				limit={reports.limit}
				total={reports.total}
			/>
		</main>
	);
}
