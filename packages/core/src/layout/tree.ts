import { Orientation } from '../geometry.ts';
import { createId } from '../identifier.ts';
import { LeafArea, SplitArea } from './area.ts';
import type { Area } from './area.ts';

// serializable
export type AreaTree<D = unknown> = AreaTreeLeaf<D> | AreaTreeSplit<D>;

export interface AreaTreeLeaf<D = unknown> {
	kind: 'leaf';
	id: string;
	type: string;
	data: D;
}

export interface AreaTreeSplit<D = unknown> {
	kind: 'split';
	orientation: Orientation;
	sizes: [number, number];
	children: [AreaTree<D>, AreaTree<D>];
}

export function leafTree<D = undefined>(type: string, data?: D, id: string = createId()): AreaTreeLeaf<D> {
	return { kind: 'leaf', id, type, data: data as D };
}

export function splitTree(
	orientation: Orientation,
	first: AreaTree,
	second: AreaTree,
	sizes: [number, number] = [1, 1],
): AreaTreeSplit {
	return { kind: 'split', orientation, sizes, children: [first, second] };
}

export function toTree(area: Area): AreaTree {
	if (area instanceof LeafArea)
		return { kind: 'leaf', id: area.id, type: area.descriptor.type, data: area.descriptor.data };
	if (area instanceof SplitArea) {
		return {
			kind: 'split',
			orientation: area.orientation,
			sizes: [area.firstSize, area.secondSize],
			children: [toTree(area.first), toTree(area.second)],
		};
	}
	throw new Error('failed to serialize: unknown area kind');
}

export interface FromTreeOptions {
	freshIds?: boolean;
}

export function fromTree(tree: AreaTree, options: FromTreeOptions = {}): Area {
	const ids = new Set<string>();
	const build = (node: unknown, path: string): Area => {
		if (!isObject(node))
			throw new Error(`invalid area tree at ${path}: expected an object`);
		if (node.kind === 'leaf') {
			if (typeof node.type !== 'string')
				throw new Error(`invalid area tree at ${path}: leaf type must be a string`);
			const id = options.freshIds || typeof node.id !== 'string' ? createId() : node.id;
			if (ids.has(id))
				throw new Error(`invalid area tree at ${path}: duplicate leaf id '${id}'`);
			ids.add(id);
			return new LeafArea(id, { type: node.type, data: node.data });
		}
		if (node.kind === 'split') {
			const { orientation, sizes, children } = node;
			if (orientation !== Orientation.Horizontal && orientation !== Orientation.Vertical)
				throw new Error(`invalid area tree at ${path}: unknown orientation '${String(orientation)}'`);
			if (!Array.isArray(sizes) || sizes.length !== 2 || !sizes.every(isWeight))
				throw new Error(`invalid area tree at ${path}: sizes must be two non-negative numbers`);
			if (!Array.isArray(children) || children.length !== 2)
				throw new Error(`invalid area tree at ${path}: a split must have two children`);
			return new SplitArea(
				orientation,
				build(children[0], `${path}.children[0]`),
				build(children[1], `${path}.children[1]`),
				sizes[0],
				sizes[1],
			);
		}
		throw new Error(`invalid area tree at ${path}: unknown kind '${String(node.kind)}'`);
	};
	return build(tree, 'root');
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isWeight(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
