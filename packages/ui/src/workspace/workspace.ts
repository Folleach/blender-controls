import {
	ChildrenEvent,
	LeafArea,
	Lifetime,
	Menu,
	MenuItem,
	Orientation,
	RectangleEvent,
	ResizeEvent,
	SplitArea,
	SplitGesture,
	SplitResizeSession,
	applyGesture,
	createId,
} from '@blender-controls/core';
import type {
	Area,
	AreaDescriptor,
	ContextMenu,
	Corner,
	GesturePreview,
	MenuElement,
	MenuSource,
	Position,
	Rectangle,
	Side,
	Workspace,
} from '@blender-controls/core';
import type { DomAreaInstance, DomAreaRuntime } from '../areas.ts';
import { holdPointer } from '../pointer.ts';
import { css, element, html, query, shadow } from '../style.ts';
import { vars } from '../vars.ts';
import { AreaFrameElement } from './frame.ts';

const styles = css`
:host {
	display: block;
	position: relative;
	overflow: hidden;
	min-width: 0;
	min-height: 0;
	background: ${vars.background};
	color: ${vars.text};
	font-family: ${vars.font};
}

:host([hidden]) {
	display: none;
}

.layer {
	position: absolute;
	inset: 0;
}

.content,
.overlay {
	pointer-events: none;
}

.split {
	display: grid;
	width: 100%;
	height: 100%;
}

.cell {
	position: relative;
	min-width: 0;
	min-height: 0;
}

.separator {
	touch-action: none;
}

.split.horizontal > .separator {
	cursor: col-resize;
}

.split.vertical > .separator {
	cursor: row-resize;
}

.slot {
	width: 100%;
	height: 100%;
	border-radius: ${vars.radius};
	background: ${vars.panel};
}

.preview {
	position: absolute;
	border-radius: ${vars.radius};
	background: ${vars.preview};
}

.line {
	position: absolute;
	background: ${vars.previewLine};
}
`;

const markup = html`
<div class="layer layout" part="layout"></div>
<div class="layer content"><slot></slot></div>
<div class="layer overlay" part="overlay"></div>
`;

export interface WorkspaceViewOptions {
	contextMenu?: ContextMenu;
	createArea?: (source: LeafArea) => AreaDescriptor;
	separatorMenu?: (split: SplitArea, workspace: Workspace) => MenuSource | undefined;
}

interface SplitView {
	readonly element: HTMLDivElement;
	readonly first: HTMLDivElement;
	readonly second: HTMLDivElement;
	readonly dispose: () => void;
}

interface FrameView {
	readonly frame: AreaFrameElement;
	readonly instance: DomAreaInstance;
	readonly dispose: () => void;
}

export class WorkspaceElement extends HTMLElement {
	private readonly layout: HTMLDivElement;
	private readonly overlay: HTMLDivElement;
	private readonly observer: ResizeObserver;

	private _workspace: Workspace | undefined;
	private runtime: DomAreaRuntime | undefined;
	private options: WorkspaceViewOptions = {};
	private connection: Lifetime | undefined;
	private readonly splits: Map<SplitArea, SplitView> = new Map();
	private readonly slots: Map<LeafArea, HTMLDivElement> = new Map();
	private readonly frames: Map<LeafArea, FrameView> = new Map();
	private measureRequest = 0;

	constructor() {
		super();
		const root = shadow(this, styles, markup);
		this.layout = query<HTMLDivElement>(root, '.layout');
		this.overlay = query<HTMLDivElement>(root, '.overlay');
		this.observer = new ResizeObserver(() => this.scheduleMeasure());
	}

	get workspace(): Workspace | undefined {
		return this._workspace;
	}

	connect(workspace: Workspace, runtime: DomAreaRuntime, options: WorkspaceViewOptions = {}): void {
		if (runtime.workspace !== workspace)
			throw new Error('the runtime belongs to another workspace');
		this.disconnect();
		this._workspace = workspace;
		this.runtime = runtime;
		this.options = options;
		const connection = (this.connection = new Lifetime());

		connection.add(
			workspace.changes.subscribe(change => {
				if (change.kind === 'root') {
					this.renderRoot();
					this.prune();
				} else if (change.kind === 'structure') {
					this.prune();
				}
				this.scheduleMeasure();
			}),
		);
		connection.add(runtime.created.subscribe(({ leaf, instance }) => this.addFrame(leaf, instance)));
		connection.add(runtime.disposed.subscribe(({ leaf }) => this.removeFrame(leaf)));

		this.renderRoot();
		for (const { leaf, instance } of runtime.instances())
			this.addFrame(leaf, instance);
		this.scheduleMeasure();
	}

