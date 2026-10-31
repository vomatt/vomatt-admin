jest.mock('sanity', () => ({ useFormValue: jest.fn() }));
jest.mock('@sanity/ui', () => ({}));

import { getUrl } from '@/sanity/schemaTypes/components/SlugField';

// The Studio runs on the admin origin, so page links use the public sites' URLs
describe('SlugField getUrl', () => {
	const original = { ...process.env };

	beforeEach(() => {
		process.env.NEXT_PUBLIC_SITE_URL = 'https://vomatt.test';
		process.env.NEXT_PUBLIC_ABOUT_URL = 'https://about.vomatt.test';
	});

	afterAll(() => {
		process.env = original;
	});

	it('links a general page to its slug on the about site', () => {
		expect(getUrl({ docType: 'pGeneral', slug: 'about' })).toBe(
			'https://about.vomatt.test/about'
		);
	});

	it('links the homepage to the about site root', () => {
		expect(getUrl({ docType: 'pHome', slug: '/' })).toBe(
			'https://about.vomatt.test/'
		);
	});

	it('links the log-in page to /login on the app', () => {
		expect(getUrl({ docType: 'pSignUp', slug: '/login' })).toBe(
			'https://vomatt.test/login'
		);
	});

	it('links the homepage even when its slug is empty', () => {
		expect(getUrl({ docType: 'pHome', slug: undefined })).toBe(
			'https://about.vomatt.test/'
		);
	});

	it('has no link before a slug is set', () => {
		expect(getUrl({ docType: 'pGeneral', slug: undefined })).toBeUndefined();
	});

	it('has no link for a type without a page route', () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		expect(getUrl({ docType: 'p404', slug: 'not-found' })).toBeUndefined();
		warn.mockRestore();
	});

	it('has no link when the about site URL is not set', () => {
		delete process.env.NEXT_PUBLIC_ABOUT_URL;
		expect(getUrl({ docType: 'pGeneral', slug: 'about' })).toBeUndefined();
	});

	it('has no link when the app URL is not set', () => {
		delete process.env.NEXT_PUBLIC_SITE_URL;
		expect(getUrl({ docType: 'pSignUp', slug: '/login' })).toBeUndefined();
	});
});
