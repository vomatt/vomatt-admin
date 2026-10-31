import type { StructureResolver } from 'sanity/structure';

import { aboutSiteMenu, appMenu } from './deskStructure/pages';
import { settingsMenu } from './deskStructure/settings';

// Grouped by the site that reads each document; Settings are read by both
export const structure: StructureResolver = (S) =>
	S.list()
		.title('Website')
		.items([aboutSiteMenu(S), appMenu(S), S.divider(), settingsMenu(S)]);
