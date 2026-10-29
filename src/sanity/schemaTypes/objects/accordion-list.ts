import { DoubleChevronDownIcon } from '@sanity/icons/DoubleChevronDown';
import { defineArrayMember } from 'sanity';

import accordion from '@/sanity/schemaTypes/objects/accordion';
import sectionHeading from '@/sanity/schemaTypes/objects/section-heading';

export default function accordionList() {
	return defineArrayMember({
		name: 'accordionList',
		type: 'object',
		icon: DoubleChevronDownIcon,
		fields: [
			...sectionHeading(),
			{
				title: 'Accordion List',
				name: 'items',
				type: 'array',
				of: [accordion()],
			},
		],
		preview: {
			select: {
				heading: 'heading',
				items: 'items',
			},
			prepare({ heading, items }) {
				return {
					title: heading || 'Accordion List',
					subtitle: `Accordion List, ${items?.length ?? 0} item(s)`,
				};
			},
		},
	});
}
