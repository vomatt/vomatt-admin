import { HomeIcon } from '@sanity/icons/Home';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { languageTitle, localizePath } from '@/sanity/lib/languages';
import language from '@/sanity/schemaTypes/objects/language';
import sectionHeading from '@/sanity/schemaTypes/objects/section-heading';
import sharing from '@/sanity/schemaTypes/objects/sharing';
import title from '@/sanity/schemaTypes/objects/title';

// The about site pairs each item with a mock visual by position, so every list has a fixed length
function exactly(count: number, noun: string) {
	return (items: unknown[] | undefined) =>
		items?.length === count ? true : `Add exactly ${count} ${noun}`;
}

const text = (name: string, title?: string) =>
	defineField({ name, title, type: 'text', rows: 3 });

const titledItem = (name: string) =>
	defineArrayMember({
		name,
		type: 'object',
		fields: [defineField({ name: 'title', type: 'string' }), text('body')],
		preview: { select: { title: 'title', subtitle: 'body' } },
	});

const comparisonCard = (name: string, title: string) =>
	defineField({
		name,
		title,
		type: 'object',
		fields: [
			defineField({
				name: 'label',
				type: 'string',
				description: 'A short tag above the card title',
			}),
			defineField({ name: 'title', type: 'string' }),
			text('body'),
		],
	});

const actionLabels = [
	defineField({
		name: 'primaryLabel',
		title: 'Primary button label',
		type: 'string',
	}),
	defineField({
		name: 'secondaryLabel',
		title: 'Secondary button label',
		type: 'string',
	}),
];

const section = (
	name: string,
	title: string,
	fields: ReturnType<typeof defineField>[]
) =>
	defineField({
		name,
		title,
		type: 'object',
		group: name,
		options: { collapsible: false },
		fields,
	});

export const pHome = defineType({
	title: 'Homepage',
	name: 'pHome',
	type: 'document',
	icon: HomeIcon,
	groups: [
		{ name: 'hero', title: 'Hero', default: true },
		{ name: 'howItWorks', title: 'How it works' },
		{ name: 'whySealed', title: 'Why sealed' },
		{ name: 'features', title: 'Features' },
		{ name: 'useCases', title: 'Use cases' },
		{ name: 'promise', title: 'Promise' },
		{ name: 'finalCta', title: 'Final call to action' },
		{ name: 'seo', title: 'SEO' },
	],
	fields: [
		language(),
		title({ initialValue: 'Homepage', group: 'hero' }),
		section('hero', 'Hero', [
			defineField({
				name: 'badge',
				type: 'string',
				description: 'A short label above the heading',
			}),
			defineField({ name: 'heading', type: 'string' }),
			text('body'),
			...actionLabels,
		]),
		section('howItWorks', 'How it works', [
			...sectionHeading(),
			defineField({
				name: 'steps',
				type: 'array',
				of: [titledItem('step')],
				validation: (Rule) => Rule.custom(exactly(3, 'steps')),
			}),
		]),
		section('whySealed', 'Why sealed', [
			...sectionHeading(),
			comparisonCard('openCount', 'Open count card'),
			comparisonCard('sealed', 'Sealed card'),
		]),
		section('features', 'Features', [
			...sectionHeading(),
			defineField({
				name: 'items',
				title: 'Features',
				type: 'array',
				of: [titledItem('feature')],
				validation: (Rule) => Rule.custom(exactly(6, 'features')),
			}),
		]),
		section('useCases', 'Use cases', [
			...sectionHeading(),
			defineField({
				name: 'items',
				title: 'Use cases',
				type: 'array',
				of: [
					defineArrayMember({
						name: 'useCase',
						type: 'object',
						fields: [
							defineField({
								name: 'who',
								type: 'string',
								description: 'Who runs the poll, such as "Teams"',
							}),
							text('body'),
							defineField({
								name: 'question',
								type: 'string',
								description: 'An example poll question',
							}),
						],
						preview: { select: { title: 'who', subtitle: 'question' } },
					}),
				],
				validation: (Rule) => Rule.custom(exactly(4, 'use cases')),
			}),
		]),
		section('promise', 'Promise', [
			...sectionHeading(),
			defineField({
				name: 'rules',
				type: 'array',
				of: [titledItem('rule')],
				validation: (Rule) => Rule.custom(exactly(4, 'rules')),
			}),
			defineField({
				name: 'footnote',
				type: 'portableTextSimple',
				description: 'Link to the Privacy Policy and About pages',
			}),
		]),
		section('finalCta', 'Final call to action', [
			defineField({ name: 'heading', type: 'string' }),
			text('body'),
			...actionLabels,
		]),
		{ ...sharing(), group: 'seo' },
	],
	preview: {
		select: {
			title: 'title',
			language: 'language',
		},
		prepare({ title = 'Untitled', language }) {
			return {
				title,
				subtitle: `${languageTitle(language)} · ${localizePath('/', language)}`,
			};
		},
	},
});
