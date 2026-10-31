import { syncTagInvalidateEventHandler } from '@sanity/functions';

// vomatt-web and vomatt-about cache each Sanity query under its sync tags; send the changed ones to both
export const handler = syncTagInvalidateEventHandler(
	async ({ event, done }) => {
		const urls = (process.env.REVALIDATE_URLS ?? '')
			.split(',')
			.map((url) => url.trim())
			.filter(Boolean);
		const secret = process.env.SANITY_REVALIDATE_SECRET;

		if (urls.length === 0 || !secret) {
			console.error('REVALIDATE_URLS or SANITY_REVALIDATE_SECRET is not set');
		} else {
			// One site being down doesn't hold back the other
			await Promise.all(
				urls.map(async (url) => {
					try {
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
						// That site keeps serving the old content until the next successful call
						console.error(`Could not revalidate ${url}`, error);
					}
				})
			);
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