	disconnect(): void {
		this.connection?.dispose();
		this.connection = undefined;
		for (const leaf of [...this.frames.keys()])
			this.removeFrame(leaf);
		for (const view of this.splits.values())
			view.dispose();
		this.splits.clear();
		for (const slot of this.slots.values())
			this.observer.unobserve(slot);
		this.slots.clear();
		this.layout.replaceChildren();
		this._workspace = undefined;
		this.runtime = undefined;
	}

	connectedCallback(): void {
		this.observer.observe(this);
		for (const slot of this.slots.values())
			this.observer.observe(slot);
		for (const { instance } of this.frames.values())
			instance.attached?.();
		this.scheduleMeasure();
	}

	disconnectedCallback(): void {
		this.observer.disconnect();
		cancelAnimationFrame(this.measureRequest);
		this.measureRequest = 0;
		for (const { instance } of this.frames.values())
			instance.detached?.();
	}

	measure(): void {
		const workspace = this._workspace;
		if (!workspace || !this.isConnected)
			return;
		const host = this.getBoundingClientRect();
		const local = (target: Element): Rectangle => {
			const box = target.getBoundingClientRect();
			return { x: box.left - host.left, y: box.top - host.top, width: box.width, height: box.height };
		};
		for (const [split, view] of this.splits)
			workspace.setRectangle(split, local(view.element));
		for (const [leaf, slot] of this.slots)
			workspace.setRectangle(leaf, local(slot));
	}

	private scheduleMeasure() {
		if (this.measureRequest || !this.isConnected)
			return;
		this.measureRequest = requestAnimationFrame(() => {
			this.measureRequest = 0;
			this.measure();
		});
	}

	private renderRoot() {
		if (this._workspace)
			this.layout.replaceChildren(this.viewOf(this._workspace.root));
	}

	private viewOf(area: Area): HTMLElement {
		if (area instanceof SplitArea)
			return (this.splits.get(area) ?? this.createSplit(area)).element;
		if (area instanceof LeafArea)
			return this.slots.get(area) ?? this.createSlot(area);
		throw new Error('unknown area kind');
	}

	private createSlot(leaf: LeafArea): HTMLDivElement {
		const slot = element('div', 'slot');
		slot.dataset.leaf = leaf.id;
		this.slots.set(leaf, slot);
		this.observer.observe(slot);
		return slot;
	}

	private createSplit(split: SplitArea): SplitView {
		const root = element('div', 'split');
		const first = element('div', 'cell');
		const separator = element('div', 'separator');
		const second = element('div', 'cell');
		root.append(first, separator, second);

		const render = () => {
			const horizontal = split.orientation === Orientation.Horizontal;
			root.classList.toggle('horizontal', horizontal);
			root.classList.toggle('vertical', !horizontal);
			const template = `minmax(0, ${split.firstSize}fr) ${vars.gap} minmax(0, ${split.secondSize}fr)`;
			root.style.gridTemplateColumns = horizontal ? template : '';
			root.style.gridTemplateRows = horizontal ? '' : template;
		};
		const place = () => {
			first.replaceChildren(this.viewOf(split.first));
			second.replaceChildren(this.viewOf(split.second));
		};

		const onPointerDown = (event: PointerEvent) => {
			if (event.button === 0 && this._workspace)
				this.startResize(event, new SplitResizeSession(this._workspace, split));
		};
		const onContextMenu = (event: MouseEvent) => this.openSeparatorMenu(event, split);
		separator.addEventListener('pointerdown', onPointerDown);
		separator.addEventListener('contextmenu', onContextMenu);
		const unsubscribe = split.update.subscribe(event => {
			if (event instanceof ResizeEvent)
				render();
			else if (event instanceof ChildrenEvent)
				place();
		});

		const view: SplitView = {
			element: root,
			first,
			second,
			dispose: () => {
				unsubscribe();
				separator.removeEventListener('pointerdown', onPointerDown);
				separator.removeEventListener('contextmenu', onContextMenu);
			},
		};
		this.splits.set(split, view);
		render();
		place();
		return view;
	}

	private prune() {
		const workspace = this._workspace;
		if (!workspace)
			return;
		for (const [split, view] of this.splits) {
			if (!workspace.contains(split)) {
				view.dispose();
				this.splits.delete(split);
			}
		}
		for (const [leaf, slot] of this.slots) {
			if (!workspace.contains(leaf)) {
				this.observer.unobserve(slot);
				this.slots.delete(leaf);
			}
		}
	}

