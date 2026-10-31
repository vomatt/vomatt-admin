import { DesktopIcon } from '@sanity/icons/Desktop';
import { DocumentsIcon } from '@sanity/icons/Documents';
import { HomeIcon } from '@sanity/icons/Home';
import { MobileDeviceIcon } from '@sanity/icons/MobileDevice';
import { UnknownIcon } from '@sanity/icons/Unknown';
import type { StructureBuilder } from 'sanity/structure';

import { apiVersion } from '@/sanity/env';

import { colorsMenu } from './colors';
import { globalMenu } from './global';
import { menusMenu } from './menus';

const pageHome = (S: StructureBuilder) => {
	return S.listItem()
		.title('Homepage')
		.child(
			S.editor()
				.id('pHome')
				.title('Homepage')
				.schemaType('pHome')
				.documentId('pHome')
		)
		.icon(HomeIcon);
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

const generalPages = (S: StructureBuilder) => {
	return S.listItem()
		.title('Pages')
		.schemaType('pGeneral')
		.icon(DocumentsIcon)
		.child(
			S.documentTypeList('pGeneral')
				.title('Pages')
				.filter(`_type == "pGeneral"`)
				.apiVersion(apiVersion)
				.child((documentId) =>
					S.document().documentId(documentId).schemaType('pGeneral')
				)
				.canHandleIntent(
					(intent, { type }) =>
						['create', 'edit'].includes(intent) && type === 'pGeneral'
				)
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
