import type { Metadata } from 'next';

import { EmptyRow } from '@/components/admin/EmptyRow';
import { EntityLink } from '@/components/admin/EntityLink';
import { FilterChip } from '@/components/admin/FilterChip';
import { FilterInput, Filters, FilterSelect } from '@/components/admin/Filters';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { AUDIT_RESOURCE_KINDS } from '@/lib/entities';
import { entityName, findUser } from '@/lib/entity-name';
import { formatDateTime } from '@/lib/format';
import { readPage, readParam } from '@/lib/search-params';
import { AuditLog, Page } from '@/types';

export const metadata: Metadata = { title: 'Audit log' };

// The values vomatt-api's @Auditable annotations record; the API doesn't publish the set
const ACTIONS = [
	'ADD_MEMBERS', 'BLOCK', 'CREATE', 'DEACTIVATE', 'DELETE', 'FORCE_CLOSE', 'FORCE_DELETE', 'INVITE', 'LIKE',
	'REMOVE_MEMBER', 'RESTORE', 'RETRACT', 'SUSPEND', 'UNBLOCK', 'UNINVITE', 'UNLIKE', 'UNLOCK_LOGIN', 'UNSUSPEND',
	'UPDATE', 'UPDATE_ROLES', 'VIEW', 'VOTE',
];
const RESOURCE_TYPES: Record<string, string> = { USER: 'User', VOTE: 'Poll', COMMENT: 'Comment', COMMENT_REPORT: 'Comment report', GROUP: 'Group', FEEDBACK: 'Feedback' };

function actionLabel(action: string) {
	return action.charAt(0) + action.slice(1).toLowerCase().replaceAll('_', ' ');
}

const ACTION_OPTIONS = Object.fromEntries(ACTIONS.map((action) => [action, actionLabel(action)]));

/** Keeps a value missing from the list (an action the API added since, an old link) selectable, so a submit keeps it. */
function withCurrent(options: Record<string, string>, current: string, label: (value: string) => string) {
	return current && !(current in options) ? { ...options, [current]: label(current) } : options;
}

/** `<input type="datetime-local">` gives a Taipei wall time without an offset. */
function toInstant(local: string) {
	return local ? `${local}:00+08:00` : undefined;
}

/** The actor as the rows name them (their username), so the chip matches the Actor column. */
async function actorLabel(userId: string, firstRow: AuditLog | undefined) {
	if (firstRow?.username) return firstRow.username;
	const user = await findUser(userId);
	return user?.username ?? null;
}

export default async function AuditLogsPage({ searchParams }: PageProps<'/audit-logs'>) {
	const params = await searchParams;
	const filters = {
		userId: readParam(params, 'userId'),
		action: readParam(params, 'action').toUpperCase(),
		resourceType: readParam(params, 'resourceType').toUpperCase(),
		resourceId: readParam(params, 'resourceId'),
		from: readParam(params, 'from'),
		to: readParam(params, 'to'),
	};
	const logs = await adminFetch<Page<AuditLog>>(
		withQuery('/admin/audit-logs', {
			...filters,
			from: toInstant(filters.from),
			to: toInstant(filters.to),
			page: readPage(params),
		})
	);
	// A resourceId filter carries no type; the rows it matched do
	const resourceKind = AUDIT_RESOURCE_KINDS[filters.resourceType || (logs.content[0]?.resourceType ?? '')];
	const [actorName, resourceName] = await Promise.all([
		filters.userId ? actorLabel(filters.userId, logs.content[0]) : null,
		filters.resourceId && resourceKind ? entityName(resourceKind, filters.resourceId) : null,
	]);

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader
				title="Audit log"
				description="Newest first. Entries are written asynchronously and may appear a moment late. Times are Taipei time."
			/>
			<Filters pathname="/audit-logs">
				<FilterSelect
					name="action"
					label="Action"
					defaultValue={filters.action}
					options={withCurrent(ACTION_OPTIONS, filters.action, actionLabel)}
				/>
				<FilterSelect
					name="resourceType"
					label="Resource type"
					defaultValue={filters.resourceType}
					options={withCurrent(RESOURCE_TYPES, filters.resourceType, (type) => type)}
				/>
				{filters.resourceId && resourceKind ? (
					<input type="hidden" name="resourceId" value={filters.resourceId} />
				) : (
					<FilterInput name="resourceId" label="Resource ID" defaultValue={filters.resourceId} className="w-72 font-mono" />
				)}
				{filters.userId ? (
					<input type="hidden" name="userId" value={filters.userId} />
				) : (
					<FilterInput name="userId" label="Actor ID" defaultValue="" className="w-72 font-mono" />
				)}
				<FilterInput name="from" label="From" type="datetime-local" defaultValue={filters.from} className="w-52" />
				<FilterInput name="to" label="Until" type="datetime-local" defaultValue={filters.to} className="w-52" />
			</Filters>
			{filters.userId || (filters.resourceId && resourceKind) ? (
				<div className="flex flex-wrap gap-2">
					{filters.resourceId && resourceKind ? (
						<FilterChip
							label="Resource"
							kind={resourceKind}
							id={filters.resourceId}
							name={resourceName}
							pathname="/audit-logs"
							params={filters}
							param="resourceId"
						/>
					) : null}
					{filters.userId ? (
						<FilterChip
							label="Actor"
							kind="user"
							id={filters.userId}
							name={actorName}
							pathname="/audit-logs"
							params={filters}
							param="userId"
						/>
					) : null}
				</div>
			) : null}

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
								const kind = AUDIT_RESOURCE_KINDS[log.resourceType];
								return (
									<TableRow key={log.id}>
										<TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
										<TableCell>
											{log.userId ? (
												<EntityLink kind="user" id={log.userId}>
													{log.username ?? log.userId}
												</EntityLink>
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
											<span className="text-muted-foreground">
												{RESOURCE_TYPES[log.resourceType] ?? log.resourceType}
											</span>
											{log.resourceId ? (
												<p className="font-mono text-xs">
													{kind ? (
														<EntityLink kind={kind} id={log.resourceId}>
															{log.resourceId}
														</EntityLink>
													) : (
														log.resourceId
													)}
												</p>
											) : null}
										</TableCell>
										<TableCell>
											{log.success ? (
												<Badge variant="outline" dot className="before:bg-tone-success">
													Success
												</Badge>
											) : (
												<Badge variant="destructive" dot>
													Failed
												</Badge>
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
