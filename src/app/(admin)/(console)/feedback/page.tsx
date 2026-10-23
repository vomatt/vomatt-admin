import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EmptyRow } from '@/components/admin/EmptyRow';
import { EntityLink } from '@/components/admin/EntityLink';
import { FilterChip } from '@/components/admin/FilterChip';
import { FilterInput, Filters } from '@/components/admin/Filters';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { entityName } from '@/lib/entity-name';
import { formatDateTime } from '@/lib/format';
import { readPage, readParam } from '@/lib/search-params';
import { AdminFeedback, Page } from '@/types';

export const metadata: Metadata = { title: 'Feedback' };

export default async function FeedbackPage({ searchParams }: PageProps<'/feedback'>) {
	const params = await searchParams;
	const filters = { userId: readParam(params, 'userId') };
	let feedback: Page<AdminFeedback>;
	let senderName: string | null;
	try {
		[feedback, senderName] = await Promise.all([
			adminFetch<Page<AdminFeedback>>(withQuery('/admin/feedback', { ...filters, page: readPage(params) })),
			filters.userId ? entityName('user', filters.userId) : null,
		]);
	} catch (error) {
		// 400: userId is not a UUID
		if (error instanceof ApiError && error.statusCode === 400) notFound();
		throw error;
	}

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader
				title="Feedback"
				description="Product feedback users sent from the app, newest first. Opening this list is recorded in the audit log."
			/>
			<Filters pathname="/feedback">
				{filters.userId ? (
					<input type="hidden" name="userId" value={filters.userId} />
				) : (
					<FilterInput name="userId" label="Sender ID" defaultValue="" className="w-72 font-mono" />
				)}
			</Filters>
			{filters.userId ? (
				<div className="flex flex-wrap gap-2">
					<FilterChip
						label="Sender"
						kind="user"
						id={filters.userId}
						name={senderName}
						pathname="/feedback"
						params={filters}
						param="userId"
					/>
				</div>
			) : null}

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Feedback</TableHead>
							<TableHead>Sender</TableHead>
							<TableHead>Sent</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{feedback.content.length ? (
							feedback.content.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="max-w-xl whitespace-pre-wrap">{item.content}</TableCell>
									<TableCell>
										<EntityLink kind="user" id={item.userId}>
											{item.username}
										</EntityLink>
									</TableCell>
									<TableCell className="text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
								</TableRow>
							))
						) : (
							<EmptyRow colSpan={3}>{filters.userId ? 'No feedback from this sender.' : 'No feedback yet.'}</EmptyRow>
						)}
					</TableBody>
				</Table>
			</div>
			<Pagination
				pathname="/feedback"
				params={filters}
				page={feedback.page}
				limit={feedback.limit}
				total={feedback.total}
			/>
		</main>
	);
}
