import { ThLargeIcon } from '@sanity/icons/ThLarge';
import { defineArrayMember } from 'sanity';

import sectionHeading from '@/sanity/schemaTypes/objects/section-heading';

// Names of icons vomatt-web draws (src/components/modules/FeatureList.tsx); change both
const ICONS = [
	'lock',
	'users',
	'clock',
	'eye',
	'message',
	'bell',
	'check',
	'globe',
	'share',
	'link',
	'search',
	'plus',
	'star',
	'trendingUp',
];

// Short items, each a title and a line or two: cards, numbered steps, or the rules
export default function featureList() {
	return defineArrayMember({
		name: 'featureList',
		title: 'Feature List',
		type: 'object',
		icon: ThLargeIcon,
		fields: [
			...sectionHeading(),
			{
				name: 'layout',
				type: 'string',
				description:
					'Rules is the Tide surface for what vomatt promises; use it for rules only',
				options: {
					list: [
						{ title: 'Cards', value: 'cards' },
						{ title: 'Steps', value: 'steps' },
						{ title: 'Rules', value: 'rules' },
					],
					layout: 'radio',
					direction: 'horizontal',
				},
				initialValue: 'cards',
				validation: (Rule) => Rule.required(),
			},
			{
				name: 'items',
				type: 'array',
				of: [
					{
						name: 'feature',
						type: 'object',
						fields: [
							{
								name: 'icon',
								type: 'string',
								description: 'Not shown on Steps, which are numbered',
								options: { list: ICONS },
							},
							{
								name: 'title',
								type: 'string',
								validation: (Rule) => Rule.required(),
							},
							{
								name: 'body',
								type: 'text',
								rows: 3,
							},
						],
						preview: {
							select: { title: 'title', subtitle: 'body' },
						},
					},
				],
				validation: (Rule) => Rule.min(1).required(),
			},
		],
		preview: {
			select: { title: 'heading', layout: 'layout', items: 'items' },
			prepare({ title, layout, items }) {
				return {
					title: title || 'Untitled',
					subtitle: `Feature List (${layout || 'cards'}), ${items?.length ?? 0} item(s)`,
				};
			},
		},
	});
}
