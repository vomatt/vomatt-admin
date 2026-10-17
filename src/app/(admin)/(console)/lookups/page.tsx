import type { Metadata } from 'next';

import { LookupForm } from '@/components/lookups/LookupForm';
import { LookupRow } from '@/components/lookups/LookupRow';
import { buttonClass, inputClass } from '@/components/ui/styles';
import { adminFetch } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { Lookup } from '@/types';

export const metadata: Metadata = { title: 'Lookups' };

/** The single-item endpoint also returns inactive items, which type listings leave out. */
async function findItem(type: string, key: string): Promise<Lookup | null> {
	try {
		return await adminFetch<Lookup>(`/lookups/${encodeURIComponent(type)}/${encodeURIComponent(key)}`);
	} catch (error) {
		if (error instanceof ApiError && error.statusCode === 404) return null;
		throw error;
	}
}

export default async function LookupsPage({ searchParams }: PageProps<'/lookups'>) {
	const params = await searchParams;
	const type = typeof params.type === 'string' ? params.type.trim() : '';
	const key = typeof params.key === 'string' ? params.key.trim() : '';

	// The API can't list types: an admin picks one by name
	const [items, found] = await Promise.all([
		type ? adminFetch<Lookup[]>(`/lookups/${encodeURIComponent(type)}`) : null,
		type && key ? findItem(type, key) : null,
	]);

	return (
		<main className="flex flex-col gap-6 p-8">
			<h1 className="display-heading text-2xl">Lookups</h1>

			<form className="flex flex-wrap items-end gap-3">
				<label className="flex flex-col gap-1 text-sm">
					Type
					<input name="type" required defaultValue={type} className={inputClass} />
				</label>
				<label className="flex flex-col gap-1 text-sm">
					Key (finds inactive items too)
					<input name="key" defaultValue={key} className={inputClass} />
				</label>
				<button type="submit" className={buttonClass}>
					Show
				</button>
			</form>

			{type && key ? (
				<section className="flex flex-col gap-2">
					<h2 className="font-medium">
						{type}/{key}
					</h2>
					{found ? (
						<ul className="rounded-md border border-border">
							<LookupRow lookup={found} />
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">No item with this type and key.</p>
					)}
				</section>
			) : null}

			{items ? (
				<section className="flex flex-col gap-2">
					<h2 className="font-medium">Active items of {type}</h2>
					{items.length ? (
						<ul className="divide-y divide-border rounded-md border border-border">
							{items.map((item) => (
								<LookupRow key={item.id} lookup={item} />
							))}
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">No active items of this type.</p>
					)}
				</section>
			) : null}

			<section className="flex flex-col gap-2">
				<h2 className="font-medium">New item</h2>
				<LookupForm key={type} defaultType={type} />
			</section>
		</main>
	);
}
