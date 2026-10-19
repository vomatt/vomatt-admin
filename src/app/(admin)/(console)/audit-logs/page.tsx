import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyRow } from '@/components/admin/EmptyRow';
import { FilterInput, Filters } from '@/components/admin/Filters';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { formatDateTime } from '@/lib/format';
import { readPage, readParam } from '@/lib/search-params';
import { AuditLog, Page } from '@/types';

export const metadata: Metadata = { title: 'Audit log' };

/** Admin views for the resource types that have one. */
const RESOURCE_PATHS: Record<string, string> = { USER: '/users', VOTE: '/polls' };

/** `<input type="datetime-local">` gives a Taipei wall time without an offset. */
function toInstant(local: string) {
	return local ? `${local}:00+08:00` : undefined;
}

export default async function AuditLogsPage({ searchParams }: PageProps<'/audit-logs'>) {
	const params = await searchParams;
	const filters = {
		userId: readParam(params, 'userId'),
		action: readParam(params, 'action'),
		resourceType: readParam(params, 'resourceType'),
		resourceId: readParam(params, 'resourceId'),
		from: readParam(params, 'from'),
		to: readParam(params, 'to'),
	};
	const logs = await adminFetch<Page<AuditLog>>(
		withQuery('/admin/audit-logs', {
			...filters,
			action: filters.action.toUpperCase(),
			resourceType: filters.resourceType.toUpperCase(),
			from: toInstant(filters.from),
			to: toInstant(filters.to),
			page: readPage(params),
		})
	);

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader
				title="Audit log"
				description="Newest first. Entries are written asynchronously and may appear a moment late. Times are Taipei time."
			/>
			<Filters pathname="/audit-logs">
				<FilterInput name="action" label="Action" placeholder="e.g. SUSPEND" defaultValue={filters.action} className="w-36" />
				<FilterInput
					name="resourceType"
					label="Resource type"
					placeholder="e.g. VOTE"
					defaultValue={filters.resourceType}
					className="w-36"
				/>
				<FilterInput name="resourceId" label="Resource ID" defaultValue={filters.resourceId} className="w-72 font-mono" />
				<FilterInput name="userId" label="Actor ID" defaultValue={filters.userId} className="w-72 font-mono" />
				<FilterInput name="from" label="From" type="datetime-local" defaultValue={filters.from} className="w-52" />
				<FilterInput name="to" label="Until" type="datetime-local" defaultValue={filters.to} className="w-52" />
			</Filters>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>When</TableHead>
							<TableHead>Actor</TableHead>
							<TableHead>Action</TableHead>
							<TableHead>Resource</TableHead>
							<TableHead>Result</TableHead>
							<TableHead>Details</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{logs.content.length ? (
							logs.content.map((log) => {
								const resourcePath = RESOURCE_PATHS[log.resourceType];
								return (
									<TableRow key={log.id}>
										<TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
										<TableCell>
											{log.userId ? (
												<Link href={`/users/${log.userId}`} className="hover:underline">
													{log.username ?? log.userId}
												</Link>
											) : (
												<span className="text-muted-foreground">Anonymous</span>
											)}
											{log.ipAddress ? <p className="text-xs text-muted-foreground">{log.ipAddress}</p> : null}
										</TableCell>
										<TableCell>
											<Badge variant="outline" className="font-mono">
												{log.action}
											</Badge>
										</TableCell>
										<TableCell>
											<span className="text-muted-foreground">{log.resourceType}</span>
											{log.resourceId ? (
												<p className="font-mono text-xs">
													{resourcePath ? (
														<Link href={`${resourcePath}/${log.resourceId}`} className="hover:underline">
															{log.resourceId}
														</Link>
													) : (
														log.resourceId
													)}
												</p>
											) : null}
										</TableCell>
										<TableCell>
											{log.success ? (
												<Badge variant="secondary">Success</Badge>
											) : (
												<Badge variant="destructive">Failed</Badge>
											)}
										</TableCell>
										<TableCell className="max-w-xs whitespace-normal text-muted-foreground">
											{log.details ?? log.errorMessage ?? '—'}
										</TableCell>
									</TableRow>
								);
							})
						) : (
							<EmptyRow colSpan={6}>No entries match these filters.</EmptyRow>
						)}
					</TableBody>
				</Table>
			</div>
			<Pagination pathname="/audit-logs" params={filters} page={logs.page} limit={logs.limit} total={logs.total} />
		</main>
	);
}
