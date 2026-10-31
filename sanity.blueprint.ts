import {
	defineBlueprint,
	defineSyncTagInvalidateFunction,
} from '@sanity/blueprints';

export default defineBlueprint({
	resources: [
		// Expires vomatt-web's and vomatt-about's Sanity caches once published content is queryable.
		// Secret (the same value on both sites): `npx sanity functions env add invalidate-tags SANITY_REVALIDATE_SECRET <value>`
		defineSyncTagInvalidateFunction({
			name: 'invalidate-tags',
			event: {
				resource: { type: 'dataset', id: 'urdaqaow.production' },
			},
			env: {
				REVALIDATE_URLS:
					'https://vomatt.com/api/revalidate,https://about.vomatt.com/api/revalidate',
			},
		}),
	],
});
