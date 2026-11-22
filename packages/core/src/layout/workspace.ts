import { Bus } from '../events.ts';
import { Orientation, Side, intersect2d, orientationOf, compareRectangles } from '../geometry.ts';
import type { Position, Rectangle } from '../geometry.ts';
import {
	ChildrenEvent,
	DescriptorEvent,
	LeafArea,
	RectangleEvent,
	ResizeEvent,
	SplitArea,
} from './area.ts';
import type { Area, AreaDescriptor } from './area.ts';

export type WorkspaceChange =
	| { readonly kind: 'root' }
	| { readonly kind: 'structure'; readonly split: SplitArea }
	| { readonly kind: 'resize'; readonly split: SplitArea }
	| { readonly kind: 'leaf-added'; readonly leaf: LeafArea }
	| { readonly kind: 'leaf-removed'; readonly leaf: LeafArea }
	| {
		readonly kind: 'descriptor';
		readonly leaf: LeafArea;
		readonly previous: AreaDescriptor;
		readonly replaced: boolean;
	};

export interface SplitOptions {
	orientation: Orientation;
	sizes?: readonly [number, number];
	before?: boolean;
}

export interface MoveOptions {
	side: Side;
	sizes?: readonly [number, number];
}

export class Workspace {
	readonly changes: Bus<WorkspaceChange> = new Bus();

	private _root: Area;
	private _version = 0;
	private readonly parents: Map<Area, SplitArea> = new Map();
	private readonly rectangles: Map<Area, Rectangle> = new Map();

	constructor(root: Area) {
		this._root = root;
		this.rebuildParents();
		this.ensureUniqueLeafIds();
	}

	get root(): Area {
		return this._root;
	}

	get version(): number {
		return this._version;
	}

	parent(area: Area): SplitArea | undefined {
		return this.parents.get(area);
	}

	contains(area: Area): boolean {
		return area === this._root || this.parents.has(area);
	}

	*areas(from: Area = this._root): Iterable<Area> {
		const stack = [from];
		while (stack.length !== 0) {
			const next = stack.pop()!;
			if (next instanceof SplitArea)
				stack.push(next.second, next.first);
			yield next;
		}
	}

	leaves(from: Area = this._root): LeafArea[] {
		const result: LeafArea[] = [];
		for (const area of this.areas(from)) {
			if (area instanceof LeafArea)
				result.push(area);
		}
		return result;
	}

	findLeaf(id: string): LeafArea | undefined {
		return this.leaves().find(leaf => leaf.id === id);
	}

	findSiblingContainer(area: Area | undefined, side?: Side): SplitArea | undefined {
		if (area instanceof SplitArea) return area;
		if (!area) return undefined;
		let current: Area = area;
		while (true) {
			const parent = this.parents.get(current);
			if (!parent) return undefined;

			if (side === Side.Bottom && parent.orientation === Orientation.Vertical && parent.first === current)
				return parent;
			if (side === Side.Top && parent.orientation === Orientation.Vertical && parent.second === current)
				return parent;
			if (side === Side.Right && parent.orientation === Orientation.Horizontal && parent.first === current)
				return parent;
			if (side === Side.Left && parent.orientation === Orientation.Horizontal && parent.second === current)
				return parent;
			current = parent;
		}
	}

	findNearestDescent(split: SplitArea, side: Side): Area {
		const towardsFirst = side === Side.Left || side === Side.Top;
		let current = towardsFirst ? split.first : split.second;
		while (true) {
			if (!(current instanceof SplitArea) || split.orientation !== current.orientation) return current;
			current = towardsFirst ? current.second : current.first;
		}
	}

	split(target: LeafArea, area: Area, options: SplitOptions): SplitArea {
		if (!this.contains(target))
			throw new Error(`failed to split: leaf '${target.id}' is not part of the workspace`);
		if (this.contains(area))
			throw new Error('failed to split: the inserted area is already part of the workspace');
		for (const leaf of this.leaves(area)) {
			if (this.findLeaf(leaf.id))
				throw new Error(`failed to split: a leaf with id '${leaf.id}' already exists`);
		}

		const split = this.insert(target, area, options);
		for (const leaf of this.leaves(area))
			this.emit({ kind: 'leaf-added', leaf });
		return split;
	}

	remove(area: Area): boolean {
		if (!this.detach(area))
			return false;
		for (const leaf of this.leaves(area))
			this.emit({ kind: 'leaf-removed', leaf });
		return true;
	}

