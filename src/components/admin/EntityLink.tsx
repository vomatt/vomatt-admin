import { RiSurveyLine, RiUserLine } from '@remixicon/react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ENTITY_PATHS, type EntityKind } from '@/lib/entities';

const ICONS = { user: RiUserLine, poll: RiSurveyLine } satisfies Record<EntityKind, unknown>;

/** A link to another record, marked with its kind's icon so relations read across tables. */
export function EntityLink({ kind, id, children }: { kind: EntityKind; id: string; children: ReactNode }) {
	const Icon = ICONS[kind];
	return (
		<Link href={`${ENTITY_PATHS[kind]}/${id}`} className="text-link hover:underline">
			<Icon aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />
			{children}
		</Link>
	);
}
