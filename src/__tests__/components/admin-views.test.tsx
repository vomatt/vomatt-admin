import { render, screen } from '@testing-library/react';

jest.mock('@/lib/api/services/tags', () => ({ createTag: jest.fn(), updateTag: jest.fn(), deleteTag: jest.fn() }));
jest.mock('@/lib/api/services/lookups', () => ({
	createLookup: jest.fn(),
	updateLookup: jest.fn(),
	deleteLookup: jest.fn(),
	setLookupActive: jest.fn(),
}));

import { readLookupInput } from '@/components/lookups/LookupForm';
import { LookupRow } from '@/components/lookups/LookupRow';
import { TagRow } from '@/components/tags/TagRow';

function formData(fields: Record<string, string>) {
	const data = new FormData();
	for (const [name, value] of Object.entries(fields)) data.set(name, value);
	return data;
}

describe('TagRow', () => {
	it('shows the tag and its usage', () => {
		render(
			<TagRow
				tag={{ id: 't1', name: 'Food', slug: 'food', description: 'Eating', displayOrder: 2, usageCount: 5 }}
			/>
		);

		expect(screen.getByText('Food')).toBeInTheDocument();
		expect(screen.getByText('5 polls')).toBeInTheDocument();
	});
});

describe('LookupRow', () => {
	it('offers to activate an inactive item', () => {
		render(
			<LookupRow
				lookup={{
					id: 'l1',
					lookupType: 'vote_duration',
					lookupKey: '24h',
					lookupValue: { hours: 24 },
					description: null,
					parentType: null,
					parentKey: null,
					seq: 1,
					frontendUsing: false,
					isActive: false,
				}}
			/>
		);

		expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument();
		expect(screen.getByText('inactive')).toBeInTheDocument();
	});
});

describe('readLookupInput', () => {
	it('parses the JSON value and empties to null', () => {
		expect(
			readLookupInput(
				formData({ lookupType: ' vote_duration ', lookupKey: '24h', lookupValue: '{"hours":24}', seq: '3' })
			)
		).toEqual({
			lookupType: 'vote_duration',
			lookupKey: '24h',
			lookupValue: { hours: 24 },
			description: null,
			parentType: null,
			parentKey: null,
			seq: 3,
			frontendUsing: false,
		});
	});

	it('rejects a value that is not JSON', () => {
		expect(readLookupInput(formData({ lookupType: 't', lookupKey: 'k', lookupValue: 'plain' }))).toMatch(
			/valid JSON/
		);
	});
});
