type Params = Record<string, string | string[] | undefined>;

/** Select filters submit `ANY` for "no filter"; it reads as empty. */
export const ANY = 'any';

/** A trimmed single query value, or '' when absent. */
export function readParam(params: Params, name: string) {
	const value = params[name];
	return typeof value === 'string' ? value.trim() : '';
}

/** A `FilterSelect` value: like `readParam`, with `ANY` read as ''. */
export function readSelectParam(params: Params, name: string) {
	const text = readParam(params, name);
	return text === ANY ? '' : text;
}

/** The 1-based `page` param; anything invalid is page 1. */
export function readPage(params: Params) {
	const page = Number(readParam(params, 'page'));
	return Number.isInteger(page) && page > 0 ? page : 1;
}
