import {
	defineBlueprint,
	defineSyncTagInvalidateFunction,
} from '@sanity/blueprints';

export default defineBlueprint({
	resources: [
		// Expires vomatt-web's Sanity cache once published content is queryable.
		// Secret: `npx sanity functions env add invalidate-tags SANITY_REVALIDATE_SECRET <value>`
		defineSyncTagInvalidateFunction({
			name: 'invalidate-tags',
			event: {
				resource: { type: 'dataset', id: 'urdaqaow.production' },
			},
			env: {
				WEB_REVALIDATE_URL: 'https://vomatt.com/api/revalidate',
			},
		}),
	],
});
