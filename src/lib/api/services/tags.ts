'use server';

import { adminMutation } from '@/lib/api/admin';
import { Tag, TagInput } from '@/types';

// Auth: apiClient sends the caller's own token, and vomatt-api checks the
// admin role on every /api/admin/** request.

export async function createTag(input: TagInput) {
	return adminMutation<Tag>('/admin/tags', { method: 'POST', body: input });
}

/** Full replace: an empty slug is regenerated from the name. */
export async function updateTag(tagId: string, input: TagInput) {
	return adminMutation<Tag>(`/admin/tags/${encodeURIComponent(tagId)}`, {
		method: 'PUT',
		body: input,
	});
}

/** Fails with `tag.in_use` while a poll still uses the tag. */
export async function deleteTag(tagId: string) {
	return adminMutation<void>(`/admin/tags/${encodeURIComponent(tagId)}`, { method: 'DELETE' });
}
