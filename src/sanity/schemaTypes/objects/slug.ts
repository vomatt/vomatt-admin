import { defineField, getPublishedId, type SlugValue } from 'sanity';

import { slugUniquenessQuery } from '@/sanity/lib/slug';
import { SlugField } from '@/sanity/schemaTypes/components/SlugField';

type SlugOptions = {
	initialValue?: SlugValue;
	readOnly?: boolean;
	group?: string;
};

export default function slug({
	initialValue,
	readOnly,
	group,
}: SlugOptions = {}) {
	return defineField({
		title: 'Slug (Page URL)',
		name: 'slug',
		type: 'slug',
		components: {
			field: SlugField,
		},
		options: {
			source: 'title',
			isUnique: (slug, context) => {
				const { document, getClient } = context;
				if (!document) throw new Error('Slug uniqueness needs the document');
				const { query, params } = slugUniquenessQuery({
					docType: document._type,
					publishedId: getPublishedId(document._id),
					slug,
					language: document.language,
				});
				return getClient({ apiVersion: '2025-02-19' })
					.withConfig({ perspective: 'raw' })
					.fetch<boolean>(query, params);
			},
			maxLength: 200,
			slugify: (input) => {
				if (!input) return '';
				// Convert common ligatures to their regular character equivalents
				const decomposedInput = input
					// Latin ligatures
					.replace(/œ/g, 'oe')
					.replace(/æ/g, 'ae')
					.replace(/Œ/g, 'OE')
					.replace(/Æ/g, 'AE')
					// Germanic ligatures
					.replace(/ĳ/g, 'ij')
					.replace(/Ĳ/g, 'IJ')
					// Historical ligatures
					.replace(/ﬀ/g, 'ff')
					.replace(/ﬁ/g, 'fi')
					.replace(/ﬂ/g, 'fl')
					.replace(/ﬃ/g, 'ffi')
					.replace(/ﬄ/g, 'ffl')
					.replace(/ﬅ/g, 'ft')
					.replace(/ﬆ/g, 'st');

				return decomposedInput
					.toLowerCase()
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.replace(/[’'`]/g, '')
					.replace(/[^\p{Letter}\p{Number}\s-]+/gu, '')
					.replace(/[\s\W-]+/g, '-')
					.replace(/^-+|-+$/g, '')
					.slice(0, 200);
			},
		},
		validation: (Rule) => [Rule.required()],
		initialValue: initialValue,
		readOnly: ({ value, currentUser }) => {
			if (!value) {
				return false;
			}

			const isAdmin = currentUser?.roles.some(
				(role) => role.name === 'administrator'
			);

			// Only admins can change the slug
			return readOnly || !isAdmin;
		},
		group: group,
	});
}
