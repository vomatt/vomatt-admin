import { Audience, Poll } from '@/types';

export const AUDIENCE_LABELS: Record<Audience, string> = {
	PUBLIC: 'Public',
	UNLISTED: 'Unlisted',
	INVITE_ONLY: 'Invite only',
};

export const VOTER_VISIBILITY_LABELS: Record<Poll['voterVisibility'], string> = {
	NOBODY: 'Nobody',
	OWNER: 'Owner',
	SIGNED_IN: 'Anyone signed in',
};
