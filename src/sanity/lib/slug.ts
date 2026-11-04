import { defaultLanguage, languages } from '@/sanity/lib/languages';

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

// '/zh' and '/en' are language prefixes on the about site and vomatt-web, so a page can't own them
export function reservedSlug(slug: string | undefined) {
	const language = languages.find(({ id }) => id === slug);
	return language
		? `"${slug}" is the ${language.title} URL prefix; pick another slug`
		: true;
}
