import { isValidUrl } from '@/sanity/lib/site';

const SCHEME = /^[a-z][a-z\d+.-]*:/i;

/** A path on the site: starts with one slash ("/explore"), not two ("//host"). */
const isSitePath = (value: string) => value.startsWith('/') && !value.startsWith('//');

/**
 * What the link picker saves for typed text: a site path as is, a URL with its
 * scheme (https:// added when left out), or null when it is neither.
 */
export function externalUrlFromQuery(query: string): string | null {
	const value = query.trim();
	if (isSitePath(value) || /^(mailto|tel):/i.test(value)) return value;
	if (!isValidUrl(value)) return null;
	return SCHEME.test(value) ? value : `https://${value}`;
}

/**
 * Rule.uri({ allowRelative }) also passes "example.com/page", which a browser
 * would resolve against the current page; an external link must be a site path
 * or carry a scheme.
 */
export function isSitePathOrAbsoluteUrl(value: string | undefined) {
	return !value || isSitePath(value) || SCHEME.test(value);
}
