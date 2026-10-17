// Mirrors vomatt-web src/lib/routes.ts getSafeRedirectPath; change both

/** Keeps a `redirect` param on this origin; anything else goes home. */
export function getSafeRedirectPath(path: string | null) {
	if (!path?.startsWith('/')) return '/';
	const base = 'http://localhost';
	const url = new URL(path, base);
	if (url.origin !== base) return '/';
	return `${url.pathname}${url.search}${url.hash}`;
}
