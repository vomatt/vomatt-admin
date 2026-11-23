import { Poll } from '@/types';

// Staff work in Taiwan; a fixed zone keeps server-rendered times stable
const dateTime = new Intl.DateTimeFormat('en-GB', {
	dateStyle: 'medium',
	timeStyle: 'short',
	timeZone: 'Asia/Taipei',
});

export function formatDateTime(iso: string | null) {
	return iso ? dateTime.format(new Date(iso)) : '—';
}

/** `authMethod` values, as the API lists them, with their labels. */
export const AUTH_METHODS: Record<string, string> = {
	email_otp: 'Email code',
	phone_otp: 'Phone code',
	google: 'Google',
	line: 'LINE',
	apple: 'Apple',
};

export function authMethodLabel(method: string | null) {
	return method ? (AUTH_METHODS[method] ?? method) : '—';
}

export type PollStatus = 'scheduled' | 'open' | 'ended';

/** The API derives status from the times the same way. */
export function pollStatus(poll: Pick<Poll, 'startTime' | 'endTime'>, now = Date.now()): PollStatus {
	if (now < Date.parse(poll.startTime)) return 'scheduled';
	if (now < Date.parse(poll.endTime)) return 'open';
	return 'ended';
}
