import { css, html, shadow } from '../style.ts';
import { vars } from '../vars.ts';

const buttonStyles = css`
:host {
	display: inline-block;
}

button {
	width: 100%;
	height: var(--blen-control-height, 20px);
	padding: 0 0.75rem;
	border: none;
	border-radius: inherit;
	font: inherit;
	color: ${vars.textStrong};
	background: ${vars.control};
	cursor: default;
}

button:hover {
	background: ${vars.controlHover};
}

button:active {
	background: ${vars.accent};
}

button:disabled {
	opacity: 0.5;
	background: ${vars.control};
}
`;

export class ButtonElement extends HTMLElement {
	static readonly observedAttributes = ['disabled'];
	private readonly button: HTMLButtonElement;

	constructor() {
		super();
		const root = shadow(this, buttonStyles, html`<button part="button"><slot></slot></button>`);
		this.button = root.querySelector('button')!;
		this.addEventListener('click', event => {
			if (this.disabled)
				event.stopImmediatePropagation();
		}, { capture: true });
	}

	get disabled(): boolean {
		return this.hasAttribute('disabled');
	}

	set disabled(value: boolean) {
		this.toggleAttribute('disabled', value);
	}

	attributeChangedCallback(): void {
		this.button.disabled = this.disabled;
	}
}

const groupStyles = css`
:host {
	display: inline-grid;
	grid-auto-flow: column;
	gap: 1px;
	overflow: hidden;
	border-radius: 0.2rem;
}

:host([orientation='vertical']) {
	grid-auto-flow: row;
}
`;

export class GroupElement extends HTMLElement {
	constructor() {
		super();
		shadow(this, groupStyles, html`<slot></slot>`);
	}
}

const listStyles = css`
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
		const root = shadow(this, listStyles, html`<h3 part="header"></h3><hr /><slot></slot>`);
		this.header = root.querySelector('h3')!;
	}

	attributeChangedCallback(): void {
		this.header.textContent = this.getAttribute('header') ?? '';
		this.header.hidden = !this.header.textContent;
	}
}

const itemStyles = css`
:host {
	display: grid;
	grid-template-columns: 1rem auto 1fr max-content;
	gap: 0.25rem;
	align-items: center;
	padding: 0.1rem 0.25rem;
	border-radius: ${vars.radiusSmall};
	user-select: none;
	cursor: default;
}

:host(:hover) {
	background: ${vars.hover};
}

.hint {
	color: ${vars.textMuted};
	margin-left: 1rem;
}
`;

export class ListItemElement extends HTMLElement {
	static readonly observedAttributes = ['hint'];
	private readonly hint: HTMLSpanElement;

	constructor() {
		super();
		const root = shadow(
			this,
			itemStyles,
			html`<slot name="icon"><span></span></slot><slot></slot><span></span><span class="hint"></span>`,
		);
		this.hint = root.querySelector('.hint')!;
		this.addEventListener('keydown', event => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				this.click();
			}
		});
	}

	connectedCallback(): void {
		if (!this.hasAttribute('role'))
			this.setAttribute('role', 'button');
		if (!this.hasAttribute('tabindex'))
			this.tabIndex = 0;
	}

	attributeChangedCallback(): void {
		this.hint.textContent = this.getAttribute('hint') ?? '';
	}
}

const separatorStyles = css`
:host {
	display: block;
	border-top: 1px solid ${vars.border};
	margin: 0.25rem 0;
}
`;

export class SeparatorElement extends HTMLElement {
	constructor() {
		super();
		shadow(this, separatorStyles);
	}

	connectedCallback(): void {
		this.setAttribute('role', 'separator');
	}
}
