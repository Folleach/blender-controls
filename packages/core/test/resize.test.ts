import { describe, expect, it } from 'vitest';
import { Orientation, ResizeEvent, Side, SplitArea, SplitResizeSession, Workspace } from '../src/index.ts';
import type { SplitEvent } from '../src/index.ts';
import { hsplit, leaf, record, vsplit } from './helpers.ts';

const measured = (root: SplitArea, width = 800, height = 600) => {
	const workspace = new Workspace(root);
	workspace.setRectangle(root, { x: 0, y: 0, width, height });
	return workspace;
};

describe('SplitResizeSession', () => {
	it('converts a pixel delta through the measured extent of the split', () => {
		const root = hsplit(leaf(), leaf());
		const workspace = measured(root);

		new SplitResizeSession(workspace, root).apply(200);

		expect(root.firstSize).toBeCloseTo(1.5);
		expect(root.secondSize).toBeCloseTo(0.5);
	});

	it('keeps the sum constant and dispatches one ResizeEvent per apply', () => {
		const root = hsplit(leaf(), leaf(), 1, 3);
		const workspace = measured(root, 400, 100);
		const events = record<SplitEvent>(root.update);

		const session = new SplitResizeSession(workspace, root);
		session.apply(100);
		expect(root.firstSize + root.secondSize).toBeCloseTo(4);
		expect(events).toHaveLength(1);
		expect(events[0]).toBeInstanceOf(ResizeEvent);

		session.apply(150);
		expect(events).toHaveLength(2);
	});

	it('applies deltas relative to the state at drag start', () => {
		const root = hsplit(leaf(), leaf());
		const workspace = measured(root);

		const session = new SplitResizeSession(workspace, root);
		session.apply(100);
		session.apply(200);

		expect(root.firstSize).toBeCloseTo(1.5);
		expect(root.secondSize).toBeCloseTo(0.5);
	});

	it('clamps so neither side collapses below zero', () => {
		const root = hsplit(leaf(), leaf());
		const workspace = measured(root);

		const session = new SplitResizeSession(workspace, root);
		session.apply(10_000);
		expect(root.firstSize).toBeCloseTo(2);
		expect(root.secondSize).toBeCloseTo(0);

		session.apply(-10_000);
		expect(root.firstSize).toBeCloseTo(0);
		expect(root.secondSize).toBeCloseTo(2);
	});

	it('uses height as the extent for vertical splits', () => {
		const root = vsplit(leaf(), leaf());
		const workspace = measured(root);

		new SplitResizeSession(workspace, root).apply(150);

		expect(root.firstSize).toBeCloseTo(1.5);
		expect(root.secondSize).toBeCloseTo(0.5);
	});

	it('lets a nested same-orientation split absorb the delta at the edge facing the separator', () => {
		const inner = hsplit(leaf(), leaf());
		const root = hsplit(inner, leaf());
		const workspace = measured(root);
		workspace.setRectangle(inner, { x: 0, y: 0, width: 400, height: 600 });

		new SplitResizeSession(workspace, root).apply(100);

		expect(root.firstSize).toBeCloseTo(1.25);
		expect(root.secondSize).toBeCloseTo(0.75);
		const firstPixels = (500 * inner.firstSize) / (inner.firstSize + inner.secondSize);
		expect(firstPixels).toBeCloseTo(200);
	});

	it('descends into cross-orientation splits without touching them', () => {
		const vertical = vsplit(leaf(), leaf(), 1, 2);
		const root = hsplit(vertical, leaf());
		const workspace = measured(root);
		workspace.setRectangle(vertical, { x: 0, y: 0, width: 400, height: 600 });

		new SplitResizeSession(workspace, root).apply(100);

		expect([vertical.firstSize, vertical.secondSize]).toEqual([1, 2]);
	});

	it('falls back to a 1:1 pixel scale when the split was never measured', () => {
		const root = hsplit(leaf(), leaf(), 100, 100);
		const workspace = new Workspace(root);

		new SplitResizeSession(workspace, root).apply(50);

		expect(root.firstSize).toBeCloseTo(150);
		expect(root.secondSize).toBeCloseTo(50);
	});

	it('finds the separator on a side of a leaf', () => {
		const a = leaf();
		const root = new SplitArea(Orientation.Horizontal, a, leaf());
		const workspace = measured(root);

		expect(SplitResizeSession.forSide(workspace, a, Side.Right)?.target).toBe(root);
		expect(SplitResizeSession.forSide(workspace, a, Side.Left)).toBeUndefined();
	});
});
