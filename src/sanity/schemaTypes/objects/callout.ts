import { BulbOutlineIcon } from '@sanity/icons/BulbOutline';
import { defineArrayMember } from 'sanity';

import actions from '@/sanity/schemaTypes/objects/actions';
import sectionHeading from '@/sanity/schemaTypes/objects/section-heading';

// A card that asks for one next step, usually closing a page
export default function callout() {
	return defineArrayMember({
		name: 'callout',
		type: 'object',
		icon: BulbOutlineIcon,
		fields: [...sectionHeading({ required: true }), actions()],
		preview: {
			select: { title: 'heading' },
			prepare({ title }) {
				return { title: title || 'Untitled', subtitle: 'Callout' };
			},
		},
	});
}
