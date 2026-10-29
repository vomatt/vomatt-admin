import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { defineArrayMember } from 'sanity';

import customImage from '@/sanity/schemaTypes/objects/custom-image';
import sectionHeading from '@/sanity/schemaTypes/objects/section-heading';

// A heading with long-form text, and an optional image beside it
export default function editorial() {
	return defineArrayMember({
		name: 'editorial',
		type: 'object',
		icon: DocumentTextIcon,
		fields: [
			...sectionHeading(),
			{
				name: 'body',
				type: 'portableText',
			},
			customImage({ name: 'media', title: 'Image' }),
			{
				name: 'mediaPosition',
				title: 'Image position',
				type: 'string',
				options: {
					list: [
						{ title: 'Right', value: 'right' },
						{ title: 'Left', value: 'left' },
					],
					layout: 'radio',
					direction: 'horizontal',
				},
				initialValue: 'right',
				hidden: ({ parent }) => !parent?.media?.asset,
			},
		],
		preview: {
			select: { title: 'heading', media: 'media' },
			prepare({ title, media }) {
				return { title: title || 'Untitled', subtitle: 'Editorial', media };
			},
		},
	});
}
