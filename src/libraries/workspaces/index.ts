import type { IContext } from "../contexts";
import { LastPipe, type IPipe } from "./bus";
import { intersect2d } from "./geometry";

export const INIT_AREA_ID = "blen.init-window";

export enum Orientation {
	Horizontal = 0,
	Vertical = 1,
}

export enum Side {
	Left = 0,
	Top = 1,
	Right = 2,
	Bottom = 3,
}

export enum WorkspaceOperation {
	Split,
	Join,
}

export interface Position {
	x: number;
	y: number;
}

export interface Rectangle {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface AreaSplitOptions {
	orientation: Orientation;
	firstSize: AreaSize;
	secondSize: AreaSize;
	appendArea: IArea;
}

export interface IArea {
	type: string;
	update: IPipe<AreaUpdateType>;
}

export interface IWorkspaceContext extends IContext {
	windowId: string;
}

export class RectangleArray {}

export class AreaSize {
	size: number;
	unit: string;

	constructor(size: number, unit: string) {
		this.size = size;
		this.unit = unit;
	}

	toString(): string {
		return `${this.size}${this.unit}`;
	}

	static get one(): AreaSize {
		return new AreaSize(1, "fr");
	}
}

export enum AreaUpdateType {
	Resize,
	Split,
	Swap,
}

export class ContainerArea implements IArea {
	type: string = "container";
	orientation: Orientation;
	left: IArea;
	right: IArea;
	leftSize: AreaSize;
	rightSize: AreaSize;
	update: IPipe<AreaUpdateType> = new LastPipe();

	constructor(orientation: Orientation, left: IArea, right: IArea, leftSize: AreaSize, rigthSize: AreaSize) {
		this.orientation = orientation;
		this.left = left;
		this.right = right;
		this.leftSize = leftSize;
		this.rightSize = rigthSize;
	}
}

export class LeafArea<T> implements IArea {
	type: string = "leaf";
	update: IPipe<AreaUpdateType> = new LastPipe();
	private _windowId: string;
	private _context: T;

	constructor(windowId: string, context: T) {
		this._windowId = windowId;
		this._context = context;
	}

	public get windowId(): string {
		return this._windowId;
	}
	public set windowId(v: string) {
		this._windowId = v;
	}

	public get context(): T {
		return this._context;
	}
	public set context(value: T) {
		this._context = value;
	}
}

export class Workspace {
	root: IArea;
	parents: Map<IArea, IArea>;
	rectangles: Map<IArea, Rectangle>;

	constructor(root: IArea) {
		this.root = root;
		this.parents = new Map();
		this.rectangles = new Map();
		this.rebuildParents();
	}

	static buildDefault(): Workspace {
		return new Workspace(new LeafArea<unknown>(INIT_AREA_ID, undefined));
	}

	findSiblingContainer(area: IArea | undefined, side?: Side): ContainerArea | undefined {
		if (area instanceof ContainerArea) return area;
		if (!area) return undefined;
		let current: IArea = area;
		while (true) {
			const prev: IArea = current;
			current = <ContainerArea>this.parents.get(prev);
			if (!current || !(current instanceof ContainerArea)) return undefined;

			if (side === Side.Bottom && current.orientation === Orientation.Vertical && current.left === prev) return current;
			if (side === Side.Top && current.orientation === Orientation.Vertical && current.right === prev) return current;
			if (side === Side.Right && current.orientation === Orientation.Horizontal && current.left === prev) return current;
			if (side === Side.Left && current.orientation === Orientation.Horizontal && current.right === prev) return current;
		}
	}

	findNearestDescent(area: ContainerArea, side: Side): IArea {
		let current = side === Side.Left || side === Side.Top ? area.left : area.right;
		while (true) {
			if (!(current instanceof ContainerArea) || area.orientation !== current.orientation) return current;
			current = side === Side.Left || side === Side.Top ? current.right : current.left;
		}
	}

	split(area: IArea, options: AreaSplitOptions) {
		if (!(area instanceof LeafArea)) return;
		const parent = <ContainerArea>this.parents.get(area);
		if (parent) {
			const container = new ContainerArea(
				options.orientation,
				area === parent.left ? parent.left : parent.right,
				options.appendArea,
				options.firstSize,
				options.secondSize,
			);
			if (area === parent.left) parent.left = container;
			else parent.right = container;
			this.rebuildParents();
			parent.update.push(AreaUpdateType.Split);
			return;
		}
		const prev = this.root;
		this.root = new ContainerArea(options.orientation, this.root, options.appendArea, options.firstSize, options.secondSize);
		this.rebuildParents();
		prev.update.push(AreaUpdateType.Split);
	}

	setActualRectangle(area: IArea, rect: Rectangle) {
		this.rectangles.set(area, rect);
	}

	findArea(position: Position, predicate: (area: IArea) => boolean): IArea | undefined {
		for (const item of this.rectangles) {
			if (predicate(item[0]) && intersect2d(position, item[1])) return item[0];
		}

		return undefined;
	}

	findSize(area: IArea): Rectangle | undefined {
		return this.rectangles.get(area);
	}

	*enumerateAreas(): Iterable<IArea> {
		const stack = [this.root];
		while (stack.length != 0) {
			const next = stack.pop();
			if (!next) continue;
			if (next instanceof ContainerArea) {
				stack.push(next.left);
				stack.push(next.right);
			}
			yield next;
		}
	}

	swap(area: IArea, windowId: string, context: unknown) {
		console.log("swap to", windowId);
		if (!(area instanceof LeafArea)) {
			console.error("can not swap container area");
			return;
		}
		area.windowId = windowId;
		area.context = context;
		area.update.push(AreaUpdateType.Swap);
	}

	swapTree(container?: ContainerArea) {
		if (!container) return;

		const left = this.findNearestDescent(container, Side.Left);
		const right = this.findNearestDescent(container, Side.Right);

		const first = <ContainerArea>this.parents.get(left);
		const second = <ContainerArea>this.parents.get(right);

		if (first.left === left) first.left = right;
		else first.right = right;
		if (second.right === right) second.right = left;
		else second.left = left;

		this.rebuildParents();
		container.update.push(AreaUpdateType.Swap);
		first.update.push(AreaUpdateType.Swap);
		second.update.push(AreaUpdateType.Swap);
	}

	private insertToParent(area: IArea) {
		if (area instanceof ContainerArea) {
			this.parents.set(area.left, area);
			this.parents.set(area.right, area);
			this.insertToParent(area.left);
			this.insertToParent(area.right);
		}
	}

	private rebuildParents() {
		this.parents.clear();
		this.insertToParent(this.root);
	}
}
