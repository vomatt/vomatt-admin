import { adminFetch } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { type EntityKind } from '@/lib/entities';
import { AdminPoll, AdminUserDetail } from '@/types';

/** The record's display name, or null when the ID matches nothing (a filter can hold any text). */
export async function entityName(kind: EntityKind, id: string): Promise<string | null> {
	try {
		if (kind === 'user') return (await adminFetch<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`)).username;
		return (await adminFetch<AdminPoll>(`/admin/votes/${encodeURIComponent(id)}`)).vote.title;
	} catch (error) {
		// 400: not a UUID
		if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 400)) return null;
		throw error;
	}
}
