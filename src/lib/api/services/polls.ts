'use server';

import { adminMutation } from '@/lib/api/admin';
import { AdminPoll } from '@/types';

// Auth: apiClient sends the caller's own token, and vomatt-api checks the
// admin role on every /api/admin/** request. The API calls polls "votes".

function pollPath(pollId: string, action = '') {
	return `/admin/votes/${encodeURIComponent(pollId)}${action}`;
}

/** Ends an open UNLISTED or INVITE_ONLY poll now; public and scheduled ones can only be deleted. */
export async function closePoll(pollId: string) {
	return adminMutation<AdminPoll>(pollPath(pollId, '/close'), { method: 'PUT' });
}

/** Soft delete: hidden from everyone, owner included, until restored. */
export async function deletePoll(pollId: string) {
	return adminMutation<void>(pollPath(pollId), { method: 'DELETE' });
}

export async function restorePoll(pollId: string) {
	return adminMutation<AdminPoll>(pollPath(pollId, '/restore'), { method: 'PATCH' });
}