	move(leaf: LeafArea, target: LeafArea, options: MoveOptions): boolean {
		if (leaf === target || !this.contains(target) || !this.parents.has(leaf))
			return false;
		if (!this.detach(leaf))
			return false;
		this.insert(target, leaf, {
			orientation: orientationOf(options.side),
			sizes: options.sizes,
			before: options.side === Side.Left || options.side === Side.Top,
		});
		return true;
	}

	swapTree(split: SplitArea): void {
		const first = this.findNearestDescent(split, Side.Left);
		const second = this.findNearestDescent(split, Side.Right);

		const firstParent = this.parents.get(first);
		const secondParent = this.parents.get(second);
		if (!firstParent || !secondParent)
			return;

		if (firstParent.first === first) firstParent.first = second;
		else firstParent.second = second;
		if (secondParent.second === second) secondParent.second = first;
		else secondParent.first = first;

		this.rebuildParents();
		for (const changed of new Set([split, firstParent, secondParent]))
			this.notifyChildren(changed);
	}

	setSizes(split: SplitArea, first: number, second: number): void {
		if (split.firstSize === first && split.secondSize === second)
			return;
		split.firstSize = first;
		split.secondSize = second;
		split.update.dispatch(new ResizeEvent());
		this.emit({ kind: 'resize', split });
	}

	replace<D>(leaf: LeafArea<D>, descriptor: AreaDescriptor<D>): void {
		const previous = leaf.descriptor;
		leaf.descriptor = descriptor;
		leaf.update.dispatch(new DescriptorEvent(previous, true));
		this.emit({ kind: 'descriptor', leaf, previous, replaced: true });
	}

	setData<D>(leaf: LeafArea<D>, data: D): void {
		const previous = leaf.descriptor;
		leaf.descriptor = { type: previous.type, data };
		leaf.update.dispatch(new DescriptorEvent(previous, false));
		this.emit({ kind: 'descriptor', leaf, previous, replaced: false });
	}

	setRectangle(area: Area, rect: Rectangle): void {
		if (compareRectangles(this.rectangles.get(area), rect))
			return;
		this.rectangles.set(area, { ...rect });
		if (area instanceof LeafArea)
			area.update.dispatch(new RectangleEvent({ ...rect }));
	}

	rectangleOf(area: Area): Rectangle | undefined {
		return this.rectangles.get(area);
	}

	leafAt(position: Position): LeafArea | undefined {
		for (const leaf of this.leaves()) {
			const rect = this.rectangles.get(leaf);
			if (rect && intersect2d(position, rect))
				return leaf;
		}
		return undefined;
	}

	private insert(target: LeafArea, area: Area, options: SplitOptions): SplitArea {
		const [firstSize, secondSize] = options.sizes ?? [1, 1];
		const parent = this.parents.get(target);
		const split = new SplitArea(
			options.orientation,
			options.before ? area : target,
			options.before ? target : area,
			firstSize,
			secondSize,
		);

		if (parent) {
			if (parent.first === target) parent.first = split;
			else parent.second = split;
			this.rebuildParents();
			this.notifyChildren(parent);
		} else {
			this._root = split;
			this.rebuildParents();
			this.emit({ kind: 'root' });
		}
		return split;
	}

	private detach(area: Area): boolean {
		const parent = this.parents.get(area);
		if (!parent)
			return false;

		const sibling = parent.first === area ? parent.second : parent.first;
		this.rectangles.delete(parent);
		for (const removed of this.areas(area))
			this.rectangles.delete(removed);

		const grandparent = this.parents.get(parent);
		if (grandparent) {
			if (grandparent.first === parent) grandparent.first = sibling;
			else grandparent.second = sibling;
			this.rebuildParents();
			this.notifyChildren(grandparent);
		} else {
			this._root = sibling;
			this.rebuildParents();
			this.emit({ kind: 'root' });
		}
		return true;
	}

	private notifyChildren(split: SplitArea) {
		split.update.dispatch(new ChildrenEvent());
		this.emit({ kind: 'structure', split });
	}

	private emit(change: WorkspaceChange) {
		this._version++;
		this.changes.dispatch(change);
	}

	private rebuildParents() {
		this.parents.clear();
		for (const area of this.areas()) {
			if (area instanceof SplitArea) {
				this.parents.set(area.first, area);
				this.parents.set(area.second, area);
			}
		}
	}

	private ensureUniqueLeafIds() {
		const ids = new Set<string>();
		for (const leaf of this.leaves()) {
			if (ids.has(leaf.id))
				throw new Error(`workspace has two leaves with id '${leaf.id}'`);
			ids.add(leaf.id);
		}
	}
}
