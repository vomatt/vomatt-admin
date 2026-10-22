import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { EmptyRow } from '@/components/admin/EmptyRow';
import { FilterInput, Filters, FilterSelect } from '@/components/admin/Filters';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { deleteComment } from '@/lib/api/services/comments';
import { formatDateTime } from '@/lib/format';
import { readPage, readParam } from '@/lib/search-params';
import { AdminComment, Page } from '@/types';

export const metadata: Metadata = { title: 'Comments' };

export default async function CommentsPage({ searchParams }: PageProps<'/comments'>) {
	const params = await searchParams;
	const filters = {
		q: readParam(params, 'q'),
		deleted: readParam(params, 'deleted'),
		voteId: readParam(params, 'voteId'),
		userId: readParam(params, 'userId'),
	};
	const comments = await adminFetch<Page<AdminComment>>(
		withQuery('/admin/comments', { ...filters, page: readPage(params) })
	);

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader
				title="Comments"
				description="Comments and replies on every poll, newest first. Deleted ones keep their text here."
			/>
			<Filters pathname="/comments">
				<FilterInput name="q" label="Search" placeholder="Text in the comment" defaultValue={filters.q} className="w-64" />
				<FilterSelect
					name="deleted"
					label="Deleted"
					defaultValue={filters.deleted}
					options={{ false: 'Live only', true: 'Deleted only' }}
				/>
				<FilterInput name="voteId" label="Poll ID" defaultValue={filters.voteId} className="w-72 font-mono" />
				<FilterInput name="userId" label="Author ID" defaultValue={filters.userId} className="w-72 font-mono" />
			</Filters>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Comment</TableHead>
							<TableHead>Author</TableHead>
							<TableHead>Poll</TableHead>
							<TableHead>Written</TableHead>
							<TableHead className="w-0">
								<span className="sr-only">Actions</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{comments.content.length ? (
							comments.content.map((comment) => (
								<TableRow key={comment.id}>
									<TableCell className="max-w-md whitespace-normal">
										<p className={comment.deleted ? 'text-muted-foreground line-through' : undefined}>
											{comment.content}
										</p>
										<div className="mt-1 flex gap-1">
											{comment.parentId ? <Badge variant="outline">Reply</Badge> : null}
											{comment.deleted ? <Badge variant="destructive" dot>
													Deleted
												</Badge> : null}
										</div>
									</TableCell>
									<TableCell>
										<Link href={`/users/${comment.userId}`} className="hover:underline">
											{comment.username}
										</Link>
									</TableCell>
									<TableCell className="max-w-xs whitespace-normal">
										<Link href={`/polls/${comment.voteId}`} className="hover:underline">
											{comment.voteTitle}
										</Link>
									</TableCell>
									<TableCell className="text-muted-foreground">{formatDateTime(comment.createdAt)}</TableCell>
									<TableCell>
										{comment.deleted ? null : (
											<ConfirmAction
												action={deleteComment.bind(null, comment.id)}
												label="Delete"
												title="Delete this comment?"
												description="Its text and author leave the public lists. A comment with live replies stays as a placeholder."
												destructive
											/>
										)}
									</TableCell>
								</TableRow>
							))
						) : (
							<EmptyRow colSpan={5}>No comments match these filters.</EmptyRow>
						)}
					</TableBody>
				</Table>
			</div>
			<Pagination
				pathname="/comments"
				params={filters}
				page={comments.page}
				limit={comments.limit}
				total={comments.total}
			/>
		</main>
	);
}
