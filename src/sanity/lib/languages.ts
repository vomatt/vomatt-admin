// The about site's locales (en is the default, served without a prefix). Matches vomatt-web's i18n-config.ts.
export const languages = [
	{ id: 'en', title: 'English' },
	{ id: 'zh', title: '繁體中文' },
] as const;

export type LanguageId = (typeof languages)[number]['id'];

export const defaultLanguage: LanguageId = 'en';

// One document per language for these types (@sanity/document-internationalization)
export const localizedTypes = ['pGeneral', 'pHome'];

export function languageTitle(id: string = defaultLanguage) {
	return languages.find((language) => language.id === id)?.title ?? id;
}

// '/' and '/about' become '/zh' and '/zh/about'
export function localizePath(path: string, language: string | undefined) {
	if (!language || language === defaultLanguage) return path;
	return path === '/' ? `/${language}` : `/${language}${path}`;
}
