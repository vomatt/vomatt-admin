import { defineField } from 'sanity';

// The eyebrow, heading and intro every page module can open with
export default function sectionHeading({ required = false } = {}) {
	return [
		defineField({
			name: 'eyebrow',
			type: 'string',
			description: 'A short label above the heading',
		}),
		defineField({
			name: 'heading',
			type: 'string',
			validation: (Rule) => (required ? Rule.required() : Rule),
		}),
		defineField({
			name: 'intro',
			type: 'text',
			rows: 3,
		}),
	];
}
