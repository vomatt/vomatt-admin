export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

/** `TagDto` in the API contract. */
export interface Tag {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	displayOrder: number;
	usageCount: number;
}

/** `CreateTagRequest` / `UpdateTagRequest`: update is a full replace. */
export interface TagInput {
	name: string;
	slug: string | null;
	description: string | null;
	displayOrder: number;
}

/** `LookupDto` in the API contract. */
export interface Lookup {
	id: string;
	lookupType: string;
	lookupKey: string;
	lookupValue: unknown;
	description: string | null;
	parentType: string | null;
	parentKey: string | null;
	seq: number;
	frontendUsing: boolean;
	isActive: boolean;
}

/** `CreateLookupRequest`; `UpdateLookupRequest` is the same with null meaning "keep". */
export type LookupInput = Omit<Lookup, 'id' | 'isActive'>;

/** `PageResponse*` in the API contract: an offset page, `page` is 1-based. */
export interface Page<T> {
	content: T[];
	total: number;
	page: number;
	limit: number;
}

/** `AdminStatsResponse`: live counts for the dashboard. */
export interface AdminStats {
	usersTotal: number;
	usersNewLast7Days: number;
	usersSuspended: number;
	pollsInProgress: number;
	pollsEnded: number;
	pollsDeleted: number;
	ballotsLast24Hours: number;
}

export const ROLES = ['user', 'moderator', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/** `AdminUserResponse`: a row of the user list. `active` is false when suspended. */
export interface AdminUser {
	id: string;
	username: string;
	displayName: string | null;
	email: string | null;
	phoneNumber: string | null;
	authMethod: string | null;
	roles: string[];
	active: boolean;
	lastLoginAt: string | null;
	createdAt: string;
}

/** `AdminUserDetail`: the list row plus points and activity counts. */
export interface AdminUserDetail extends AdminUser {
	points: number;
	membershipLevel: string;
	pollCount: number;
	ballotCount: number;
	commentCount: number;
}

export const AUDIENCES = ['PUBLIC', 'UNLISTED', 'INVITE_ONLY'] as const;
export type Audience = (typeof AUDIENCES)[number];

/** `VoteOptionResponse`: `votes` is null while the poll's results are sealed. */
export interface PollOption {
	id: string;
	text: string;
	description: string | null;
	displayOrder: number;
	votes: number | null;
}

/** The `VoteResponse` fields the admin views use. */
export interface Poll {
	id: string;
	title: string;
	description: string | null;
	creatorId: string;
	creatorUsername: string;
	startTime: string;
	endTime: string;
	deadline: string;
	createdAt: string;
	participantCount: number;
	commentCount: number;
	options: PollOption[];
	tags: Tag[];
	audience: Audience;
	voterVisibility: 'NOBODY' | 'OWNER' | 'SIGNED_IN';
	inviteeCount: number | null;
}

/** `AdminVoteResponse`: a poll with its deletion and owner state. */
export interface AdminPoll {
	vote: Poll;
	deletedAt: string | null;
	creatorEmail: string | null;
	creatorActive: boolean;
}

/** `AdminCommentResponse`: deleted comments keep their author and text. */
export interface AdminComment {
	id: string;
	voteId: string;
	voteTitle: string;
	parentId: string | null;
	userId: string;
	username: string;
	content: string;
	deleted: boolean;
	createdAt: string;
	updatedAt: string;
}

/** `AuditLogResponse`. `username` holds the actor's email at the time. */
export interface AuditLog {
	id: string;
	userId: string | null;
	username: string | null;
	action: string;
	resourceType: string;
	resourceId: string | null;
	ipAddress: string | null;
	userAgent: string | null;
	requestUri: string | null;
	httpMethod: string | null;
	success: boolean;
	errorMessage: string | null;
	details: string | null;
	createdAt: string;
}
