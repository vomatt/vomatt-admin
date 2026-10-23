import { adminFetch } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { type EntityKind } from '@/lib/entities';
import { AdminPoll, AdminUserDetail } from '@/types';

/** The response, or null when the ID matches nothing (400: not a UUID). */
async function orNull<T>(request: Promise<T>): Promise<T | null> {
	try {
		return await request;
	} catch (error) {
		if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 400)) return null;
		throw error;
	}
}

export function findUser(userId: string) {
	return orNull(adminFetch<AdminUserDetail>(`/admin/users/${encodeURIComponent(userId)}`));
}

export function findPoll(pollId: string) {
	return orNull(adminFetch<AdminPoll>(`/admin/votes/${encodeURIComponent(pollId)}`));
}

/** The record's display name, or null when the ID matches nothing (a filter can hold any text). */
export async function entityName(kind: EntityKind, id: string): Promise<string | null> {
	if (kind === 'user') return (await findUser(id))?.username ?? null;
	return (await findPoll(id))?.vote.title ?? null;
}
