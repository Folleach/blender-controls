import { DragSession, GridAlignment, Lifetime, Selection, rectangleFromPoints, rectanglesIntersect } from '@blender-controls/core';
import type { Graph, GraphNode, Position, Rectangle, Relation, Size, Socket } from '@blender-controls/core';
import { holdPointer, startMove } from '../pointer.ts';
import { css, element, html, query, shadow } from '../style.ts';
import { vars } from '../vars.ts';

const SVG = 'http://www.w3.org/2000/svg';
const CLIP_GAP = 100;
const MIN_ZOOM = 0.01;
const MAX_ZOOM = 8;
const ZOOM_SPEED = 0.0015;

const styles = css`
:host {
	display: block;
	position: relative;
	height: 100%;
	overflow: hidden;
	color: ${vars.text};
	font-family: ${vars.font};
	--x: 0px;
	--y: 0px;
	--zoom: 1;
	--grid-color: color-mix(in srgb, ${vars.panel} 92%, ${vars.textMuted} 8%);
}

.space {
	position: absolute;
	inset: 0;
	overflow: hidden;
	background-color: ${vars.panel};
	background-image:
		linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
		linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
	background-size: calc(60px * var(--zoom)) calc(60px * var(--zoom));
	background-position: var(--x) var(--y);
	touch-action: none;
}

.origin {
	position: absolute;
	left: 0;
	top: 0;
	transform-origin: 0 0;
	transform: translate(var(--x), var(--y)) scale(var(--zoom));
	will-change: transform;
}

svg {
	position: absolute;
	left: 0;
	top: 0;
	width: 1px;
	height: 1px;
	overflow: visible;
	pointer-events: none;
}

path {
	fill: none;
	stroke: ${vars.relation};
	stroke-width: 2;
}

path.pending {
	stroke-dasharray: 4 4;
}

path.pending:not(.active) {
	display: none;
}

.node {
	position: absolute;
	left: 0;
	top: 0;
	min-width: 120px;
	width: max-content;
	border-radius: ${vars.radiusSmall};
	background: ${vars.surface};
	box-shadow: 0 2px 6px rgb(0 0 0 / 0.35);
	will-change: transform;
}

.node.selected {
	outline: 2px solid ${vars.text};
}

.title {
	min-height: 1lh;
	padding: 0.15rem 0.5rem;
	border-radius: ${vars.radiusSmall} ${vars.radiusSmall} 0 0;
	background: ${vars.nodeHeader};
	user-select: none;
	cursor: grab;
}

.row {
	display: grid;
	grid-template-columns: 12px 1fr 12px;
	gap: 0.35rem;
	align-items: center;
	margin: 0 -6px;
	padding: 0.1rem 0;
	user-select: none;
}

.row.output .label {
	text-align: right;
}

.socket {
	width: 12px;
	height: 12px;
	box-sizing: border-box;
	border: 1.5px solid ${vars.panel};
	border-radius: 50%;
	cursor: crosshair;
}

.socket.input { background: ${vars.socketInput}; }
.socket.output { background: ${vars.socketOutput}; }

.selection {
	position: absolute;
	border: 1px dashed ${vars.textMuted};
	background: color-mix(in srgb, ${vars.textMuted} 10%, transparent);
	pointer-events: none;
}
`;

const markup = html`
<div class="space" part="space">
	<div class="origin">
		<svg aria-hidden="true"><g class="links"></g><path class="pending"></path></svg>
		<div class="nodes"></div>
	</div>
	<div class="selection" hidden></div>
</div>
`;

export interface NodeEditorOptions {
	selection?: Selection<GraphNode>;
	grid?: number;
	renderContent?: (node: GraphNode) => Element | undefined;
}

interface NodeView {
	readonly root: HTMLElement;
	readonly content: Element | undefined;
}

export class NodeEditorElement extends HTMLElement {
	private readonly space: HTMLElement;
	private readonly nodesLayer: HTMLElement;
	private readonly links: SVGGElement;
	private readonly pending: SVGPathElement;
	private readonly selectionBox: HTMLElement;
	private readonly observer: ResizeObserver;

