import { css, html, shadow } from '../style.ts';
import { vars } from '../vars.ts';

const styles = css`
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
			styles,
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
