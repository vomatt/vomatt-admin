import { defineField } from 'sanity';

import callToAction from '@/sanity/schemaTypes/objects/call-to-action';

// Up to two buttons; the first is the primary one
export default function actions() {
	return defineField({
		name: 'actions',
		type: 'array',
		of: [callToAction({ title: 'Button' })],
		validation: (Rule) => Rule.max(2),
	});
}