	private graph: Graph | undefined;
	private options: NodeEditorOptions = {};
	private _selection: Selection<GraphNode> = new Selection();
	private connection: Lifetime | undefined;
	private readonly views: Map<GraphNode, NodeView> = new Map();
	private readonly paths: Map<Relation, SVGPathElement> = new Map();
	private readonly offsets: Map<Socket, Position> = new Map();
	private readonly sizes: Map<GraphNode, Size> = new Map();
	private readonly sockets: WeakMap<Element, Socket> = new WeakMap();
	private readonly roots: WeakMap<Element, GraphNode> = new WeakMap();
	private slotCounter = 0;
	private _offset: Position = { x: 0, y: 0 };
	private _zoom = 1;
	private _pointer: Position = { x: 0, y: 0 };
	private _curving = 1;
	private viewport: Size = { width: 0, height: 0 };
	private clippingRaf = 0;
	private _visible = { nodes: 0, relations: 0 };

	constructor() {
		super();
		const root = shadow(this, styles, markup);
		this.space = query(root, '.space');
		this.nodesLayer = query(root, '.nodes');
		this.links = query<SVGGElement>(root, '.links');
		this.pending = query<SVGPathElement>(root, '.pending');
		this.selectionBox = query(root, '.selection');
		this.observer = new ResizeObserver(entries => {
			const measured: GraphNode[] = [];
			for (const entry of entries) {
				if (entry.target === this) {
					this.viewport = { width: entry.contentRect.width, height: entry.contentRect.height };
					this.scheduleClipping();
					continue;
				}
				const node = this.roots.get(entry.target);
				if (node && this.measureNode(node))
					measured.push(node);
			}
			for (const node of measured)
				this.updateRelationsOf(node);
			if (measured.length > 0)
				this.scheduleClipping();
		});

		this.space.addEventListener('pointerdown', event => this.spacePointerDown(event));
		this.space.addEventListener('pointermove', event => {
			this._pointer = this.toGraph({ x: event.clientX, y: event.clientY });
		});
		this.space.addEventListener('wheel', event => this.spaceWheel(event), { passive: false });
	}

	get selection(): Selection<GraphNode> {
		return this._selection;
	}

	get offset(): Position {
		return { ...this._offset };
	}

	set offset(offset: Position) {
		this._offset = { ...offset };
		this.style.setProperty('--x', `${offset.x}px`);
		this.style.setProperty('--y', `${offset.y}px`);
		this.scheduleClipping();
	}

	get zoom(): number {
		return this._zoom;
	}

	set zoom(zoom: number) {
		this._zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
		this.style.setProperty('--zoom', `${this._zoom}`);
		this.scheduleClipping();
	}

	zoomAt(zoom: number, client: Position): void {
		const anchor = this.toGraph(client);
		this.zoom = zoom;
		const box = this.space.getBoundingClientRect();
		this.offset = {
			x: client.x - box.left - anchor.x * this._zoom,
			y: client.y - box.top - anchor.y * this._zoom,
		};
	}

	get curving(): number {
		return this._curving;
	}

	set curving(curving: number) {
		this._curving = Math.min(1, Math.max(0, curving));
		for (const relation of this.paths.keys())
			this.updateRelation(relation);
		this.scheduleClipping();
	}

	get visible(): { nodes: number; relations: number } {
		return { ...this._visible };
	}

	get pointer(): Position {
		return { ...this._pointer };
	}

	toGraph(client: Position): Position {
		const box = this.space.getBoundingClientRect();
		return {
			x: (client.x - box.left - this._offset.x) / this._zoom,
			y: (client.y - box.top - this._offset.y) / this._zoom,
		};
	}

	bind(graph: Graph, options: NodeEditorOptions = {}): void {
		this.unbind();
		this.graph = graph;
		this.options = options;
		this._selection = options.selection ?? new Selection();
		const connection = (this.connection = new Lifetime());

		connection.add(
			graph.changes.subscribe(change => {
				switch (change.kind) {
					case 'node-added':
						this.addNode(change.node);
						break;
					case 'node-removed':
						this.removeNode(change.node);
						break;
					case 'node-moved':
						this.placeNode(change.node);
						break;
					case 'linked':
						this.addRelation(change.relation);
						break;
					case 'unlinked':
						this.removeRelation(change.relation);
						break;
				}
			}),
		);
		connection.add(this._selection.changes.subscribe(() => this.renderSelection()));

		for (const node of graph.nodes())
			this.addNode(node);
		for (const relation of graph.relations())
			this.addRelation(relation);
	}

