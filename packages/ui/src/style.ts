export function css(strings: TemplateStringsArray, ...values: unknown[]): string {
	return String.raw({ raw: strings }, ...values);
}

export const html = css;

const sheets = new Map<string, CSSStyleSheet>();

// to avoid "side effects"
// do not use dynamic styles, otherwise you'll leak them
export function sheetOf(text: string): CSSStyleSheet {
	let sheet = sheets.get(text);
	if (!sheet) {
		sheet = new CSSStyleSheet();
		sheet.replaceSync(text);
		sheets.set(text, sheet);
	}
	return sheet;
}

export function shadow(host: HTMLElement, styles: string, markup = ''): ShadowRoot {
	const root = host.attachShadow({ mode: 'open' });
	root.adoptedStyleSheets = [sheetOf(styles)];
	root.innerHTML = markup;
	return root;
}

export function element<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className?: string,
	text?: string,
): HTMLElementTagNameMap[K] {
	const result = document.createElement(tag);
	if (className)
		result.className = className;
	if (text !== undefined)
		result.textContent = text;
	return result;
}

export function query<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
	const found = root.querySelector<T & Element>(selector);
	if (!found)
		throw new Error(`template has no '${selector}'`);
	return found;
}
