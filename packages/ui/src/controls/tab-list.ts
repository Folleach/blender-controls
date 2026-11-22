import { addIcon } from '../icons.ts';
import { css, element, html, query, shadow } from '../style.ts';
import { vars } from '../vars.ts';

export interface Tab {
	id: string;
	text: string;
}

export interface TabEventDetail {
	id: string;
	x: number;
	y: number;
}

export interface TabRenameDetail {
	id: string;
	text: string;
}

const styles = css`
:host {
	display: flex;
	gap: 0.15rem;
	overflow-x: auto;
	user-select: none;
	background: ${vars.background};
	color: ${vars.text};
	font-family: ${vars.font};
}

.tab {
	display: flex;
	align-items: center;
	padding: 0.15rem 0.5rem;
	white-space: nowrap;
	background: ${vars.panel};
	cursor: default;
}

.tab:hover {
	background: ${vars.surface};
}

.tab.active {
	background: ${vars.textMuted};
	color: white;
}

.append {
	color: ${vars.textMuted};
}

input {
	width: 8rem;
	padding: 0;
	border: none;
	outline: none;
	font: inherit;
	color: inherit;
	background: transparent;
}
`;

export class TabListElement extends HTMLElement {
	static readonly observedAttributes = ['appendable'];
	private readonly list: HTMLElement;
	private _tabs: readonly Tab[] = [];
	private _active: string | undefined;
	private editing: string | undefined;

	constructor() {
		super();
		const root = shadow(this, styles, html`<div class="list" style="display: contents" role="tablist"></div>`);
		this.list = query(root, '.list');
	}

	get tabs(): readonly Tab[] {
		return this._tabs;
	}

	set tabs(tabs: readonly Tab[]) {
		this._tabs = tabs;
		this.render();
	}

	get active(): string | undefined {
		return this._active;
	}

	set active(id: string | undefined) {
		this._active = id;
		this.render();
	}

	attributeChangedCallback(): void {
		this.render();
	}

	rename(id: string): void {
		this.editing = id;
		this.render();
	}

	private render() {
		const views = this._tabs.map(tab => this.renderTab(tab));
		if (this.hasAttribute('appendable')) {
			const append = element('div', 'tab append');
			append.title = 'Add';
			append.innerHTML = addIcon;
			append.addEventListener('click', () => this.emit('blen-tab-append', undefined));
			views.push(append);
		}
		this.list.replaceChildren(...views);
		this.list.querySelector('input')?.focus();
	}

	private renderTab(tab: Tab): HTMLElement {
		const view = element('div', 'tab');
		view.setAttribute('role', 'tab');
		view.classList.toggle('active', tab.id === this._active);
		view.setAttribute('aria-selected', String(tab.id === this._active));

		if (this.editing === tab.id) {
			const input = element('input');
			input.value = tab.text;
			const finish = (commit: boolean) => {
				if (this.editing !== tab.id)
					return;
				this.editing = undefined;
				const text = input.value.trim();
				if (commit && text && text !== tab.text)
					this.emit<TabRenameDetail>('blen-tab-rename', { id: tab.id, text });
				this.render();
			};
			input.addEventListener('keydown', event => {
				if (event.key === 'Enter') finish(true);
				if (event.key === 'Escape') finish(false);
			});
			input.addEventListener('blur', () => finish(true));
			view.append(input);
			return view;
		}

		view.textContent = tab.text;
		view.addEventListener('click', event =>
			this.emit<TabEventDetail>('blen-tab-select', { id: tab.id, x: event.clientX, y: event.clientY }),
		);
		view.addEventListener('dblclick', () => this.rename(tab.id));
		view.addEventListener('contextmenu', event => {
			event.preventDefault();
			this.emit<TabEventDetail>('blen-tab-menu', { id: tab.id, x: event.clientX, y: event.clientY });
		});
		return view;
	}

	private emit<T>(type: string, detail: T) {
		this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
	}
}
