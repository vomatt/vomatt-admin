import { Badge } from '@/components/ui/badge';
import { PollStatus } from '@/lib/format';

const LABELS: Record<PollStatus, string> = { scheduled: 'Scheduled', open: 'Open', ended: 'Ended' };
// Same hues as the public site's status tints, at a chroma staff can tell apart
const VARIANTS = { scheduled: 'info', open: 'success', ended: 'neutral' } as const satisfies Record<PollStatus, string>;

/** Deleted wins over the time-derived status. */
export function PollStatusBadge({ status, deleted }: { status: PollStatus; deleted: boolean }) {
	if (deleted)
		return (
			<Badge variant="destructive" dot>
				Deleted
			</Badge>
		);
	return (
		<Badge variant={VARIANTS[status]} dot>
			{LABELS[status]}
		</Badge>
	);
}