	unbind(): void {
		this.connection?.dispose();
		this.connection = undefined;
		for (const node of [...this.views.keys()])
			this.removeNode(node);
		for (const relation of [...this.paths.keys()])
			this.removeRelation(relation);
		this.graph = undefined;
	}

	disconnectedCallback(): void {
		this.observer.disconnect();
		cancelAnimationFrame(this.clippingRaf);
		this.clippingRaf = 0;
	}

	connectedCallback(): void {
		this.observer.observe(this);
		for (const view of this.views.values())
			this.observer.observe(view.root);
	}

	private addNode(node: GraphNode) {
		if (this.views.has(node))
			return;
		const root = element('div', 'node');
		const title = element('div', 'title', node.title);
		root.append(title);
		for (const socket of node.outputs)
			root.append(this.renderSocket(socket));

		const content = this.options.renderContent?.(node);
		if (content) {
			const name = `node-${++this.slotCounter}`;
			const slot = element('slot');
			slot.name = name;
			content.slot = name;
			root.append(slot);
			this.append(content);
		}
		for (const socket of node.inputs)
			root.append(this.renderSocket(socket));

		root.addEventListener('pointerdown', event => this.nodePointerDown(event, node));
		title.addEventListener('pointerdown', event => this.titlePointerDown(event, node));

		this.views.set(node, { root, content });
		this.roots.set(root, node);
		this.nodesLayer.append(root);
		this.placeNode(node);
		root.classList.toggle('selected', this._selection.has(node));
		this.observer.observe(root);
	}

	private renderSocket(socket: Socket): HTMLElement {
		const row = element('div', `row ${socket.direction}`);
		const handle = element('div', `socket ${socket.direction}`);
		handle.title = socket.type;
		this.sockets.set(handle, socket);
		handle.addEventListener('pointerdown', event => this.socketPointerDown(event, socket));
		const label = element('span', 'label', socket.key);
		if (socket.direction === 'input')
			row.append(handle, label, element('span'));
		else
			row.append(element('span'), label, handle);
		return row;
	}

	private removeNode(node: GraphNode) {
		const view = this.views.get(node);
		if (!view)
			return;
		this.views.delete(node);
		this.observer.unobserve(view.root);
		view.root.remove();
		view.content?.remove();
		for (const socket of [...node.inputs, ...node.outputs])
			this.offsets.delete(socket);
		this.sizes.delete(node);
		this._selection.delete(node);
		this.scheduleClipping();
	}

	private placeNode(node: GraphNode) {
		const view = this.views.get(node);
		if (!view)
			return;
		view.root.style.transform = `translate(${node.position.x}px, ${node.position.y}px)`;
		this.updateRelationsOf(node);
		this.scheduleClipping();
	}

	private measureNode(node: GraphNode): boolean {
		const view = this.views.get(node);
		if (!view || !view.root.isConnected)
			return false;
		this.sizes.set(node, { width: view.root.offsetWidth, height: view.root.offsetHeight });
		const origin = view.root.getBoundingClientRect();
		for (const handle of view.root.querySelectorAll('.socket')) {
			const socket = this.sockets.get(handle);
			if (!socket)
				continue;
			const box = handle.getBoundingClientRect();
			this.offsets.set(socket, {
				x: (box.left + box.width / 2 - origin.left) / this._zoom,
				y: (box.top + box.height / 2 - origin.top) / this._zoom,
			});
		}
		return true;
	}

	private socketPosition(socket: Socket): Position | undefined {
		const offset = this.offsets.get(socket);
		if (!offset)
			return undefined;
		return { x: socket.node.position.x + offset.x, y: socket.node.position.y + offset.y };
	}

