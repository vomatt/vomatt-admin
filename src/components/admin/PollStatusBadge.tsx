import { Badge } from '@/components/ui/badge';
import { PollStatus } from '@/lib/format';

const LABELS: Record<PollStatus, string> = { scheduled: 'Scheduled', open: 'Open', ended: 'Ended' };
// The public site's status tints, so staff see the colours users do
const COLORS: Record<PollStatus, string> = {
	scheduled: 'bg-status-scheduled',
	open: 'bg-status-open',
	ended: 'bg-status-ended',
};

/** Deleted wins over the time-derived status. */
export function PollStatusBadge({ status, deleted }: { status: PollStatus; deleted: boolean }) {
	if (deleted) return <Badge variant="destructive">Deleted</Badge>;
	return <Badge className={`text-foreground ${COLORS[status]}`}>{LABELS[status]}</Badge>;
}
