import type { Metadata } from 'next';

import { FilterInput, Filters } from '@/components/admin/Filters';
import { PageHeader } from '@/components/admin/PageHeader';
import { LookupForm } from '@/components/lookups/LookupForm';
import { LookupRow } from '@/components/lookups/LookupRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminFetch, withQuery } from '@/lib/api/admin';
import { readParam } from '@/lib/search-params';
import { Lookup } from '@/types';

export const metadata: Metadata = { title: 'Lookups' };

/** Groups items by type, keeping the API's order (type, then seq). */
function byType(items: Lookup[]) {
	const groups = new Map<string, Lookup[]>();
	for (const item of items) groups.set(item.lookupType, [...(groups.get(item.lookupType) ?? []), item]);
	return [...groups];
}

export default async function LookupsPage({ searchParams }: PageProps<'/lookups'>) {
	const params = await searchParams;
	const type = readParam(params, 'type');
	// Inactive items included, so they can be re-activated
	const items = await adminFetch<Lookup[]>(withQuery('/admin/lookups', { type }));
	const groups = byType(items);

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader title="Lookups" description="Dictionary items by type, inactive ones included." />
			<Filters pathname="/lookups">
				<FilterInput name="type" label="Type" placeholder="Every type" defaultValue={type} />
			</Filters>

			{groups.length ? (
				groups.map(([groupType, groupItems]) => (
					<section key={groupType} className="flex flex-col gap-2">
						<h2 className="font-mono text-sm font-medium">{groupType}</h2>
						<ul className="divide-y rounded-md border">
							{groupItems.map((item) => (
								<LookupRow key={item.id} lookup={item} />
							))}
						</ul>
					</section>
				))
			) : (
				<p className="text-sm text-muted-foreground">{type ? `No items of type ${type}.` : 'No items yet.'}</p>
			)}

			<Card>
				<CardHeader>
					<CardTitle>New item</CardTitle>
				</CardHeader>
				<CardContent>
					<LookupForm key={type} defaultType={type} />
				</CardContent>
			</Card>
		</main>
	);
}
