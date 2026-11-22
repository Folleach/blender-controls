import { Orientation, Side, clamp, closestSide } from '../geometry.ts';
import type { Position, Rectangle } from '../geometry.ts';
import type { Area, LeafArea } from './area.ts';
import type { Workspace } from './workspace.ts';

export enum Corner {
	TopLeft = 0b00,
	TopRight = 0b01,
	BottomLeft = 0b10,
	BottomRight = 0b11,
}

const RIGHT = 0b01;
const BOTTOM = 0b10;

export type GestureResult =
	| {
		readonly kind: 'split';
		readonly target: LeafArea;
		readonly orientation: Orientation;
		readonly sizes: readonly [number, number];
	}
	| {
		readonly kind: 'join';
		readonly source: LeafArea;
		readonly target: LeafArea;
		readonly side: Side;
		readonly sizes: readonly [number, number];
	};

export interface GesturePreview {
	readonly operation: GestureResult['kind'];
	readonly rectangle: Rectangle;
	readonly line?: Rectangle;
}

export interface SplitGestureOptions {
	threshold?: number;
	lineWidth?: number;
}

export class SplitGesture {
	private readonly threshold: number;
	private readonly lineWidth: number;

	constructor(
		private readonly workspace: Workspace,
		readonly source: LeafArea,
		readonly corner: Corner,
		private readonly start: Position,
		options: SplitGestureOptions = {},
	) {
		this.threshold = options.threshold ?? 8;
		this.lineWidth = options.lineWidth ?? 2;
	}

	update(pointer: Position): GesturePreview | undefined {
		return this.evaluate(pointer)?.preview;
	}

	finish(pointer: Position): GestureResult | undefined {
		return this.evaluate(pointer)?.result;
	}

	private evaluate(pointer: Position): { result: GestureResult; preview: GesturePreview } | undefined {
		const target = this.workspace.leafAt(pointer);
		const rect = target && this.workspace.rectangleOf(target);
		if (!target || !rect)
			return undefined;
		return target === this.source ? this.split(pointer, target, rect) : this.join(pointer, target, rect);
	}

	private split(pointer: Position, target: LeafArea, rect: Rectangle) {
		const right = (this.corner & RIGHT) !== 0;
		const bottom = (this.corner & BOTTOM) !== 0;
		const delta = {
			x: right ? this.start.x - pointer.x : pointer.x - this.start.x,
			y: bottom ? this.start.y - pointer.y : pointer.y - this.start.y,
		};
		if (Math.max(delta.x, delta.y) < this.threshold)
			return undefined;

		const orientation = delta.x > delta.y ? Orientation.Horizontal : Orientation.Vertical;
		const horizontal = orientation === Orientation.Horizontal;
		const extent = horizontal ? rect.width : rect.height;
		const along = horizontal ? delta.x : delta.y;
		const fromEnd = horizontal ? right : bottom;
		const first = clamp(fromEnd ? extent - along : along, 0, extent);
		const second = extent - first;
		if (first < this.threshold || second < this.threshold)
			return undefined;

		const line: Rectangle = horizontal
			? { x: rect.x + first, y: rect.y, width: this.lineWidth, height: rect.height }
			: { x: rect.x, y: rect.y + first, width: rect.width, height: this.lineWidth };
		return {
			result: { kind: 'split', target, orientation, sizes: [first, second] } as const,
			preview: { operation: 'split', rectangle: { ...rect }, line } as const,
		};
	}

	private join(pointer: Position, target: LeafArea, rect: Rectangle) {
		const side = closestSide(pointer, rect);
		const right = rect.x + rect.width;
		const bottom = rect.y + rect.height;
		let piece: Rectangle;
		let sizes: [number, number];
		switch (side) {
			case Side.Left:
				piece = { ...rect, width: pointer.x - rect.x };
				sizes = [piece.width, rect.width - piece.width];
				break;
			case Side.Right:
				piece = { ...rect, x: pointer.x, width: right - pointer.x };
				sizes = [rect.width - piece.width, piece.width];
				break;
			case Side.Top:
				piece = { ...rect, height: pointer.y - rect.y };
				sizes = [piece.height, rect.height - piece.height];
				break;
			case Side.Bottom:
				piece = { ...rect, y: pointer.y, height: bottom - pointer.y };
				sizes = [rect.height - piece.height, piece.height];
				break;
		}
		if (sizes[0] <= 0 || sizes[1] <= 0)
			return undefined;
		return {
			result: { kind: 'join', source: this.source, target, side, sizes } as const,
			preview: { operation: 'join', rectangle: piece } as const,
		};
	}
}

export function applyGesture(
	workspace: Workspace,
	result: GestureResult,
	createArea: (source: LeafArea) => Area,
): void {
	if (result.kind === 'split') {
		workspace.split(result.target, createArea(result.target), {
			orientation: result.orientation,
			sizes: result.sizes,
		});
		return;
	}
	workspace.move(result.source, result.target, { side: result.side, sizes: result.sizes });
}
