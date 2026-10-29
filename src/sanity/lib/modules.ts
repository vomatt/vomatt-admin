// The Hero carries the page's h1, so a page has one at most, at the top
export function validateHeroPlacement(modules: { _type: string }[] = []) {
	const heroes = modules.filter((module) => module._type === 'hero');
	if (heroes.length > 1) return 'A page can have only one Hero';
	if (heroes.length && modules[0]._type !== 'hero') return 'The Hero must be the first module';
	return true;
}
