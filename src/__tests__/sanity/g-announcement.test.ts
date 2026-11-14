jest.mock('sanity', () => ({
	defineType: <T>(type: T) => type,
}));

import { gAnnouncement } from '@/sanity/schemaTypes/singletons/g-announcement';

type Field = {
	name: string;
	validation?: (rule: { custom: (fn: unknown) => unknown }) => unknown;
};

// Runs the message field's custom rule the way the Studio does
function validateMessage(message: unknown[] | undefined, enabled?: boolean) {
	const field = (gAnnouncement.fields as Field[]).find(
		(f) => f.name === 'message'
	);
	const check = field?.validation?.({ custom: (fn) => fn }) as (
		value: unknown[] | undefined,
		context: { document?: { enabled?: boolean } }
	) => true | string;
	return check(message, { document: { enabled } });
}

const block = { _type: 'block', children: [{ _type: 'span', text: 'Hi' }] };

describe('gAnnouncement message', () => {
	it('is required while the announcement is on', () => {
		expect(validateMessage(undefined, true)).toBe(
			'Required while the announcement is on'
		);
		expect(validateMessage([], true)).toBe(
			'Required while the announcement is on'
		);
		expect(
			validateMessage(
				[{ _type: 'block', children: [{ _type: 'span', text: ' ' }] }],
				true
			)
		).toBe('Required while the announcement is on');
		expect(validateMessage([block], true)).toBe(true);
	});

	it('is optional while the announcement is off', () => {
		expect(validateMessage(undefined, false)).toBe(true);
		expect(validateMessage(undefined)).toBe(true);
	});
});
