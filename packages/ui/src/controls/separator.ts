import { css, shadow } from '../style.ts';
import { vars } from '../vars.ts';

const styles = css`
:host {
	display: block;
	border-top: 1px solid ${vars.border};
	margin: 0.25rem 0;
}
`;

export class SeparatorElement extends HTMLElement {
	constructor() {
		super();
		shadow(this, styles);
	}

	connectedCallback(): void {
		this.setAttribute('role', 'separator');
	}
}
