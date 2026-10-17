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
