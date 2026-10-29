import { externalUrlFromQuery, isSitePathOrAbsoluteUrl } from '@/sanity/lib/link';
import { validateHeroPlacement } from '@/sanity/lib/modules';

describe('validateHeroPlacement', () => {
	const mod = (_type: string) => ({ _type });

	it('allows a page without a Hero', () => {
		expect(validateHeroPlacement([mod('callout')])).toBe(true);
	});

	it('allows one Hero at the top', () => {
		expect(validateHeroPlacement([mod('hero'), mod('editorial')])).toBe(true);
	});

	it('rejects a second Hero', () => {
		expect(validateHeroPlacement([mod('hero'), mod('hero')])).toBe('A page can have only one Hero');
	});

	it('rejects a Hero below another module', () => {
		expect(validateHeroPlacement([mod('editorial'), mod('hero')])).toBe('The Hero must be the first module');
	});
});

describe('externalUrlFromQuery', () => {
	it('keeps a site path', () => {
		expect(externalUrlFromQuery('/explore')).toBe('/explore');
	});

	it('adds https:// to a domain typed without it', () => {
		expect(externalUrlFromQuery('partner.org/vote')).toBe('https://partner.org/vote');
	});

	it('keeps a URL that has its scheme', () => {
		expect(externalUrlFromQuery('http://partner.org')).toBe('http://partner.org');
	});

	it('offers nothing for text that is neither', () => {
		expect(externalUrlFromQuery('about us')).toBeNull();
		expect(externalUrlFromQuery('//partner.org')).toBeNull();
	});
});

describe('isSitePathOrAbsoluteUrl', () => {
	it('accepts a site path, a full URL, or nothing', () => {
		expect(isSitePathOrAbsoluteUrl('/explore')).toBe(true);
		expect(isSitePathOrAbsoluteUrl('https://partner.org')).toBe(true);
		expect(isSitePathOrAbsoluteUrl('mailto:hi@vomatt.com')).toBe(true);
		expect(isSitePathOrAbsoluteUrl(undefined)).toBe(true);
	});

	it('rejects a domain without its scheme, which a browser reads as relative', () => {
		expect(isSitePathOrAbsoluteUrl('partner.org/vote')).toBe(false);
	});
});
