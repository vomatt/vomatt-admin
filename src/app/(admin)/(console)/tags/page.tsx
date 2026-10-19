import type { Metadata } from 'next';

import { PageHeader } from '@/components/admin/PageHeader';
import { TagForm } from '@/components/tags/TagForm';
import { TagRow } from '@/components/tags/TagRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { publicFetch } from '@/lib/api/client';
import { Tag } from '@/types';

export const metadata: Metadata = { title: 'Tags' };

export default async function TagsPage() {
	// The admin API has no list endpoint; the public one returns every tag
	const tags = await publicFetch<Tag[]>('/tags', { cache: 'no-store' });

	return (
		<main className="flex flex-col gap-6 p-8">
			<PageHeader title="Tags" description="Ordered by display order. Tags in use by a poll can't be deleted." />
			<Card>
				<CardHeader>
					<CardTitle>New tag</CardTitle>
				</CardHeader>
				<CardContent>
					<TagForm />
				</CardContent>
			</Card>
			{tags.length ? (
				<ul className="divide-y rounded-md border">
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