	private addFrame(leaf: LeafArea, instance: DomAreaInstance) {
		if (this.frames.has(leaf))
			this.removeFrame(leaf);
		const frame = new AreaFrameElement();
		frame.dataset.leaf = leaf.id;
		frame.bind({
			corner: (event, corner) => this.startGesture(event, leaf, corner),
			side: (event, side) => {
				const session = this._workspace && SplitResizeSession.forSide(this._workspace, leaf, side);
				if (session)
					this.startResize(event, session);
			},
			sideMenu: (event, side) => {
				const split = this._workspace?.findSiblingContainer(leaf, side);
				if (split)
					this.openSeparatorMenu(event, split);
			},
		});
		frame.append(instance.element);
		const known = this._workspace?.rectangleOf(leaf);
		if (known)
			frame.place(known);
		const unsubscribe = leaf.update.subscribe(event => {
			if (event instanceof RectangleEvent)
				frame.place(event.rectangle);
		});
		this.frames.set(leaf, { frame, instance, dispose: unsubscribe });
		this.append(frame);
		if (this.isConnected)
			instance.attached?.();
	}

	private removeFrame(leaf: LeafArea) {
		const view = this.frames.get(leaf);
		if (!view)
			return;
		this.frames.delete(leaf);
		view.dispose();
		if (this.isConnected)
			view.instance.detached?.();
		view.frame.remove();
	}

	private startResize(event: PointerEvent, session: SplitResizeSession) {
		const horizontal = session.target.orientation === Orientation.Horizontal;
		const start = horizontal ? event.clientX : event.clientY;
		holdPointer(
			event,
			{ move: e => session.apply((horizontal ? e.clientX : e.clientY) - start) },
			{ cursor: horizontal ? 'col-resize' : 'row-resize', container: this.overlay },
		);
	}

	private startGesture(event: PointerEvent, leaf: LeafArea, corner: Corner) {
		const workspace = this._workspace;
		if (!workspace)
			return;
		this.measure();
		const host = this.getBoundingClientRect();
		const local = (e: PointerEvent): Position => ({ x: e.clientX - host.left, y: e.clientY - host.top });
		const gesture = new SplitGesture(workspace, leaf, corner, local(event));
		const preview = element('div', 'preview');
		const line = element('div', 'line');
		preview.hidden = line.hidden = true;
		this.overlay.append(preview, line);

		holdPointer(
			event,
			{
				move: e => drawPreview(preview, line, gesture.update(local(e))),
				end: (e, cancelled) => {
					preview.remove();
					line.remove();
					const result = !cancelled && e ? gesture.finish(local(e)) : undefined;
					if (result)
						applyGesture(workspace, result, source => new LeafArea(createId(), this.descriptorFor(source)));
				},
			},
			{ cursor: 'crosshair', container: this.overlay },
		);
	}

	private descriptorFor(source: LeafArea): AreaDescriptor {
		if (this.options.createArea)
			return this.options.createArea(source);
		return { type: source.descriptor.type, data: copy(source.descriptor.data) };
	}

	private openSeparatorMenu(event: MouseEvent, split: SplitArea) {
		const workspace = this._workspace;
		const contextMenu = this.options.contextMenu;
		if (!workspace || !contextMenu)
			return;
		const menu = this.options.separatorMenu
			? this.options.separatorMenu(split, workspace)
			: defaultSeparatorMenu(split, workspace);
		if (!menu)
			return;
		event.preventDefault();
		event.stopPropagation();
		contextMenu.open(menu, { x: event.clientX, y: event.clientY }, { split, workspace });
	}
}

export function defaultSeparatorMenu(split: SplitArea, workspace: Workspace): MenuSource {
	const horizontal = split.orientation === Orientation.Horizontal;
	const elements: MenuElement[] = [new MenuItem('Swap Areas', () => workspace.swapTree(split))];
	for (const side of [horizontal ? 0 : 1, horizontal ? 2 : 3] as Side[]) {
		const adjacent = workspace.findNearestDescent(split, side);
		if (adjacent instanceof LeafArea) {
			const name = ['Left', 'Top', 'Right', 'Bottom'][side];
			elements.push(new MenuItem(`Close ${name} Area`, () => workspace.remove(adjacent)));
		}
	}
	return new Menu(elements);
}

function drawPreview(preview: HTMLElement, line: HTMLElement, state: GesturePreview | undefined) {
	preview.hidden = !state;
	line.hidden = !state?.line;
	if (state)
		placeAbsolute(preview, state.rectangle);
	if (state?.line)
		placeAbsolute(line, state.line);
}

function placeAbsolute(target: HTMLElement, rect: Rectangle) {
	target.style.left = `${rect.x}px`;
	target.style.top = `${rect.y}px`;
	target.style.width = `${rect.width}px`;
	target.style.height = `${rect.height}px`;
}

function copy<T>(value: T): T {
	try {
		return structuredClone(value);
	} catch {
		return value;
	}
}
