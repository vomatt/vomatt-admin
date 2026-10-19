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

export type PollStatus = 'scheduled' | 'open' | 'ended';

/** The API derives status from the times the same way. */
export function pollStatus(poll: Pick<Poll, 'startTime' | 'endTime'>, now = Date.now()): PollStatus {
	if (now < Date.parse(poll.startTime)) return 'scheduled';
	if (now < Date.parse(poll.endTime)) return 'open';
	return 'ended';
}
