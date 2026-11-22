import { css, html, shadow } from '../style.ts';
import { vars } from '../vars.ts';

const styles = css`
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
		const root = shadow(this, styles, html`<button part="button"><slot></slot></button>`);
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
