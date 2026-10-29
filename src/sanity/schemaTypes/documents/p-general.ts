import { defineType } from 'sanity';

import { validateHeroPlacement } from '@/sanity/lib/modules';
import accordionList from '@/sanity/schemaTypes/objects/accordion-list';
import callout from '@/sanity/schemaTypes/objects/callout';
import carousel from '@/sanity/schemaTypes/objects/carousel';
import editorial from '@/sanity/schemaTypes/objects/editorial';
import featureList from '@/sanity/schemaTypes/objects/feature-list';
import freeform from '@/sanity/schemaTypes/objects/freeform';
import hero from '@/sanity/schemaTypes/objects/hero';
import marquee from '@/sanity/schemaTypes/objects/marquee';
import sharing from '@/sanity/schemaTypes/objects/sharing';
import slug from '@/sanity/schemaTypes/objects/slug';
import title from '@/sanity/schemaTypes/objects/title';

export const pGeneral = defineType({
	title: 'Page',
	name: 'pGeneral',
	type: 'document',
	fields: [
		title(),
		slug(),
		{
			name: 'layout',
			type: 'string',
			options: {
				list: [
					{ title: 'Editor', value: 'editor' },
					{ title: 'Modules', value: 'modules' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
		},
		{
			name: 'pageModules',
			type: 'array',
			of: [
				hero(),
				editorial(),
				featureList(),
				accordionList(),
				callout(),
				freeform(),
				carousel(),
				marquee(),
			],
			hidden: ({ parent }) => parent?.layout !== 'modules',
			validation: (Rule) => Rule.custom<{ _type: string }[]>(validateHeroPlacement),
		},
		{
			name: 'content',
			type: 'portableText',
			hidden: ({ parent }) => parent?.layout !== 'editor',
		},
		sharing(),
	],
	preview: {
		select: {
			title: 'title',
			slug: 'slug',
		},
		prepare({ title = 'Untitled', slug = {} }) {
			return {
				title,
				subtitle: slug.current ? `/${slug.current}` : 'Missing page slug',
			};
		},
	},
});