	private addRelation(relation: Relation) {
		if (this.paths.has(relation))
			return;
		const path = document.createElementNS(SVG, 'path');
		this.paths.set(relation, path);
		this.links.append(path);
		this.updateRelation(relation);
		this.scheduleClipping();
	}

	private removeRelation(relation: Relation) {
		this.paths.get(relation)?.remove();
		this.paths.delete(relation);
		this.scheduleClipping();
	}

	private updateRelationsOf(node: GraphNode) {
		for (const socket of node.inputs) {
			if (socket.relation)
				this.updateRelation(socket.relation);
		}
		for (const socket of node.outputs) {
			for (const relation of socket.relations)
				this.updateRelation(relation);
		}
	}

	private updateRelation(relation: Relation) {
		const path = this.paths.get(relation);
		const from = this.socketPosition(relation.from);
		const to = this.socketPosition(relation.to);
		if (path && from && to)
			path.setAttribute('d', curve(from, to, this._curving));
	}

	private scheduleClipping() {
		if (this.clippingRaf || !this.isConnected)
			return;
		this.clippingRaf = requestAnimationFrame(() => {
			this.clippingRaf = 0;
			this.clipping();
		});
	}

	private clipping() {
		const all = this.viewport.width === 0 || this.viewport.height === 0;
		const view: Rectangle = {
			x: -this._offset.x / this._zoom - CLIP_GAP,
			y: -this._offset.y / this._zoom - CLIP_GAP,
			width: this.viewport.width / this._zoom + CLIP_GAP * 2,
			height: this.viewport.height / this._zoom + CLIP_GAP * 2,
		};

		const nodes = attachVisible(this.nodesLayer, this.views, (node, { root, content }) => {
			const size = this.sizes.get(node);
			const visible = all || !size || rectanglesIntersect(view, { ...node.position, ...size });
			if (content && visible !== content.isConnected) {
				if (visible)
					this.append(content);
				else
					content.remove();
			}
			return visible;
		}, ({ root }) => root);

		const relations = attachVisible(this.links, this.paths, relation => {
			const from = this.socketPosition(relation.from);
			const to = this.socketPosition(relation.to);
			return all || !from || !to || rectanglesIntersect(view, curveBounds(from, to, this._curving));
		}, path => path);
		this._visible = { nodes, relations };
	}

	private renderSelection() {
		for (const [node, view] of this.views)
			view.root.classList.toggle('selected', this._selection.has(node));
	}

	private spaceWheel(event: WheelEvent) {
		event.preventDefault();
		const scale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 400 : 1;
		this.zoomAt(this._zoom * Math.exp(-event.deltaY * scale * ZOOM_SPEED), { x: event.clientX, y: event.clientY });
	}

	private spacePointerDown(event: PointerEvent) {
		if (event.button === 1) {
			event.preventDefault();
			startMove(event, this._offset, offset => (this.offset = offset), { cursor: 'move' });
			return;
		}
		if (event.button !== 0)
			return;
		const start = this.toGraph({ x: event.clientX, y: event.clientY });
		const append = event.shiftKey;
		let moved = false;
		holdPointer(
			event,
			{
				move: e => {
					moved = true;
					const box = rectangleFromPoints(start, this.toGraph({ x: e.clientX, y: e.clientY }));
					this.selectionBox.hidden = false;
					Object.assign(this.selectionBox.style, {
						left: `${box.x * this._zoom + this._offset.x}px`,
						top: `${box.y * this._zoom + this._offset.y}px`,
						width: `${box.width * this._zoom}px`,
						height: `${box.height * this._zoom}px`,
					});
				},
				end: (e, cancelled) => {
					this.selectionBox.hidden = true;
					if (cancelled || !e)
						return;
					if (!moved) {
						if (!append)
							this._selection.clear();
						return;
					}
					const box = rectangleFromPoints(start, this.toGraph({ x: e.clientX, y: e.clientY }));
					const hit = [...this.sizes].filter(([node, size]) => rectanglesIntersect(box, { ...node.position, ...size }));
					this._selection.select(
						hit.map(([node]) => node),
						append,
					);
				},
			},
			{ cursor: 'crosshair' },
		);
	}

