import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RolesForm } from '@/components/users/RolesForm';
import { SuspendDialog } from '@/components/users/SuspendDialog';
import { RoleBadges, UserStatusBadge } from '@/components/users/UserBadges';
import { adminFetch } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { unsuspendUser } from '@/lib/api/services/users';
import { formatDateTime } from '@/lib/format';
import { AdminUserDetail } from '@/types';

export const metadata: Metadata = { title: 'User' };

async function getUser(userId: string) {
	try {
		return await adminFetch<AdminUserDetail>(`/admin/users/${encodeURIComponent(userId)}`);
	} catch (error) {
		// 400: not a UUID
		if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 400)) notFound();
		throw error;
	}
}

export default async function UserPage({ params }: PageProps<'/users/[userId]'>) {
	const { userId } = await params;
	const user = await getUser(userId);

	const details: [string, React.ReactNode][] = [
		['Display name', user.displayName ?? '—'],
		['Email', user.email ?? '—'],
		['Phone', user.phoneNumber ?? '—'],
		['Sign-in method', user.authMethod ?? '—'],
		['Membership', user.membershipLevel],
		['Points', user.points],
		['Joined', formatDateTime(user.createdAt)],
		['Last sign-in', formatDateTime(user.lastLoginAt)],
		['User ID', <span key="id" className="font-mono text-xs">{user.id}</span>],
	];
	const activity = [
		{ label: 'Polls created', count: user.pollCount, href: `/polls?creatorId=${user.id}` },
		{ label: 'Comments written', count: user.commentCount, href: `/comments?userId=${user.id}` },
		{ label: 'Ballots held', count: user.ballotCount },
	];

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader
				title={
					<span className="flex items-center gap-3">
						{user.username} <UserStatusBadge active={user.active} />
					</span>
				}
				description={<RoleBadges roles={user.roles} />}
			>
				<Button variant="outline" size="sm" asChild>
					<Link href={`/audit-logs?resourceId=${user.id}`}>Audit log</Link>
				</Button>
				{user.active ? (
					<SuspendDialog userId={user.id} username={user.username} />
				) : (
					<ConfirmAction
						action={unsuspendUser.bind(null, user.id)}
						label="Unsuspend"
						title={`Unsuspend ${user.username}?`}
						description="They can sign in again. Sessions revoked by the suspension stay signed out."
					/>
				)}
			</PageHeader>

			<div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
				<Card>
					<CardHeader>
						<CardTitle>Account</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
							{details.map(([term, value]) => (
								<div key={term} className="contents">
									<dt className="text-muted-foreground">{term}</dt>
									<dd className="wrap-anywhere">{value}</dd>
								</div>
							))}
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Activity</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="flex flex-col gap-3 text-sm">
							{activity.map(({ label, count, href }) => (
								<li key={label} className="flex items-center justify-between gap-4">
									{href ? (
										<Link href={href} className="hover:underline">
											{label}
										</Link>
									) : (
										<span>{label}</span>
									)}
									<span className="font-medium tabular-nums">{count}</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Roles</CardTitle>
					<CardDescription>
						A change signs the user out; new roles apply at their next sign-in. A removed admin role stops working
						at once.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<RolesForm userId={user.id} roles={user.roles} />
				</CardContent>
			</Card>
		</main>
	);
}
