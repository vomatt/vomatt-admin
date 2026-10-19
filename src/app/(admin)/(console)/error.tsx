'use client'; // Error boundaries must be Client Components

import { Button } from '@/components/ui/button';

// An admin view's API read failed (e.g. 429 or the API is down)
export default function ConsoleError({ retry }: { error: unknown; retry: () => void }) {
	return (
		<main className="flex flex-col items-start gap-4 p-8">
			<h1 className="display-heading text-2xl">Couldn&apos;t load this page</h1>
			<p className="text-sm text-muted-foreground">The API didn&apos;t respond as expected. Try again in a moment.</p>
			<Button variant="outline" size="sm" onClick={() => retry()}>
				Try again
			</Button>
		</main>
	);
}
