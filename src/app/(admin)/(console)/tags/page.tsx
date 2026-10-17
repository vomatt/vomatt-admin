import type { Metadata } from 'next';

import { TagForm } from '@/components/tags/TagForm';
import { TagRow } from '@/components/tags/TagRow';
import { publicFetch } from '@/lib/api/client';
import { Tag } from '@/types';

export const metadata: Metadata = { title: 'Tags' };

export default async function TagsPage() {
	// The admin API has no list endpoint; the public one returns every tag
	const tags = await publicFetch<Tag[]>('/tags', { cache: 'no-store' });

	return (
		<main className="flex flex-col gap-6 p-8">
			<h1 className="display-heading text-2xl">Tags</h1>
			<TagForm />
			{tags.length ? (
				<ul className="divide-y divide-border rounded-md border border-border">
					{tags.map((tag) => (
						<TagRow key={tag.id} tag={tag} />
					))}
				</ul>
			) : (
				<p className="text-sm text-muted-foreground">No tags yet.</p>
			)}
		</main>
	);
}
