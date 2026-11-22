import { describe, expect, it } from 'vitest';
import {
	ChildrenEvent,
	DescriptorEvent,
	LeafArea,
	Orientation,
	RectangleEvent,
	ResizeEvent,
	Side,
	SplitArea,
	Workspace,
} from '../src/index.ts';
import type { LeafEvent, SplitEvent } from '../src/index.ts';
import { changes, hsplit, leaf, record, vsplit } from './helpers.ts';

describe('Workspace.split', () => {
	it('splitting the root leaf replaces the root', () => {
		const a = leaf();
		const workspace = new Workspace(a);
		const log = changes(workspace);

		const b = leaf();
		workspace.split(a, b, { orientation: Orientation.Horizontal });

		const root = workspace.root as SplitArea;
		expect(root).toBeInstanceOf(SplitArea);
		expect(root.first).toBe(a);
		expect(root.second).toBe(b);
		expect(log.map(c => c.kind)).toEqual(['root', 'leaf-added']);
	});

	it('splitting a child keeps the root and notifies the parent once', () => {
		const a = leaf();
		const b = leaf();
		const root = hsplit(a, b);
		const workspace = new Workspace(root);
		const events = record<SplitEvent>(root.update);

		const c = leaf();
		const inserted = workspace.split(b, c, { orientation: Orientation.Vertical, before: true });

		expect(workspace.root).toBe(root);
		expect(events).toHaveLength(1);
		expect(events[0]).toBeInstanceOf(ChildrenEvent);
		expect(root.second).toBe(inserted);
		expect(inserted.first).toBe(c);
		expect(inserted.second).toBe(b);
		expect(workspace.parent(b)).toBe(inserted);
		expect(workspace.parent(inserted)).toBe(root);
	});

	it('applies the requested sizes', () => {
		const a = leaf();
		const workspace = new Workspace(a);

		const split = workspace.split(a, leaf(), { orientation: Orientation.Horizontal, sizes: [300, 100] });

		expect(split.firstSize).toBe(300);
		expect(split.secondSize).toBe(100);
	});

	it('rejects areas already in the tree and duplicate leaf ids', () => {
		const a = leaf();
		const b = leaf();
		const workspace = new Workspace(hsplit(a, b));

		expect(() => workspace.split(a, b, { orientation: Orientation.Vertical })).toThrow();
		expect(() =>
			workspace.split(a, new LeafArea(b.id, { type: 'x', data: undefined }), { orientation: Orientation.Vertical }),
		).toThrow();
	});

	it('announces every leaf of an inserted subtree', () => {
		const a = leaf();
		const workspace = new Workspace(a);
		const log = changes(workspace);

		const b = leaf();
		const c = leaf();
		workspace.split(a, vsplit(b, c), { orientation: Orientation.Horizontal });

		const added = log.flatMap(change => (change.kind === 'leaf-added' ? [change.leaf] : []));
		expect(added).toEqual([b, c]);
	});
});

describe('Workspace.remove', () => {
	it('removing a child of the root split promotes the sibling to root', () => {
		const a = leaf();
		const b = leaf();
		const workspace = new Workspace(hsplit(a, b));
		const log = changes(workspace);

		expect(workspace.remove(a)).toBe(true);

		expect(workspace.root).toBe(b);
		expect(workspace.parent(b)).toBeUndefined();
		expect(log.map(c => c.kind)).toEqual(['root', 'leaf-removed']);
	});

	it('collapses the parent and reports a structural change to the grandparent', () => {
		// regression: it used to report a resize, so views never re-rendered children
		const a = leaf();
		const b = leaf();
		const c = leaf();
		const root = hsplit(a, vsplit(b, c));
		const workspace = new Workspace(root);
		const events = record<SplitEvent>(root.update);

		workspace.remove(c);

		expect(root.first).toBe(a);
		expect(root.second).toBe(b);
		expect(workspace.parent(b)).toBe(root);
		expect(events).toHaveLength(1);
		expect(events[0]).toBeInstanceOf(ChildrenEvent);
	});

	it('announces every removed leaf of a subtree', () => {
		const a = leaf();
		const b = leaf();
		const c = leaf();
		const inner = vsplit(b, c);
		const workspace = new Workspace(hsplit(a, inner));
		const log = changes(workspace);

		workspace.remove(inner);

		const removed = log.flatMap(change => (change.kind === 'leaf-removed' ? [change.leaf] : []));
		expect(removed).toEqual([b, c]);
		expect(workspace.leaves()).toEqual([a]);
	});

	it('removing the root is a no-op', () => {
		const a = leaf();
		const workspace = new Workspace(a);
		expect(workspace.remove(a)).toBe(false);
		expect(workspace.root).toBe(a);
	});

	it('forgets the measured rectangles of the removed subtree', () => {
		const a = leaf();
		const b = leaf();
		const c = leaf();
		const inner = vsplit(b, c);
		const workspace = new Workspace(hsplit(a, inner));

		workspace.setRectangle(inner, { x: 0, y: 0, width: 100, height: 100 });
		workspace.setRectangle(c, { x: 0, y: 50, width: 100, height: 50 });
		workspace.remove(c);

		expect(workspace.rectangleOf(c)).toBeUndefined();
		expect(workspace.rectangleOf(inner)).toBeUndefined();
	});
});

