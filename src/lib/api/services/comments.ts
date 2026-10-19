'use server';

import { adminMutation } from '@/lib/api/admin';

// Auth: apiClient sends the caller's own token, and vomatt-api checks the
// admin role on every /api/admin/** request.

/** Soft delete, like the author's own: the text leaves the public lists. */
export async function deleteComment(commentId: string) {
	return adminMutation<void>(`/admin/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
}
