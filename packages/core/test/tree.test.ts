import { describe, expect, it } from 'vitest';
import { LeafArea, Orientation, SplitArea, fromTree, leafTree, splitTree, toTree } from '../src/index.ts';
import type { AreaTree } from '../src/index.ts';

describe('area trees', () => {
	const tree = splitTree(Orientation.Horizontal, leafTree('a', { x: 1 }, 'id-a'), leafTree('b', undefined, 'id-b'), [1, 2]);

	it('round-trips through areas', () => {
		const area = fromTree(tree) as SplitArea;

		expect(area).toBeInstanceOf(SplitArea);
		expect(area.first).toBeInstanceOf(LeafArea);
		expect((area.first as LeafArea).descriptor).toEqual({ type: 'a', data: { x: 1 } });
		expect(toTree(area)).toEqual(tree);
	});

	it('survives JSON', () => {
		const restored = fromTree(JSON.parse(JSON.stringify(tree)) as AreaTree);
		expect(toTree(restored)).toEqual(JSON.parse(JSON.stringify(tree)));
	});

	it('can assign fresh ids', () => {
		const area = fromTree(tree, { freshIds: true }) as SplitArea;
		expect((area.first as LeafArea).id).not.toBe('id-a');
	});

	it.each([
		['null', null],
		['unknown kind', { kind: 'nope' }],
		['leaf without type', { kind: 'leaf', id: 'x' }],
		['bad orientation', { kind: 'split', orientation: 7, sizes: [1, 1], children: [tree, tree] }],
		['negative size', { kind: 'split', orientation: 0, sizes: [-1, 1], children: [leafTree('a'), leafTree('b')] }],
		['one child', { kind: 'split', orientation: 0, sizes: [1, 1], children: [leafTree('a')] }],
		['duplicate ids', splitTree(Orientation.Vertical, leafTree('a', 1, 'same'), leafTree('b', 2, 'same'))],
	])('rejects %s', (_, input) => {
		expect(() => fromTree(input as AreaTree)).toThrow(/invalid area tree/);
	});
});
