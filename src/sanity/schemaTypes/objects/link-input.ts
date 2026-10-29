import { LinkIcon } from '@sanity/icons/Link';
import { defineField, defineType } from 'sanity';

import { isSitePathOrAbsoluteUrl } from '@/sanity/lib/link';
import {
	LinkInput,
	pageDocumentOrder,
} from '@/sanity/schemaTypes/components/LinkInput';

export const linkInput = defineType({
	name: 'linkInput',
	icon: LinkIcon,
	type: 'object',
	fields: [
		defineField({
			name: 'linkType',
			type: 'string',
			options: {
				list: [
					{ title: 'Internal Page', value: 'internal' },
					{ title: 'URL or path', value: 'external' },
				],
			},
			initialValue: 'internal',
		}),
		defineField({
			name: 'internalLink',
			title: 'Internal Page',
			type: 'reference',
			to: pageDocumentOrder.map((type) => ({ type })),
			hidden: ({ parent }) => parent?.linkType !== 'internal',
		}),
		defineField({
			name: 'externalUrl',
			title: 'URL or path',
			type: 'url',
			description: 'A full URL, or a path on vomatt such as /explore',
			validation: (Rule) => [
				Rule.uri({
					allowRelative: true,
					scheme: ['http', 'https', 'mailto', 'tel'],
				}),
				Rule.custom<string>((url) =>
					isSitePathOrAbsoluteUrl(url) ? true : 'Start with https:// or /'
				),
			],
			hidden: ({ parent }) => parent?.linkType !== 'external',
		}),
	],
	components: {
		input: LinkInput,
	},
});
