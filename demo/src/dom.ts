type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
	tag: K | string,
	attributes: Record<string, string | boolean | ((event: Event) => void)> = {},
	...children: Child[]
): HTMLElement {
	const element = document.createElement(tag);
	for (const [name, value] of Object.entries(attributes)) {
		if (typeof value === 'function')
			element.addEventListener(name.replace(/^on/, ''), value);
		else if (value === true)
			element.setAttribute(name, '');
		else if (value !== false)
			element.setAttribute(name, value);
	}
	for (const child of children) {
		if (child)
			element.append(child);
	}
	return element;
}

export function code(text: string): HTMLElement {
	return h('pre', {}, h('code', {}, text.trim()));
}
