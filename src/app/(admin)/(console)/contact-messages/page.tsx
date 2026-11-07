import type { Metadata } from 'next';

import { EmptyRow } from '@/components/admin/EmptyRow';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { formatDateTime } from '@/lib/format';
import { readPage } from '@/lib/search-params';
import { AdminContactMessage, Page } from '@/types';

export const metadata: Metadata = { title: 'Contact' };

export default async function ContactMessagesPage({ searchParams }: PageProps<'/contact-messages'>) {
	const params = await searchParams;
	const messages = await adminFetch<Page<AdminContactMessage>>(
		withQuery('/admin/contact-messages', { page: readPage(params) })
	);

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader
				title="Contact"
				description="Messages sent from the contact form on about.vomatt.com, newest first. Opening this list is recorded in the audit log."
			/>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Received</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Language</TableHead>
							<TableHead>Message</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{messages.content.length ? (
							messages.content.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="align-top text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
									<TableCell className="align-top">{item.name}</TableCell>
									<TableCell className="align-top">
										<a href={`mailto:${item.email}`} className="underline underline-offset-4">
											{item.email}
										</a>
									</TableCell>
									<TableCell className="align-top">{item.locale}</TableCell>
									<TableCell className="max-w-xl align-top break-words whitespace-pre-wrap">{item.message}</TableCell>
								</TableRow>
							))
						) : (
							<EmptyRow colSpan={5}>No messages yet.</EmptyRow>
						)}
					</TableBody>
				</Table>
			</div>
			<Pagination
				pathname="/contact-messages"
				params={{}}
				page={messages.page}
				limit={messages.limit}
				total={messages.total}
			/>
		</main>
	);
}
