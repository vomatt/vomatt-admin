import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyRow } from '@/components/admin/EmptyRow';
import { FilterInput, Filters, FilterSelect } from '@/components/admin/Filters';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleBadges, UserStatusBadge } from '@/components/users/UserBadges';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { formatDateTime } from '@/lib/format';
import { readPage, readParam } from '@/lib/search-params';
import { AdminUser, Page } from '@/types';

export const metadata: Metadata = { title: 'Users' };

export default async function UsersPage({ searchParams }: PageProps<'/users'>) {
	const params = await searchParams;
	const filters = { q: readParam(params, 'q'), status: readParam(params, 'status'), role: readParam(params, 'role') };
	const users = await adminFetch<Page<AdminUser>>(withQuery('/admin/users', { ...filters, page: readPage(params) }));

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader title="Users" description="Every account, suspended ones included, newest first." />
			<Filters pathname="/users">
				<FilterInput
					name="q"
					label="Search"
					placeholder="Username, email, phone, name"
					defaultValue={filters.q}
					className="w-64"
				/>
				<FilterSelect
					name="status"
					label="Status"
					defaultValue={filters.status}
					options={{ active: 'Active', suspended: 'Suspended' }}
				/>
				<FilterSelect
					name="role"
					label="Role"
					defaultValue={filters.role}
					options={{ user: 'User', moderator: 'Moderator', admin: 'Admin' }}
				/>
			</Filters>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Contact</TableHead>
							<TableHead>Roles</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Last sign-in</TableHead>
							<TableHead>Joined</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.content.length ? (
							users.content.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<Link href={`/users/${user.id}`} className="font-medium hover:underline">
											{user.username}
										</Link>
										{user.displayName ? (
											<p className="text-xs text-muted-foreground">{user.displayName}</p>
										) : null}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{user.email ?? user.phoneNumber ?? '—'}
									</TableCell>
									<TableCell>
										<RoleBadges roles={user.roles} />
									</TableCell>
									<TableCell>
										<UserStatusBadge active={user.active} />
									</TableCell>
									<TableCell className="text-muted-foreground">{formatDateTime(user.lastLoginAt)}</TableCell>
									<TableCell className="text-muted-foreground">{formatDateTime(user.createdAt)}</TableCell>
								</TableRow>
							))
						) : (
							<EmptyRow colSpan={6}>No users match these filters.</EmptyRow>
						)}
					</TableBody>
				</Table>
			</div>
			<Pagination pathname="/users" params={filters} page={users.page} limit={users.limit} total={users.total} />
		</main>
	);
}
