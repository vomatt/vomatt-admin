import { DesktopIcon } from '@sanity/icons/Desktop';
import { DocumentsIcon } from '@sanity/icons/Documents';
import { HomeIcon } from '@sanity/icons/Home';
import { MobileDeviceIcon } from '@sanity/icons/MobileDevice';
import { UnknownIcon } from '@sanity/icons/Unknown';
import type { StructureBuilder } from 'sanity/structure';

import { apiVersion } from '@/sanity/env';
import { defaultLanguage, languages } from '@/sanity/lib/languages';

import { colorsMenu } from './colors';
import { globalMenu } from './global';
import { menusMenu } from './menus';

const localizedTemplates = (S: StructureBuilder, type: string) =>
	languages.map((language) => S.initialValueTemplateItem(`${type}-${language.id}`));

// One Homepage per language
const pageHome = (S: StructureBuilder) => {
	return S.listItem()
		.title('Homepage')
		.schemaType('pHome')
		.icon(HomeIcon)
		.child(
			S.documentList()
				.id('pHome')
				.title('Homepage')
				.schemaType('pHome')
				.filter(`_type == "pHome"`)
				.apiVersion(apiVersion)
				.defaultOrdering([{ field: 'language', direction: 'asc' }])
				.initialValueTemplates(localizedTemplates(S, 'pHome'))
		);
};

const pageSignUp = (S: StructureBuilder) => {
	return S.listItem()
		.title('Log In')
		.child(
			S.editor()
				.id('pSignUp')
				.title('Log In')
				.schemaType('pSignUp')
				.documentId('pSignUp')
		)
		.icon(DocumentsIcon);
};

const pageError = (S: StructureBuilder) => {
	return S.listItem()
		.title('404 Page')
		.child(
			S.editor()
				.id('p404')
				.title('404 Page')
				.schemaType('p404')
				.documentId('p404')
		)
		.icon(UnknownIcon);
};

// Pages saved before localization have no language and list as English
const pagesInLanguage = (S: StructureBuilder, language: (typeof languages)[number]) => {
	const template = `pGeneral-${language.id}`;
	return S.listItem()
		.id(template)
		.title(language.title)
		.schemaType('pGeneral')
		.icon(DocumentsIcon)
		.child(
			S.documentList()
				.id(template)
				.title(`Pages · ${language.title}`)
				.schemaType('pGeneral')
				.filter(`_type == "pGeneral" && coalesce(language, $defaultLanguage) == $language`)
				.params({ language: language.id, defaultLanguage })
				.apiVersion(apiVersion)
				.initialValueTemplates([S.initialValueTemplateItem(template)])
				.canHandleIntent(
					(intent, { type, template: intentTemplate }) =>
						type === 'pGeneral' &&
						(intent === 'edit' || intentTemplate === template)
				)
		);
};

const generalPages = (S: StructureBuilder) => {
	return S.listItem()
		.title('Pages')
		.schemaType('pGeneral')
		.icon(DocumentsIcon)
		.child(
			S.list()
				.id('pGeneral')
				.title('Pages')
				.items(languages.map((language) => pagesInLanguage(S, language)))
		);
};

/** Everything about.vomatt.com (vomatt-about) renders: its pages, chrome and colors. */
export const aboutSiteMenu = (S: StructureBuilder) => {
	return S.listItem()
		.title('About site')
		.id('aboutSite')
		.icon(DesktopIcon)
		.child(
			S.list()
				.title('about.vomatt.com')
				.items([
					generalPages(S),
					pageHome(S),
					pageError(S),
					S.divider(),
					globalMenu(S),
					menusMenu(S),
					colorsMenu(S),
				])
		);
};

/** The content vomatt.com (vomatt-web) reads. */
export const appMenu = (S: StructureBuilder) => {
	return S.listItem()
		.title('App')
		.id('app')
		.icon(MobileDeviceIcon)
		.child(S.list().title('vomatt.com').items([pageSignUp(S)]));
};
