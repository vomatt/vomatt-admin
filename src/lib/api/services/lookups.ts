'use server';

import { adminMutation } from '@/lib/api/admin';
import { Lookup, LookupInput } from '@/types';

// Auth: apiClient sends the caller's own token, and vomatt-api checks the
// admin role on every /api/admin/** request.

function itemPath(id: string, action = '') {
	return `/admin/lookups/${encodeURIComponent(id)}${action}`;
}

export async function createLookup(input: LookupInput) {
	return adminMutation<Lookup>('/admin/lookups', { method: 'POST', body: input });
}

/** Partial update: null fields keep their current value and can't be cleared. */
export async function updateLookup(id: string, input: LookupInput) {
	return adminMutation<Lookup>(itemPath(id), { method: 'PUT', body: input });
}

export async function setLookupActive(id: string, active: boolean) {
	return adminMutation<void>(itemPath(id, active ? '/activate' : '/deactivate'), {
		method: 'PATCH',
	});
}

export async function deleteLookup(id: string) {
	return adminMutation<void>(itemPath(id), { method: 'DELETE' });
}
