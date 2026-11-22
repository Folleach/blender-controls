import { ContextMenu, MenuDirectory, MenuItem, MenuSeparator, throwLater } from '@blender-controls/core';
import type { MenuElement, MenuLevel, MenuSource } from '@blender-controls/core';
import { disclosureRightIcon, icons } from '../icons.ts';
import { css, element, shadow } from '../style.ts';
import { vars } from '../vars.ts';

const styles = css`
:host {
	position: fixed;
	inset: 0;
	z-index: 1000;
	pointer-events: none;
	font-family: ${vars.font};
	color: ${vars.text};
}

:host([open]) {
	pointer-events: all;
}

.menu {
	position: absolute;
	left: 0;
	top: 0;
	min-width: 8rem;
	max-width: 24rem;
	box-sizing: border-box;
	padding: 0.35rem;
	border: 1px solid ${vars.border};
	border-radius: ${vars.radiusSmall};
	background: ${vars.panel};
	user-select: none;
}

.item {
	display: grid;
	grid-template-columns: 1rem auto 1fr max-content;
	gap: 0.25rem;
	align-items: center;
	padding: 0.1rem 0.25rem;
	border-radius: ${vars.radiusSmall};
	white-space: nowrap;
	cursor: default;
}

.item:hover,
.item.active {
	background: ${vars.hover};
}

.item.disabled {
	opacity: 0.5;
}

.item.disabled:hover {
	background: none;
}

.hint,
.icon {
	color: ${vars.textMuted};
}

.hint {
	margin-left: 1rem;
}

.separator {
	border: 0;
	border-top: 1px solid ${vars.border};
	margin: 0.25rem 0;
}

.loading {
	color: ${vars.textMuted};
	padding: 0.1rem 0.25rem;
}
`;

export class MenuLayerElement extends HTMLElement {
	private readonly root: ShadowRoot;
	private model: ContextMenu | undefined;
	private unsubscribe: (() => void) | undefined;
	private rendered: Map<MenuLevel, HTMLElement> = new Map();

	constructor() {
		super();
		this.root = shadow(this, styles);
		this.addEventListener('pointerdown', event => {
			if (event.composedPath()[0] === this)
				this.model?.close();
		});
		this.addEventListener('contextmenu', event => event.preventDefault());
	}

	get contextMenu(): ContextMenu {
		if (!this.model)
			this.bind(new ContextMenu());
		return this.model!;
	}

	bind(model: ContextMenu): void {
		this.unsubscribe?.();
		this.model = model;
		this.unsubscribe = model.changes.subscribe(() => this.render());
		this.render();
	}

	connectedCallback(): void {
		window.addEventListener('pointermove', this.onPointerMove);
		window.addEventListener('keydown', this.onKeyDown);
		window.addEventListener('blur', this.onBlur);
	}

	disconnectedCallback(): void {
		window.removeEventListener('pointermove', this.onPointerMove);
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('blur', this.onBlur);
		this.model?.close();
	}

	private readonly onPointerMove = (event: PointerEvent) => {
		if (this.model?.isOpen)
			this.model.track({ x: event.clientX, y: event.clientY });
	};

	private readonly onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape' && this.model?.isOpen)
			this.model.closeFrom(this.model.levels.length - 1);
	};

	private readonly onBlur = () => this.model?.close();

	private render() {
		const levels = this.model?.levels ?? [];
		this.toggleAttribute('open', levels.length > 0);
		const next = new Map<MenuLevel, HTMLElement>();
		for (const level of levels)
			next.set(level, this.rendered.get(level) ?? this.renderLevel(level));
		for (const [level, view] of this.rendered) {
			if (!next.has(level))
				view.remove();
		}
		this.rendered = next;
	}

	private renderLevel(level: MenuLevel): HTMLElement {
		const view = element('div', 'menu');
		view.setAttribute('role', 'menu');
		view.style.transform = `translate(${level.position.x}px, ${level.position.y}px)`;
		view.append(element('div', 'loading', '…'));
		this.root.append(view);

		Promise.resolve()
			.then(() => level.menu.elements(this.model?.context))
			.then(elements => {
				if (this.rendered.get(level) !== view)
					return;
				view.replaceChildren(...elements.map(item => this.renderElement(item, level)));
				this.fit(view, level);
			})
			.catch(error => {
				throwLater(error, 'failed to resolve menu elements');
				this.model?.closeFrom(level.depth);
			});
		return view;
	}

	private renderElement(item: MenuElement, level: MenuLevel): HTMLElement {
		if (item instanceof MenuSeparator) {
			const separator = element('hr', 'separator');
			separator.setAttribute('role', 'separator');
			return separator;
		}
		const row = element('div', 'item');
		row.setAttribute('role', 'menuitem');
		const icon = element('span', 'icon');
		const text = element('span', 'text', item.text);
		const spacer = element('span');
		const end = element('span', 'hint');
		row.append(icon, text, spacer, end);

		if (item instanceof MenuItem) {
			if (item.options.icon)
				icon.innerHTML = icons[item.options.icon] ?? '';
			end.textContent = item.options.hint ?? '';
			row.classList.toggle('disabled', !!item.options.disabled);
			row.addEventListener('click', () => this.model?.execute(item));
			row.addEventListener('pointerenter', () => this.model?.closeFrom(level.depth + 1));
		} else if (item instanceof MenuDirectory) {
			row.setAttribute('aria-haspopup', 'menu');
			end.innerHTML = disclosureRightIcon;
			row.addEventListener('pointerenter', () => this.openDirectory(row, item.menu, level));
			row.addEventListener('click', () => this.openDirectory(row, item.menu, level));
		}
		return row;
	}

	private openDirectory(row: HTMLElement, menu: MenuSource, level: MenuLevel) {
		const box = row.getBoundingClientRect();
		this.model?.openSubmenu(level.depth + 1, { x: box.right + 8, y: box.top - 6 }, menu);
		for (const sibling of row.parentElement?.children ?? [])
			sibling.classList.toggle('active', sibling === row);
	}

	private fit(view: HTMLElement, level: MenuLevel) {
		const box = view.getBoundingClientRect();
		const x = Math.max(0, Math.min(level.position.x, window.innerWidth - box.width));
		const y = Math.max(0, Math.min(level.position.y, window.innerHeight - box.height));
		view.style.transform = `translate(${x}px, ${y}px)`;
		this.model?.setRectangle(level, { x, y, width: box.width, height: box.height });
	}
}

export function openContextMenu(contextMenu: ContextMenu, menu: MenuSource, event: MouseEvent, context?: unknown): void {
	event.preventDefault();
	event.stopPropagation();
	contextMenu.open(menu, { x: event.clientX, y: event.clientY }, context);
}
