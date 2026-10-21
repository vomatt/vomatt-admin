/**
 * @jest-environment node
 */
// Unwrap the handler so it can be called with a fake event and `done`
jest.mock('@sanity/functions', () => ({
	syncTagInvalidateEventHandler: (fn: unknown) => fn,
}));

import { handler } from '../../../functions/invalidate-tags';

type Handler = (context: {
	event: { data: { syncTags: string[] } };
	done: jest.Mock;
}) => Promise<void>;
const run = handler as unknown as Handler;

const URL = 'https://web.example.test/api/revalidate';
const syncTags = ['s1:a', 's1:b'];

describe('invalidate-tags', () => {
	const original = { ...process.env };
	const fetchMock = jest.fn();
	let done: jest.Mock;

	beforeEach(() => {
		process.env.WEB_REVALIDATE_URL = URL;
		process.env.SANITY_REVALIDATE_SECRET = 'secret';
		fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
		global.fetch = fetchMock;
		done = jest.fn().mockResolvedValue({ ok: true });
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	afterAll(() => {
		process.env = original;
	});

	it('posts the sync tags to vomatt-web with the secret', async () => {
		await run({ event: { data: { syncTags } }, done });

		expect(fetchMock).toHaveBeenCalledWith(URL, {
			method: 'POST',
			headers: {
				authorization: 'Bearer secret',
				'content-type': 'application/json',
			},
			body: JSON.stringify({ syncTags }),
		});
	});

	it('releases the sync tags after a successful call', async () => {
		await run({ event: { data: { syncTags } }, done });

		expect(done).toHaveBeenCalledWith(syncTags);
	});

	it('still releases the sync tags when vomatt-web responds with an error', async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

		await run({ event: { data: { syncTags } }, done });

		expect(done).toHaveBeenCalledWith(syncTags);
	});

	it('still releases the sync tags when vomatt-web is unreachable', async () => {
		fetchMock.mockRejectedValue(new Error('network'));

		await run({ event: { data: { syncTags } }, done });

		expect(done).toHaveBeenCalledWith(syncTags);
	});

	it('skips the call but releases the sync tags when the secret is missing', async () => {
		delete process.env.SANITY_REVALIDATE_SECRET;

		await run({ event: { data: { syncTags } }, done });

		expect(fetchMock).not.toHaveBeenCalled();
		expect(done).toHaveBeenCalledWith(syncTags);
	});

	it('does not throw when the done endpoint fails', async () => {
		done.mockRejectedValue(new Error('network'));

		await expect(run({ event: { data: { syncTags } }, done })).resolves.toBeUndefined();
	});
});