describe('Workspace.move', () => {
	it('moves the same leaf object next to another leaf', () => {
		// regression: joining used to remove the area and create a new one, losing its state
		const a = leaf();
		const b = leaf();
		const c = leaf();
		const workspace = new Workspace(hsplit(a, vsplit(b, c)));
		const log = changes(workspace);

		expect(workspace.move(a, c, { side: Side.Left, sizes: [1, 3] })).toBe(true);

		const root = workspace.root as SplitArea;
		expect(root.first).toBe(b);
		const moved = root.second as SplitArea;
		expect(moved.orientation).toBe(Orientation.Horizontal);
		expect(moved.first).toBe(a);
		expect(moved.second).toBe(c);
		expect([moved.firstSize, moved.secondSize]).toEqual([1, 3]);
		expect(log.some(change => change.kind === 'leaf-added' || change.kind === 'leaf-removed')).toBe(false);
	});

	it('can move a leaf next to its own sibling', () => {
		const a = leaf();
		const b = leaf();
		const workspace = new Workspace(hsplit(a, b));

		workspace.move(a, b, { side: Side.Bottom });

		const root = workspace.root as SplitArea;
		expect(root.orientation).toBe(Orientation.Vertical);
		expect(root.first).toBe(b);
		expect(root.second).toBe(a);
	});

	it('refuses to move the only leaf or onto itself', () => {
		const a = leaf();
		const single = new Workspace(a);
		expect(single.move(a, a, { side: Side.Left })).toBe(false);

		const b = leaf();
		const c = leaf();
		const workspace = new Workspace(hsplit(b, c));
		expect(workspace.move(b, b, { side: Side.Left })).toBe(false);
	});
});

describe('Workspace descriptors', () => {
	it('replace notifies the leaf and the workspace as a replacement', () => {
		const a = leaf('first');
		const workspace = new Workspace(a);
		const events = record<LeafEvent>(a.update);
		const log = changes(workspace);

		workspace.replace(a, { type: 'second', data: 42 });

		expect(a.descriptor).toEqual({ type: 'second', data: 42 });
		expect(events[0]).toBeInstanceOf(DescriptorEvent);
		expect((events[0] as DescriptorEvent).replaced).toBe(true);
		expect(log).toEqual([{ kind: 'descriptor', leaf: a, previous: { type: 'first', data: undefined }, replaced: true }]);
	});

	it('setData keeps the type and is not a replacement', () => {
		const a = leaf('kind', { count: 1 });
		const workspace = new Workspace(a);
		const log = changes(workspace);

		workspace.setData(a, { count: 2 });

		expect(a.descriptor).toEqual({ type: 'kind', data: { count: 2 } });
		expect(log[0]).toMatchObject({ kind: 'descriptor', replaced: false });
	});
});

