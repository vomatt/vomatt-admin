import { defaultLanguage } from '@/sanity/lib/languages';

// Translations share a slug, so a slug is unique per type and language. Mirrors Sanity's default
// isUnique otherwise: the document's own draft, published and release versions don't count.
export function slugUniquenessQuery({
	docType,
	publishedId,
	slug,
	language,
}: {
	docType: string;
	publishedId: string;
	slug: string;
	language?: unknown;
}) {
	return {
		query: `!defined(*[
			_type == $docType &&
			!sanity::versionOf($publishedId) &&
			slug.current == $slug &&
			coalesce(language, $defaultLanguage) == $language
		][0]._id)`,
		params: {
			docType,
			publishedId,
			slug,
			language: typeof language === 'string' ? language : defaultLanguage,
			defaultLanguage,
		},
	};
}
