jest.mock('sanity', () => ({
	defineType: <T>(type: T) => type,
	defineField: <T>(field: T) => field,
	defineArrayMember: <T>(member: T) => member,
}));
jest.mock('@sanity/icons/Home', () => ({ HomeIcon: () => null }));

import { pHome } from '@/sanity/schemaTypes/singletons/p-home';

type Field = {
	name: string;
	fields?: Field[];
	validation?: (rule: { custom: (fn: unknown) => unknown }) => unknown;
};

// Runs a list field's validation the way the Studio does for a custom rule
function validate(section: string, list: string, items: unknown[] | undefined) {
	const fields = pHome.fields as Field[];
	const field = fields
		.find((f) => f.name === section)
		?.fields?.find((f) => f.name === list);
	const check = field?.validation?.({ custom: (fn) => fn }) as (
		value: unknown[] | undefined
	) => true | string;
	return check(items);
}

const items = (count: number) => Array.from({ length: count }, () => ({}));

describe('pHome list lengths', () => {
	it.each([
		['howItWorks', 'steps', 3, 'Add exactly 3 steps'],
		['features', 'items', 6, 'Add exactly 6 features'],
		['useCases', 'items', 4, 'Add exactly 4 use cases'],
		['promise', 'rules', 4, 'Add exactly 4 rules'],
	])('%s.%s needs exactly %i items', (section, list, count, message) => {
		expect(validate(section, list, items(count))).toBe(true);
		expect(validate(section, list, items(count - 1))).toBe(message);
		expect(validate(section, list, items(count + 1))).toBe(message);
	});

	it('flags an empty list', () => {
		expect(validate('howItWorks', 'steps', undefined)).toBe('Add exactly 3 steps');
	});
});
