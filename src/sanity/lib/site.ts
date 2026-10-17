// Mirrors vomatt-web src/lib/utils.ts (resolveHref, isValidUrl, getIcon); change both.
// resolveHref maps document types to the public site's routes.
import {
	Facebook,
	Github,
	Instagram,
	Linkedin,
	Spotify,
	XTwitter,
	Youtube,
} from '@/sanity/lib/socialIcons';

export function isValidUrl(urlString: string) {
	const urlPattern = new RegExp(
		'^(https?:\\/\\/)?' + // validate protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
			'(\\?[;&a-z\\d%_.~+=-]*)?', // validate query string
		'i'
	);
	return !!urlPattern.test(urlString);
}

export function getIcon(icon: string) {
	switch (icon) {
		case 'facebook':
			return Facebook;
		case 'instagram':
			return Instagram;
		case 'linkedin':
			return Linkedin;
		case 'spotify':
			return Spotify;
		case 'x':
			return XTwitter;
		case 'youTube':
			return Youtube;
		case 'github':
			return Github;
		default:
			return null;
	}
}

export const resolveHref = ({
	documentType,
	slug,
}: {
	documentType: string | undefined;
	slug: string | undefined;
}) => {
	if (!documentType) return undefined;

	switch (documentType) {
		case 'pHome':
			return '/';
		case 'pGeneral':
			return slug ? `/${slug}` : undefined;
		case 'pBlogIndex':
			return '/blog';
		case 'pSignUp':
			return '/login';
		case 'pBlog':
			return slug ? `/blog/${slug}` : undefined;
		case 'externalUrl':
			return slug;

		default:
			console.warn('Invalid document type:', documentType);
			return undefined;
	}
};
