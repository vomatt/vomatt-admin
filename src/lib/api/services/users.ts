'use server';

import { adminMutation } from '@/lib/api/admin';
import { AdminUserDetail, Plan, PLANS, Role } from '@/types';

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

/**
 * Puts the account on a plan. An upgrade unlocks its locked community
 * accounts up to the new limit; a downgrade over the limit starts a 7-day
 * selection for the user. The same plan changes nothing.
 */
export async function changeUserPlan(userId: string, plan: Plan) {
	if (!PLANS.includes(plan)) return { ok: false as const, status: 400, message: 'Unknown plan.' };
	return adminMutation<AdminUserDetail>(userPath(userId, '/plan'), { method: 'PATCH', body: { plan } });
}

/** The reason (up to 500 characters) goes to the audit log only. */
export async function suspendUser(userId: string, reason: string | null) {
	return adminMutation<AdminUserDetail>(userPath(userId, '/suspend'), {
		method: 'PATCH',
		body: { reason },
	});
}

/**
 * Clears OTP sign-in lockouts (not a suspension). Empty `channels` / `clear`
 * mean all; `ip` limits it to one client IP.
 */
export async function unlockUserLogin(
	userId: string,
	scope: { channels: string[]; clear: string[]; ip: string | null }
) {
	return adminMutation<{ clearedEntries: number }>(userPath(userId, '/unlock-login'), {
		method: 'POST',
		body: scope,
	});
}

export async function unsuspendUser(userId: string) {
	return adminMutation<AdminUserDetail>(userPath(userId, '/unsuspend'), { method: 'PATCH' });
}
