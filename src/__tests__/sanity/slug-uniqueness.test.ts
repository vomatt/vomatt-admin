import { evaluate, parse } from 'groq-js';

import { reservedSlug, slugUniquenessQuery } from '@/sanity/lib/slug';

const dataset = [
	// Created before localization, so it has no language
	{ _id: 'about', _type: 'pGeneral', slug: { current: 'about' } },
	{ _id: 'drafts.about', _type: 'pGeneral', slug: { current: 'about' } },
	{ _id: 'versions.r1.about', _type: 'pGeneral', slug: { current: 'about' } },
	{
		_id: 'about-zh',
		_type: 'pGeneral',
		language: 'zh',
		slug: { current: 'about' },
	},
	{
		_id: 'terms',
		_type: 'pGeneral',
		language: 'en',
		slug: { current: 'terms' },
	},
	{ _id: 'login', _type: 'pSignUp', slug: { current: 'about' } },
];

async function isUnique(args: {
	publishedId: string;
	slug: string;
	language?: string;
	docType?: string;
}) {
	const { query, params } = slugUniquenessQuery({
		docType: 'pGeneral',
		...args,
	});
	const result = await evaluate(parse(query), { dataset, params });
	return result.get();
}

describe('slugUniquenessQuery', () => {
	it("ignores the page's own draft, published and release versions", async () => {
		expect(await isUnique({ publishedId: 'about', slug: 'about' })).toBe(true);
	});

	it('lets a translation share the slug', async () => {
		expect(
			await isUnique({ publishedId: 'about-zh', slug: 'about', language: 'zh' })
		).toBe(true);
	});

	it('rejects a second page with the slug in the same language', async () => {
		expect(
			await isUnique({ publishedId: 'new', slug: 'terms', language: 'en' })
		).toBe(false);
	});

	it('treats a page without a language as English', async () => {
		expect(
			await isUnique({ publishedId: 'new', slug: 'about', language: 'en' })
		).toBe(false);
		expect(await isUnique({ publishedId: 'new', slug: 'terms' })).toBe(false);
	});

	it('rejects a second translation in a language that already has the slug', async () => {
		expect(
			await isUnique({ publishedId: 'new', slug: 'about', language: 'zh' })
		).toBe(false);
	});

	it('only compares pages of the same type', async () => {
		expect(
			await isUnique({ publishedId: 'new', slug: 'about', docType: 'pHome' })
		).toBe(true);
	});

	it('accepts an unused slug', async () => {
		expect(
			await isUnique({ publishedId: 'new', slug: 'press', language: 'zh' })
		).toBe(true);
	});
});

describe('reservedSlug', () => {
	it.each(['en', 'zh'])('rejects the language prefix %s', (slug) => {
		expect(reservedSlug(slug)).toEqual(expect.stringContaining('URL prefix'));
	});

	it.each(['about', 'zh-tw', undefined])('accepts %s', (slug) => {
		expect(reservedSlug(slug)).toBe(true);
	});
});
