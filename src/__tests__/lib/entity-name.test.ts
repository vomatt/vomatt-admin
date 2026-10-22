/**
 * @jest-environment node
 */
jest.mock('server-only', () => ({}));
jest.mock('@/lib/api/admin', () => ({ adminFetch: jest.fn() }));

import { adminFetch } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { entityName } from '@/lib/entity-name';

describe('entityName', () => {
	it("reads a user's username", async () => {
		jest.mocked(adminFetch).mockResolvedValue({ username: 'ann' });

		expect(await entityName('user', 'u1')).toBe('ann');
	});

	it("reads a poll's title", async () => {
		jest.mocked(adminFetch).mockResolvedValue({ vote: { title: 'Lunch?' } });

		expect(await entityName('poll', 'p1')).toBe('Lunch?');
	});

	it('is null for an ID that matches nothing', async () => {
		jest.mocked(adminFetch).mockRejectedValue(new ApiError('Not found', 404));

		expect(await entityName('user', 'missing')).toBeNull();
	});

	it('rethrows other errors', async () => {
		jest.mocked(adminFetch).mockRejectedValue(new ApiError('Boom', 500));

		await expect(entityName('poll', 'p1')).rejects.toThrow('Boom');
	});
});
