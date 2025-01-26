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
}

export enum ContainerUpdateType {
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
	update: IPipe<ContainerUpdateType> = new LastPipe();

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
		return new Workspace(
			new ContainerArea(
				Orientation.Horizontal,
				new ContainerArea(
					Orientation.Vertical,
					new LeafArea<unknown>(INIT_AREA_ID, undefined),
					new LeafArea<unknown>(INIT_AREA_ID, undefined),
					new AreaSize(1, "fr"),
					new AreaSize(2, "fr"),
				),
				new LeafArea<unknown>(INIT_AREA_ID, undefined),
				new AreaSize(1, "fr"),
				new AreaSize(2, "fr"),
			),
		);
	}

	findSiblingContainer(area: IArea | undefined, side: Side): ContainerArea | undefined {
		if (area instanceof ContainerArea || !area) return area;
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

	split(area: IArea, options: AreaSplitOptions) {
		if (!(area instanceof LeafArea)) return;
		const parent = <ContainerArea>this.parents.get(area);

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
		parent.update.push(ContainerUpdateType.Split);
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
		if (!(area instanceof LeafArea)) {
			console.error("can not swap container area");
			return;
		}
		area.windowId = windowId;
		area.context = context;
		const container = <ContainerArea>this.parents.get(area);
		container.update.push(ContainerUpdateType.Swap);
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
