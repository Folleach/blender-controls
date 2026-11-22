import { describe, expect, it } from 'vitest';
import { Corner, LeafArea, Orientation, Side, SplitArea, SplitGesture, Workspace, applyGesture } from '../src/index.ts';
import { hsplit, leaf } from './helpers.ts';

const build = () => {
	const a = leaf('a');
	const b = leaf('b');
	const workspace = new Workspace(hsplit(a, b));
	workspace.setRectangle(a, { x: 0, y: 0, width: 400, height: 600 });
	workspace.setRectangle(b, { x: 400, y: 0, width: 400, height: 600 });
	return { a, b, workspace };
};

describe('SplitGesture', () => {
	it('does nothing for a click on the corner', () => {
		const { a, workspace } = build();
		const gesture = new SplitGesture(workspace, a, Corner.TopLeft, { x: 1, y: 1 });

		expect(gesture.update({ x: 2, y: 1 })).toBeUndefined();
		expect(gesture.finish({ x: 2, y: 1 })).toBeUndefined();
	});

	it('splits horizontally when dragging mostly sideways from the top-left corner', () => {
		const { a, workspace } = build();
		const gesture = new SplitGesture(workspace, a, Corner.TopLeft, { x: 0, y: 0 });

		const preview = gesture.update({ x: 100, y: 20 });
		expect(preview?.operation).toBe('split');
		expect(preview?.line).toEqual({ x: 100, y: 0, width: 2, height: 600 });

		expect(gesture.finish({ x: 100, y: 20 })).toEqual({
			kind: 'split',
			target: a,
			orientation: Orientation.Horizontal,
			sizes: [100, 300],
		});
	});

	it('measures from the far edge for right and bottom corners', () => {
		const { a, workspace } = build();
		const gesture = new SplitGesture(workspace, a, Corner.BottomRight, { x: 400, y: 600 });

		const result = gesture.finish({ x: 390, y: 450 });

		expect(result).toMatchObject({ kind: 'split', orientation: Orientation.Vertical, sizes: [450, 150] });
	});

	it('joins when released over another leaf, on the closest side', () => {
		const { a, b, workspace } = build();
		const gesture = new SplitGesture(workspace, a, Corner.TopRight, { x: 400, y: 0 });

		const preview = gesture.update({ x: 700, y: 300 });
		expect(preview).toEqual({ operation: 'join', rectangle: { x: 700, y: 0, width: 100, height: 600 } });

		const result = gesture.finish({ x: 700, y: 300 });
		expect(result).toEqual({ kind: 'join', source: a, target: b, side: Side.Right, sizes: [300, 100] });
	});

	it('applyGesture moves the original leaf on join', () => {
		const { a, b, workspace } = build();
		const result = new SplitGesture(workspace, a, Corner.TopRight, { x: 400, y: 0 }).finish({ x: 700, y: 300 })!;

		applyGesture(workspace, result, () => leaf());

		const root = workspace.root as SplitArea;
		expect(root.first).toBe(b);
		expect(root.second).toBe(a);
	});

	it('applyGesture inserts the created area second on split', () => {
		const { a, workspace } = build();
		const result = new SplitGesture(workspace, a, Corner.TopLeft, { x: 0, y: 0 }).finish({ x: 20, y: 200 })!;
		let created: LeafArea | undefined;

		applyGesture(workspace, result, source => (created = leaf(source.descriptor.type)));

		const split = workspace.parent(a)!;
		expect(split.orientation).toBe(Orientation.Vertical);
		expect(split.first).toBe(a);
		expect(split.second).toBe(created);
		expect(created?.descriptor.type).toBe('a');
	});
});
