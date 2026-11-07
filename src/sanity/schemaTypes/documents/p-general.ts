import { defineType } from 'sanity';

import { languageTitle, localizePath } from '@/sanity/lib/languages';
import { validateHeroPlacement } from '@/sanity/lib/modules';
import accordionList from '@/sanity/schemaTypes/objects/accordion-list';
import callout from '@/sanity/schemaTypes/objects/callout';
import carousel from '@/sanity/schemaTypes/objects/carousel';
import editorial from '@/sanity/schemaTypes/objects/editorial';
import featureList from '@/sanity/schemaTypes/objects/feature-list';
import freeform from '@/sanity/schemaTypes/objects/freeform';
import hero from '@/sanity/schemaTypes/objects/hero';
import language from '@/sanity/schemaTypes/objects/language';
import marquee from '@/sanity/schemaTypes/objects/marquee';
import sharing from '@/sanity/schemaTypes/objects/sharing';
import slug from '@/sanity/schemaTypes/objects/slug';
import title from '@/sanity/schemaTypes/objects/title';

export const pGeneral = defineType({
	title: 'Page',
	name: 'pGeneral',
	type: 'document',
	fields: [
		language(),
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
			title: 'Show "Last updated" date',
			name: 'showLastUpdated',
			type: 'boolean',
			description:
				'Shows when this page was last published, under its title. For policies and terms.',
			initialValue: false,
			hidden: ({ parent }) => parent?.layout !== 'editor',
		},
		{
			title: 'Show "Cookie settings" button',
			name: 'showCookieSettings',
			type: 'boolean',
			description:
				'Shows the button that lets visitors change their analytics cookie choice, at the end of the page. For the page that lists the cookies.',
			initialValue: false,
			hidden: ({ parent }) => parent?.layout !== 'editor',
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
			language: 'language',
		},
		prepare({ title = 'Untitled', slug = {}, language }) {
			return {
				title,
				subtitle: `${languageTitle(language)} · ${
					slug.current ? localizePath(`/${slug.current}`, language) : 'Missing page slug'
				}`,
			};
		},
	},
});
