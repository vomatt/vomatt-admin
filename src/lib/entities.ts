export type EntityKind = 'user' | 'poll';

export const ENTITY_PATHS: Record<EntityKind, string> = { user: '/users', poll: '/polls' };

/** Audit log resource types that have a page here. */
export const AUDIT_RESOURCE_KINDS: Record<string, EntityKind> = { USER: 'user', VOTE: 'poll' };
