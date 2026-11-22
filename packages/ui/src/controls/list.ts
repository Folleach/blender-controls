import { css, html, shadow } from '../style.ts';
import { vars } from '../vars.ts';

const styles = css`
:host {
	display: block;
	margin: 0.35rem 0.5rem;
}

h3 {
	margin: 0 0 0.25rem;
	font-size: 1em;
}

hr {
	border: 0;
	border-top: 1px solid ${vars.border};
	margin: 0.25rem 0;
}
`;

export class ListElement extends HTMLElement {
	static readonly observedAttributes = ['header'];
	private readonly header: HTMLHeadingElement;

	constructor() {
		super();
		const root = shadow(this, styles, html`<h3 part="header"></h3><hr /><slot></slot>`);
		this.header = root.querySelector('h3')!;
	}

	attributeChangedCallback(): void {
		this.header.textContent = this.getAttribute('header') ?? '';
		this.header.hidden = !this.header.textContent;
	}
}
