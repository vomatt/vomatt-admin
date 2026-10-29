import { HomeIcon } from '@sanity/icons/Home';
import { defineArrayMember } from 'sanity';

import actions from '@/sanity/schemaTypes/objects/actions';
import sectionHeading from '@/sanity/schemaTypes/objects/section-heading';

// The page's opening: its h1, a lede and up to two buttons
export default function hero() {
	return defineArrayMember({
		name: 'hero',
		type: 'object',
		icon: HomeIcon,
		fields: [...sectionHeading({ required: true }), actions()],
		preview: {
			select: { title: 'heading' },
			prepare({ title }) {
				return { title: title || 'Untitled', subtitle: 'Hero' };
			},
		},
	});
}