describe('Workspace rectangles', () => {
	it('never mutates split sizes', () => {
		const root = hsplit(leaf(), leaf(), 1, 3);
		const workspace = new Workspace(root);

		workspace.setRectangle(root, { x: 0, y: 0, width: 800, height: 600 });

		expect([root.firstSize, root.secondSize]).toEqual([1, 3]);
		expect(workspace.rectangleOf(root)).toEqual({ x: 0, y: 0, width: 800, height: 600 });
	});

	it('dispatches RectangleEvent on leaves only when the rectangle changes', () => {
		const a = leaf();
		const workspace = new Workspace(a);
		const events = record<LeafEvent>(a.update);

		workspace.setRectangle(a, { x: 1, y: 2, width: 3, height: 4 });
		workspace.setRectangle(a, { x: 1, y: 2, width: 3, height: 4 });

		expect(events).toHaveLength(1);
		expect((events[0] as RectangleEvent).rectangle).toEqual({ x: 1, y: 2, width: 3, height: 4 });
	});

	it('finds the leaf under a point', () => {
		const a = leaf();
		const b = leaf();
		const workspace = new Workspace(hsplit(a, b));
		workspace.setRectangle(a, { x: 0, y: 0, width: 50, height: 100 });
		workspace.setRectangle(b, { x: 50, y: 0, width: 50, height: 100 });

		expect(workspace.leafAt({ x: 10, y: 10 })).toBe(a);
		expect(workspace.leafAt({ x: 60, y: 10 })).toBe(b);
		expect(workspace.leafAt({ x: 200, y: 10 })).toBeUndefined();
	});
});

describe('Workspace.setSizes', () => {
	it('dispatches a resize only on actual change', () => {
		const root = hsplit(leaf(), leaf());
		const workspace = new Workspace(root);
		const events = record<SplitEvent>(root.update);

		workspace.setSizes(root, 1, 1);
		workspace.setSizes(root, 2, 1);

		expect(events).toHaveLength(1);
		expect(events[0]).toBeInstanceOf(ResizeEvent);
	});
});

describe('Workspace.findSiblingContainer', () => {
	//  root (H)
	//  ├── left (V)
	//  │   ├── a
	//  │   └── b
	//  └── c
	const build = () => {
		const a = leaf();
		const b = leaf();
		const c = leaf();
		const left = vsplit(a, b);
		const root = hsplit(left, c);
		return { a, b, c, left, root, workspace: new Workspace(root) };
	};

	it('finds the vertical container below a top child', () => {
		const { a, left, workspace } = build();
		expect(workspace.findSiblingContainer(a, Side.Bottom)).toBe(left);
	});

	it('walks up past containers with the wrong orientation', () => {
		const { a, root, workspace } = build();
		expect(workspace.findSiblingContainer(a, Side.Right)).toBe(root);
	});

	it('returns undefined when no container matches', () => {
		const { a, workspace } = build();
		expect(workspace.findSiblingContainer(a, Side.Top)).toBeUndefined();
		expect(workspace.findSiblingContainer(a, Side.Left)).toBeUndefined();
	});

	it('returns the area itself when it is already a split', () => {
		const { left, workspace } = build();
		expect(workspace.findSiblingContainer(left, Side.Top)).toBe(left);
	});
});

describe('Workspace.swapTree', () => {
	it('swaps the two leaves adjacent to the separator', () => {
		const a = leaf();
		const b = leaf();
		const c = leaf();
		const inner = hsplit(a, b);
		const root = hsplit(inner, c);
		const workspace = new Workspace(root);

		workspace.swapTree(root);

		expect(inner.second).toBe(c);
		expect(root.second).toBe(b);
		expect(workspace.parent(c)).toBe(inner);
		expect(workspace.parent(b)).toBe(root);
	});

	it('swaps the direct children of a simple split and notifies once', () => {
		const a = leaf();
		const b = leaf();
		const root = hsplit(a, b);
		const workspace = new Workspace(root);
		const events = record<SplitEvent>(root.update);

		workspace.swapTree(root);

		expect(root.first).toBe(b);
		expect(root.second).toBe(a);
		expect(events).toHaveLength(1);
	});
});

describe('Workspace bookkeeping', () => {
	it('enumerates areas depth-first and leaves in visual order', () => {
		const a = leaf();
		const b = leaf();
		const c = leaf();
		const inner = vsplit(b, c);
		const root = hsplit(a, inner);
		const workspace = new Workspace(root);

		expect([...workspace.areas()]).toEqual([root, a, inner, b, c]);
		expect(workspace.leaves()).toEqual([a, b, c]);
		expect(workspace.findLeaf(b.id)).toBe(b);
	});

	it('increments the version on every change', () => {
		const a = leaf();
		const workspace = new Workspace(a);
		const before = workspace.version;

		workspace.split(a, leaf(), { orientation: Orientation.Horizontal });

		expect(workspace.version).toBeGreaterThan(before);
	});

	it('rejects trees with duplicate leaf ids', () => {
		const a = leaf();
		expect(() => new Workspace(hsplit(a, new LeafArea(a.id, { type: 'x', data: undefined })))).toThrow();
	});
});
