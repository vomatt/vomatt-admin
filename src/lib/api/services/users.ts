'use server';

import { adminMutation } from '@/lib/api/admin';
import { AdminUserDetail, Role } from '@/types';

// Auth: apiClient sends the caller's own token, and vomatt-api checks the
// admin role on every /api/admin/** request.

function userPath(userId: string, action = '') {
	return `/admin/users/${encodeURIComponent(userId)}${action}`;
}

/**
 * Replaces the roles. Fails with `admin.self_action_forbidden` when dropping
 * your own admin role and `admin.last_admin` for the only active admin.
 */
export async function setUserRoles(userId: string, roles: Role[]) {
	return adminMutation<AdminUserDetail>(userPath(userId, '/roles'), { method: 'PUT', body: { roles } });
}

/** The reason (up to 500 characters) goes to the audit log only. */
export async function suspendUser(userId: string, reason: string | null) {
	return adminMutation<AdminUserDetail>(userPath(userId, '/suspend'), {
		method: 'PATCH',
		body: { reason },
	});
}

export async function unsuspendUser(userId: string) {
	return adminMutation<AdminUserDetail>(userPath(userId, '/unsuspend'), { method: 'PATCH' });
}
