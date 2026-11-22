import { Corner, Side } from '@blender-controls/core';
import type { Rectangle } from '@blender-controls/core';
import { css, html, shadow } from '../style.ts';
import { vars } from '../vars.ts';

const styles = css`
:host {
	position: absolute;
	left: 0;
	top: 0;
	display: block;
	box-sizing: border-box;
	overflow: hidden;
	border-radius: ${vars.radius};
	background: ${vars.panel};
	pointer-events: all;
	visibility: hidden;
	--corner-size: var(--blen-corner-size, 6px);
	--side-size: var(--blen-side-size, 3px);
}

:host([placed]) {
	visibility: visible;
}

.content {
	position: absolute;
	inset: 0;
	overflow: auto;
}

::slotted(iframe) {
	display: block;
	border: 0;
	width: 100%;
	height: 100%;
}

.corner,
.side {
	position: absolute;
	user-select: none;
	touch-action: none;
	z-index: 1;
}

.corner {
	width: var(--corner-size);
	height: var(--corner-size);
	cursor: crosshair;
}

.corner.tl { left: 0; top: 0; }
.corner.tr { right: 0; top: 0; }
.corner.bl { left: 0; bottom: 0; }
.corner.br { right: 0; bottom: 0; }

.side.top,
.side.bottom {
	left: var(--corner-size);
	width: calc(100% - var(--corner-size) * 2);
	height: var(--side-size);
	cursor: row-resize;
}

.side.left,
.side.right {
	top: var(--corner-size);
	height: calc(100% - var(--corner-size) * 2);
	width: var(--side-size);
	cursor: col-resize;
}

.side.top { top: 0; }
.side.bottom { bottom: 0; }
.side.left { left: 0; }
.side.right { right: 0; }
`;

const markup = html`
<div class="content" part="content"><slot></slot></div>
<div class="side top" data-side="${Side.Top}"></div>
<div class="side right" data-side="${Side.Right}"></div>
<div class="side bottom" data-side="${Side.Bottom}"></div>
<div class="side left" data-side="${Side.Left}"></div>
<div class="corner tl" data-corner="${Corner.TopLeft}"></div>
<div class="corner tr" data-corner="${Corner.TopRight}"></div>
<div class="corner bl" data-corner="${Corner.BottomLeft}"></div>
<div class="corner br" data-corner="${Corner.BottomRight}"></div>
`;

export interface FrameHandlers {
	corner(event: PointerEvent, corner: Corner): void;
	side(event: PointerEvent, side: Side): void;
	sideMenu(event: MouseEvent, side: Side): void;
}

export class AreaFrameElement extends HTMLElement {
	private handlers: FrameHandlers | undefined;

	constructor() {
		super();
		const root = shadow(this, styles, markup);
		root.addEventListener('pointerdown', event => this.pointerDown(event as PointerEvent));
		root.addEventListener('contextmenu', event => this.contextMenu(event as MouseEvent));
	}

	bind(handlers: FrameHandlers): void {
		this.handlers = handlers;
	}

	place(rect: Rectangle): void {
		this.style.transform = `translate(${rect.x}px, ${rect.y}px)`;
		this.style.width = `${rect.width}px`;
		this.style.height = `${rect.height}px`;
		this.toggleAttribute('placed', true);
	}

	private pointerDown(event: PointerEvent) {
		if (event.button !== 0 || !this.handlers)
			return;
		const target = event.target as HTMLElement;
		if (target.dataset.corner !== undefined) {
			event.preventDefault();
			this.handlers.corner(event, Number(target.dataset.corner) as Corner);
		} else if (target.dataset.side !== undefined) {
			event.preventDefault();
			this.handlers.side(event, Number(target.dataset.side) as Side);
		}
	}

	private contextMenu(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.dataset.side === undefined || !this.handlers)
			return;
		event.preventDefault();
		event.stopPropagation();
		this.handlers.sideMenu(event, Number(target.dataset.side) as Side);
	}
}