	private nodePointerDown(event: PointerEvent, node: GraphNode) {
		if (event.button !== 0)
			return;
		event.stopPropagation();
		if (event.shiftKey) {
			if (this._selection.has(node))
				this._selection.delete(node);
			else
				this._selection.select([node], true);
		} else if (!this._selection.has(node)) {
			this._selection.select([node]);
		}
	}

	private titlePointerDown(event: PointerEvent, node: GraphNode) {
		const graph = this.graph;
		if (event.button !== 0 || !graph)
			return;
		this.nodePointerDown(event, node);
		const moving = this._selection.has(node) ? this._selection.values() : [node];
		const zoom = this._zoom;
		const pointer = { x: event.clientX / zoom, y: event.clientY / zoom };
		const alignment = new GridAlignment(this.options.grid ?? 15);
		const sessions = moving.map(item => ({ item, session: new DragSession(item.position, pointer, alignment) }));
		holdPointer(
			event,
			{
				move: e => {
					for (const { item, session } of sessions)
						graph.move(item, session.at({ x: e.clientX / zoom, y: e.clientY / zoom }));
				},
			},
			{ cursor: 'grabbing' },
		);
	}

	private socketPointerDown(event: PointerEvent, socket: Socket) {
		const graph = this.graph;
		if (event.button !== 0 || !graph)
			return;
		event.stopPropagation();
		event.preventDefault();

		let origin: Socket = socket;
		if (socket.direction === 'input' && socket.relation) {
			origin = socket.relation.from;
			graph.unlink(socket.relation);
		}
		const from = this.socketPosition(origin);
		if (!from)
			return;
		const draw = (client: Position) => {
			const to = this.toGraph(client);
			this.pending.classList.add('active');
			this.pending.setAttribute('d', origin.direction === 'output' ? curve(from, to, this._curving) : curve(to, from, this._curving));
		};
		draw({ x: event.clientX, y: event.clientY });

		holdPointer(
			event,
			{
				move: e => draw({ x: e.clientX, y: e.clientY }),
				end: (e, cancelled) => {
					this.pending.classList.remove('active');
					if (cancelled || !e)
						return;
					const target = this.socketAt(e.clientX, e.clientY);
					if (!target || target.direction === origin.direction)
						return;
					if (origin.direction === 'output' && target.direction === 'input')
						graph.link(origin, target);
					else if (origin.direction === 'input' && target.direction === 'output')
						graph.link(target, origin);
				},
			},
			{ cursor: 'crosshair' },
		);
	}

	private socketAt(x: number, y: number): Socket | undefined {
		for (const candidate of this.shadowRoot?.elementsFromPoint(x, y) ?? []) {
			const socket = this.sockets.get(candidate);
			if (socket)
				return socket;
		}
		return undefined;
	}
}

function curveOffset(from: Position, to: Position, curving: number): number {
	return Math.max(40, Math.abs(to.x - from.x) / 2) * curving;
}

function curve(from: Position, to: Position, curving: number): string {
	if (curving === 0)
		return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
	const dx = curveOffset(from, to, curving);
	return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
}

function curveBounds(from: Position, to: Position, curving: number): Rectangle {
	const dx = curveOffset(from, to, curving);
	const left = Math.min(from.x, to.x - dx);
	const right = Math.max(from.x + dx, to.x);
	const top = Math.min(from.y, to.y);
	return { x: left, y: top, width: right - left, height: Math.max(from.y, to.y) - top };
}

function attachVisible<K, V>(
	parent: Element,
	items: Map<K, V>,
	visible: (key: K, value: V) => boolean,
	elementOf: (value: V) => Element,
): number {
	let cursor = parent.firstChild;
	let count = 0;
	for (const [key, value] of items) {
		const element = elementOf(value);
		if (visible(key, value)) {
			if (element === cursor)
				cursor = element.nextSibling;
			else
				parent.insertBefore(element, cursor);
			count++;
		} else if (element.parentNode === parent) {
			if (element === cursor)
				cursor = element.nextSibling;
			element.remove();
		}
	}
	return count;
}
