import type { Metadata } from 'next';

import { FilterInput, Filters, FilterSelect } from '@/components/admin/Filters';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { CommunityForm } from '@/components/users/CommunityForm';
import { UsersTable } from '@/components/users/UsersTable';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { AUTH_METHODS } from '@/lib/format';
import { readPage, readParam, readSelectParam } from '@/lib/search-params';
import { AdminUser, Page } from '@/types';

export const metadata: Metadata = { title: 'Users' };

const EMAIL_DOMAINS = [
	'vomatt.test',
	'gmail.com',
	'yahoo.com.tw',
	'yahoo.com',
	'outlook.com',
	'hotmail.com',
	'icloud.com',
];

const INACTIVE_DAYS = {
	30: 'No sign-in in 30 days',
	90: 'No sign-in in 90 days',
	180: 'No sign-in in 180 days',
	365: 'No sign-in in a year',
};

const PLANS = { FREE: 'Free', PRO: 'Pro' };

/** A select's value from the URL, or '' when it is not one of `options` (an old or hand-edited link the API would reject). */
function option(value: string, options: Record<string, string>) {
	return Object.hasOwn(options, value) ? value : '';
}

/** Midnight Taipei time of a `<input type="date">` day, `addDays` later; '' stays unset. */
function taipeiMidnight(day: string, addDays = 0) {
	const date = new Date(`${day}T00:00:00Z`);
	// A bad date in a hand-edited link is ignored rather than crashing the page
	if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(date.getTime()))
		return undefined;
	date.setUTCDate(date.getUTCDate() + addDays);
	return `${date.toISOString().slice(0, 10)}T00:00:00+08:00`;
}

export default async function UsersPage({ searchParams }: PageProps<'/users'>) {
	const params = await searchParams;
	const filters = {
		q: readParam(params, 'q'),
		emailDomain: readParam(params, 'emailDomain'),
		status: readSelectParam(params, 'status'),
		role: readSelectParam(params, 'role'),
		authMethod: option(readSelectParam(params, 'authMethod'), AUTH_METHODS),
		plan: option(readSelectParam(params, 'plan'), PLANS),
		inactiveDays: option(
			readSelectParam(params, 'inactiveDays'),
			INACTIVE_DAYS
		),
		joinedFrom: readParam(params, 'joinedFrom'),
		joinedTo: readParam(params, 'joinedTo'),
	};
	const users = await adminFetch<Page<AdminUser>>(
		withQuery('/admin/users', {
			...filters,
			joinedFrom: taipeiMidnight(filters.joinedFrom),
			// The field is the last day to include; the API's end is exclusive
			joinedTo: taipeiMidnight(filters.joinedTo, 1),
			page: readPage(params),
		})
	);

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader
				title="Users"
				description="Every account, suspended ones included, newest first."
			/>
			<Card>
				<CardHeader>
					<CardTitle>New community account</CardTitle>
					<CardDescription>
						A group page that members publish as. The owner must be an active
						user who is not a community account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<CommunityForm />
				</CardContent>
			</Card>
			<Filters pathname="/users">
				<FilterInput
					name="q"
					label="Search"
					placeholder="Username, email, phone, name"
					defaultValue={filters.q}
					className="w-64"
				/>
				<FilterInput
					name="emailDomain"
					label="Email domain"
					placeholder="Any"
					list="email-domains"
					defaultValue={filters.emailDomain}
				/>
				<datalist id="email-domains">
					{EMAIL_DOMAINS.map((domain) => (
						<option key={domain} value={domain} />
					))}
				</datalist>
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
				<FilterSelect
					name="authMethod"
					label="Sign-in"
					defaultValue={filters.authMethod}
					options={AUTH_METHODS}
				/>
				<FilterSelect
					name="plan"
					label="Plan"
					defaultValue={filters.plan}
					options={PLANS}
				/>
				<FilterSelect
					name="inactiveDays"
					label="Last sign-in"
					defaultValue={filters.inactiveDays}
					options={INACTIVE_DAYS}
				/>
				<FilterInput
					name="joinedFrom"
					label="Joined from"
					type="date"
					defaultValue={filters.joinedFrom}
					className="w-40"
				/>
				<FilterInput
					name="joinedTo"
					label="Joined until"
					type="date"
					defaultValue={filters.joinedTo}
					className="w-40"
				/>
			</Filters>

			<UsersTable users={users.content} />
			<Pagination
				pathname="/users"
				params={filters}
				page={users.page}
				limit={users.limit}
				total={users.total}
			/>
		</main>
	);
}
