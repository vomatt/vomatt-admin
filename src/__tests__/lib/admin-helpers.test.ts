/**
 * @jest-environment node
 */
jest.mock('server-only', () => ({}));

import { withQuery } from '@/lib/api/admin';
import { pollStatus } from '@/lib/format';
import { readPage, readParam } from '@/lib/search-params';

describe('withQuery', () => {
	it('leaves out empty params', () => {
		expect(withQuery('/admin/users', { q: 'ann', status: '', role: undefined, page: 2 })).toBe(
			'/admin/users?q=ann&page=2'
		);
	});

	it('encodes a + offset', () => {
		expect(withQuery('/admin/audit-logs', { from: '2026-10-01T00:00:00+08:00' })).toBe(
			'/admin/audit-logs?from=2026-10-01T00%3A00%3A00%2B08%3A00'
		);
	});

	it('returns the bare path without params', () => {
		expect(withQuery('/admin/lookups', { type: '' })).toBe('/admin/lookups');
	});
});

describe('readParam', () => {
	it('trims and reads "any" as no filter', () => {
		expect(readParam({ q: ' ann ', status: 'any', role: ['a', 'b'] }, 'q')).toBe('ann');
		expect(readParam({ status: 'any' }, 'status')).toBe('');
		expect(readParam({ role: ['a', 'b'] }, 'role')).toBe('');
	});
});

describe('readPage', () => {
	it.each([
		[undefined, 1],
		['3', 3],
		['0', 1],
		['-2', 1],
		['1.5', 1],
		['x', 1],
	])('reads %p as page %p', (page, expected) => {
		expect(readPage({ page })).toBe(expected);
	});
});

describe('pollStatus', () => {
	const poll = { startTime: '2026-10-10T00:00:00Z', endTime: '2026-10-20T00:00:00Z' };

	it.each([
		['2026-10-09T00:00:00Z', 'scheduled'],
		['2026-10-15T00:00:00Z', 'open'],
		['2026-10-20T00:00:00Z', 'ended'],
	])('at %s is %s', (now, status) => {
		expect(pollStatus(poll, Date.parse(now))).toBe(status);
	});
});
