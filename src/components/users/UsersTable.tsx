'use client';

import {
	columnResizingFeature,
	columnSizingFeature,
	type ColumnSizingState,
	createColumnHelper,
	tableFeatures,
	type Updater,
	useTable,
} from '@tanstack/react-table';
import { cn } from 'cn';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { EmptyRow } from '@/components/admin/EmptyRow';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { RoleBadges, UserStatusBadge } from '@/components/users/UserBadges';
import { authMethodLabel, formatDateTime } from '@/lib/format';
import { AdminUser } from '@/types';

const WIDTHS_KEY = 'vomatt-admin:users-table:widths';

const features = tableFeatures({ columnSizingFeature, columnResizingFeature });
const column = createColumnHelper<typeof features, AdminUser>();
const columns = column.columns([
	column.display({
		id: 'user',
		header: 'User',
		size: 200,
		cell: ({ row: { original: user } }) => (
			<>
				<Link
					href={`/users/${user.id}`}
					className="font-medium hover:underline"
				>
					{user.username}
				</Link>
				{user.displayName ? (
					<p className="truncate text-xs text-muted-foreground">
						{user.displayName}
					</p>
				) : null}
			</>
		),
	}),
	column.display({
		id: 'contact',
		header: 'Contact',
		size: 200,
		cell: ({ row: { original: user } }) => (
			<span className="text-muted-foreground">
				{user.email ?? user.phoneNumber ?? '—'}
			</span>
		),
	}),
	column.accessor('authMethod', {
		header: 'Sign-in',
		size: 110,
		cell: ({ getValue }) => (
			<span className="text-muted-foreground">
				{authMethodLabel(getValue())}
			</span>
		),
	}),
	column.accessor('plan', {
		header: 'Plan',
		size: 80,
		cell: ({ getValue }) => (
			<span className="text-muted-foreground">{getValue() ?? '—'}</span>
		),
	}),
	column.accessor('roles', {
		header: 'Roles',
		size: 150,
		cell: ({ getValue }) => <RoleBadges roles={getValue()} />,
	}),
	column.accessor('active', {
		header: 'Status',
		size: 120,
		cell: ({ getValue }) => <UserStatusBadge active={getValue()} />,
	}),
	column.accessor('lastLoginAt', {
		header: 'Last sign-in',
		size: 180,
		cell: ({ getValue }) => (
			<span className="text-muted-foreground">
				{formatDateTime(getValue())}
			</span>
		),
	}),
	column.accessor('createdAt', {
		header: 'Joined',
		size: 180,
		cell: ({ getValue }) => (
			<span className="text-muted-foreground">
				{formatDateTime(getValue())}
			</span>
		),
	}),
]);

// Widths are kept here, saved to localStorage when it is available, and read through useSyncExternalStore
// so the server render (no widths) hydrates cleanly
const NO_WIDTHS: ColumnSizingState = {};
const listeners = new Set<() => void>();
let widths: ColumnSizingState | undefined;

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function readWidths() {
	if (widths === undefined) {
		widths = NO_WIDTHS;
		try {
			const saved: unknown = JSON.parse(
				localStorage.getItem(WIDTHS_KEY) ?? '{}'
			);
			if (saved && typeof saved === 'object' && !Array.isArray(saved))
				widths = saved as ColumnSizingState;
		} catch {}
	}
	return widths;
}

function writeWidths(update: Updater<ColumnSizingState>) {
	widths = typeof update === 'function' ? update(readWidths()) : update;
	try {
		localStorage.setItem(WIDTHS_KEY, JSON.stringify(widths));
	} catch {}
	listeners.forEach((listener) => listener());
}

const KEY_STEP = 16;

/** The users list; drag a header's right edge to resize, double-click it to reset. Widths stay in this browser. */
export function UsersTable({ users }: { users: AdminUser[] }) {
	const columnSizing = useSyncExternalStore(
		subscribe,
		readWidths,
		() => NO_WIDTHS
	);
	const table = useTable({
		features,
		columns,
		data: users,
		columnResizeMode: 'onChange',
		state: { columnSizing },
		onColumnSizingChange: writeWidths,
	});

	return (
		<div className="rounded-md border">
			<Table className="table-fixed" style={{ width: table.getTotalSize() }}>
				<TableHeader>
					{table.getHeaderGroups().map((group) => (
						<TableRow key={group.id}>
							{group.headers.map((header) => (
								<TableHead
									key={header.id}
									className="relative"
									style={{ width: header.getSize() }}
								>
									<table.FlexRender header={header} />
									<div
										role="separator"
										aria-orientation="vertical"
										aria-label={`Resize ${header.column.id} column`}
										aria-valuenow={header.getSize()}
										tabIndex={0}
										onKeyDown={(event) => {
											const step =
												event.key === 'ArrowRight'
													? KEY_STEP
													: event.key === 'ArrowLeft'
														? -KEY_STEP
														: 0;
											if (!step) return;
											event.preventDefault();
											table.setColumnSizing((sizes) => ({
												...sizes,
												[header.column.id]: header.getSize() + step,
											}));
										}}
										onMouseDown={header.getResizeHandler()}
										onTouchStart={header.getResizeHandler()}
										onDoubleClick={() => header.column.resetSize()}
										className={cn(
											'absolute top-0 right-0 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-border focus-visible:bg-primary focus-visible:outline-none',
											header.column.getIsResizing() && 'bg-primary'
										)}
									/>
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{users.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getAllCells().map((cell) => (
									<TableCell key={cell.id} className="truncate">
										<table.FlexRender cell={cell} />
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<EmptyRow colSpan={columns.length}>
							No users match these filters.
						</EmptyRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
