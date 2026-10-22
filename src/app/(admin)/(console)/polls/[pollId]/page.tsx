import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { PageHeader } from '@/components/admin/PageHeader';
import { PollStatusBadge } from '@/components/admin/PollStatusBadge';
import { AUDIENCE_LABELS, VOTER_VISIBILITY_LABELS } from '@/components/polls/labels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { adminFetch } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { closePoll, deletePoll, restorePoll } from '@/lib/api/services/polls';
import { formatDateTime, pollStatus } from '@/lib/format';
import { AdminPoll } from '@/types';

export const metadata: Metadata = { title: 'Poll' };

type Detail = [term: string, value: React.ReactNode];

async function getPoll(pollId: string) {
	try {
		return await adminFetch<AdminPoll>(`/admin/votes/${encodeURIComponent(pollId)}`);
	} catch (error) {
		// 400: not a UUID
		if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 400)) notFound();
		throw error;
	}
}

export default async function PollPage({ params }: PageProps<'/polls/[pollId]'>) {
	const { pollId } = await params;
	const { vote: poll, deletedAt, creatorEmail, creatorActive } = await getPoll(pollId);
	const status = pollStatus(poll);
	const deleted = deletedAt !== null;
	// Same rule as the owner's Close; public and scheduled polls can only be deleted
	const closable = !deleted && status === 'open' && poll.audience !== 'PUBLIC';
	const sealed = poll.options.some((option) => option.votes === null);
	const endedEarly = Date.parse(poll.endTime) < Date.parse(poll.deadline);

	const details: Detail[] = [
		[
			'Creator',
			<span key="creator" className="flex flex-wrap items-center gap-2">
				<Link href={`/users/${poll.creatorId}`} className="hover:underline">
					{poll.creatorUsername}
				</Link>
				{creatorEmail ? <span className="text-muted-foreground">{creatorEmail}</span> : null}
				{creatorActive ? null : <Badge variant="destructive" dot>
						Suspended
					</Badge>}
			</span>,
		],
		['Audience', AUDIENCE_LABELS[poll.audience]],
		['Voters visible to', VOTER_VISIBILITY_LABELS[poll.voterVisibility]],
		['Starts', formatDateTime(poll.startTime)],
		['Ends', `${formatDateTime(poll.endTime)}${endedEarly ? ' (ended early)' : ''}`],
		['Deadline', formatDateTime(poll.deadline)],
		['Created', formatDateTime(poll.createdAt)],
		...(deleted ? [['Deleted', formatDateTime(deletedAt)] satisfies Detail] : []),
		[
			'Turnout',
			poll.inviteeCount === null
				? `${poll.participantCount} participant${poll.participantCount === 1 ? '' : 's'}`
				: `${poll.participantCount} of ${poll.inviteeCount} invitees`,
		],
		...(poll.tags.length
			? [
					[
						'Tags',
						<span key="tags" className="flex flex-wrap gap-1">
							{poll.tags.map((tag) => (
								<Badge key={tag.id} variant="secondary">
									{tag.name}
								</Badge>
							))}
						</span>,
					] satisfies Detail,
				]
			: []),
		['Poll ID', <span key="id" className="font-mono text-xs">{poll.id}</span>],
	];

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader
				title={
					<span className="flex flex-wrap items-center gap-3">
						{poll.title} <PollStatusBadge status={status} deleted={deleted} />
					</span>
				}
				description={poll.description}
			>
				<Button variant="outline" size="sm" asChild>
					<Link href={`/comments?voteId=${poll.id}`}>Comments ({poll.commentCount})</Link>
				</Button>
				<Button variant="outline" size="sm" asChild>
					<Link href={`/audit-logs?resourceId=${poll.id}`}>Audit log</Link>
				</Button>
				{closable ? (
					<ConfirmAction
						action={closePoll.bind(null, poll.id)}
						label="Close now"
						title="Close this poll now?"
						description="It ends now and keeps its deadline. Participants are notified and the results unseal."
					/>
				) : null}
				{deleted ? (
					<ConfirmAction
						action={restorePoll.bind(null, poll.id)}
						label="Restore"
						title="Restore this poll?"
						description="It becomes visible again with the status its times give."
					/>
				) : (
					<ConfirmAction
						action={deletePoll.bind(null, poll.id)}
						label="Delete"
						title="Delete this poll?"
						description="It's hidden from everyone, owner included, and nobody is notified. You can restore it later."
						destructive
					/>
				)}
			</PageHeader>

			<div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
				<Card>
					<CardHeader>
						<CardTitle>Options</CardTitle>
						<CardDescription>
							{sealed
								? 'Results are sealed until the poll ends.'
								: `${poll.participantCount} participant${poll.participantCount === 1 ? '' : 's'}`}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ol className="flex flex-col gap-4">
							{poll.options.map((option) => {
								const share =
									option.votes === null
										? null
										: poll.participantCount > 0
											? (option.votes / poll.participantCount) * 100
											: 0;
								return (
									<li key={option.id} className="flex flex-col gap-1.5">
										<div className="flex items-baseline justify-between gap-4 text-sm">
											<span className="font-medium">{option.text}</span>
											{option.votes !== null && share !== null ? (
												<span className="shrink-0 text-muted-foreground tabular-nums">
													{option.votes} vote{option.votes === 1 ? '' : 's'}{' '}
													<span className="font-medium text-foreground">{Math.round(share)}%</span>
												</span>
											) : null}
										</div>
										{option.description ? (
											<p className="text-sm text-muted-foreground">{option.description}</p>
										) : null}
										{share !== null ? (
											<Progress value={share} className="h-1.5" aria-label={`${option.text} share`} />
										) : null}
									</li>
								);
							})}
						</ol>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Details</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm">
							{details.map(([term, value]) => (
								<div key={term} className="contents">
									<dt className="text-muted-foreground">{term}</dt>
									<dd className="wrap-anywhere">{value}</dd>
								</div>
							))}
						</dl>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
