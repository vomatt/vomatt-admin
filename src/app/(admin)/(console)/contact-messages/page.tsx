import type { Metadata } from 'next';

import { EmptyRow } from '@/components/admin/EmptyRow';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { formatDateTime } from '@/lib/format';
import { readPage } from '@/lib/search-params';
import { AdminContactMessage, Page } from '@/types';

export const metadata: Metadata = { title: 'Contact messages' };

export default async function ContactMessagesPage({ searchParams }: PageProps<'/contact-messages'>) {
	const params = await searchParams;
	const messages = await adminFetch<Page<AdminContactMessage>>(
		withQuery('/admin/contact-messages', { page: readPage(params) })
	);

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader
				title="Contact messages"
				description="Messages visitors sent from the about site's contact form, newest first. Opening this list is recorded in the audit log."
			/>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Message</TableHead>
							<TableHead>Sender</TableHead>
							<TableHead>Language</TableHead>
							<TableHead>Sent</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{messages.content.length ? (
							messages.content.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="max-w-xl whitespace-pre-wrap break-words">{item.message}</TableCell>
									<TableCell>
										<div>{item.name}</div>
										<a href={`mailto:${item.email}`} className="text-link hover:underline">
											{item.email}
										</a>
									</TableCell>
									<TableCell className="text-muted-foreground">{item.locale}</TableCell>
									<TableCell className="text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
								</TableRow>
							))
						) : (
							<EmptyRow colSpan={4}>No contact messages yet.</EmptyRow>
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
