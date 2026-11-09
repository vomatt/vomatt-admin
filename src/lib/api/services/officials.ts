'use server';

import { adminMutation } from '@/lib/api/admin';
import { OfficialAccount, OfficialInput } from '@/types';

// Auth: apiClient sends the caller's own token, and vomatt-api checks the
// admin role on every /api/admin/** request.

/** Creates a group's page and makes `ownerUserId` its first OWNER. */
export async function createOfficial(input: OfficialInput) {
	return adminMutation<OfficialAccount>('/admin/officials', { method: 'POST', body: input });
}
