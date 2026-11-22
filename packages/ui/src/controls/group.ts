import { css, html, shadow } from '../style.ts';

const styles = css`
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

// <blen-group orientation="horizontal|vertical"> — joins controls into one block.
export class GroupElement extends HTMLElement {
	constructor() {
		super();
		shadow(this, styles, html`<slot></slot>`);
	}
}
