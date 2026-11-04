import { defineField } from 'sanity';

// Set by @sanity/document-internationalization when a document or its translation is created
export default function language() {
	return defineField({
		name: 'language',
		type: 'string',
		readOnly: true,
		hidden: true,
	});
}
