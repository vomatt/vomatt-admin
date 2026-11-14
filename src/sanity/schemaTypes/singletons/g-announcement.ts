import { defineType } from 'sanity';

import { getPortableTextPreview } from '@/sanity/lib/utils';

export const gAnnouncement = defineType({
	title: 'Announcement',
	name: 'gAnnouncement',
	type: 'document',
	fields: [
		{
			name: 'enabled',
			type: 'boolean',
			description: 'Shows the announcement bar on vomatt.com.',
			initialValue: false,
		},
		{
			title: 'Message (English)',
			name: 'message',
			type: 'portableTextSimple',
			validation: (Rule) =>
				Rule.custom((message, context) => {
					const enabled = (
						context.document as { enabled?: boolean } | undefined
					)?.enabled;
					if (enabled && (!Array.isArray(message) || message.length === 0)) {
						return 'Required while the announcement is on';
					}
					return true;
				}),
		},
		{
			title: 'Message (Chinese)',
			name: 'messageZh',
			type: 'portableTextSimple',
			description: 'Shown to Chinese readers. English shows when empty.',
		},
	],
	preview: {
		select: {
			message: 'message',
			enabled: 'enabled',
		},
		prepare({ message, enabled }) {
			return {
				title: getPortableTextPreview(message),
				subtitle: enabled ? 'On' : 'Off',
			};
		},
	},
});
