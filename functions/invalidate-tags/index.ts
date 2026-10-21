import { syncTagInvalidateEventHandler } from '@sanity/functions';

// vomatt-web caches each Sanity query under its sync tags; send the changed ones
export const handler = syncTagInvalidateEventHandler(
	async ({ event, done }) => {
		const url = process.env.WEB_REVALIDATE_URL;
		const secret = process.env.SANITY_REVALIDATE_SECRET;

		try {
			if (!url || !secret) {
				throw new Error(
					'WEB_REVALIDATE_URL or SANITY_REVALIDATE_SECRET is not set'
				);
			}
			const res = await fetch(url, {
				method: 'POST',
				headers: {
					authorization: `Bearer ${secret}`,
					'content-type': 'application/json',
				},
				body: JSON.stringify({ syncTags: event.data.syncTags }),
			});
			if (!res.ok) throw new Error(`${url} responded ${res.status}`);
		} catch (error) {
			// vomatt-web keeps serving the old content until the next successful call
			console.error('Could not revalidate vomatt-web', error);
		}

		// Always release the tags, or Live Content API clients never see the change
		try {
			const response = await done(event.data.syncTags);
			if (!response.ok)
				console.error('Sanity done endpoint responded', response.status);
		} catch (error) {
			console.error('Could not call the Sanity done endpoint', error);
		}
	}
);
