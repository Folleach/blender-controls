import { Orientation, clamp } from '../geometry.ts';
import type { Side } from '../geometry.ts';
import { SplitArea } from './area.ts';
import type { Area } from './area.ts';
import type { Workspace } from './workspace.ts';

interface ResizeEntry {
	split: SplitArea;
	side: 'first' | 'second';
	initial: number;
	scale: number;
	sign: 1 | -1;
}

export class SplitResizeSession {
	private readonly entries: ResizeEntry[] = [];
	private readonly minDelta: number;
	private readonly maxDelta: number;

	constructor(
		private readonly workspace: Workspace,
		readonly target: SplitArea,
	) {
		const scale = this.scaleOf(target);
		this.entries.push(
			{ split: target, side: 'first', initial: target.firstSize, scale, sign: 1 },
			{ split: target, side: 'second', initial: target.secondSize, scale, sign: -1 },
		);
		this.minDelta = -target.firstSize / scale;
		this.maxDelta = target.secondSize / scale;

		this.collect(target.first, target.orientation, 'second', 1);
		this.collect(target.second, target.orientation, 'first', -1);
	}

	static forSide(workspace: Workspace, area: Area, side: Side): SplitResizeSession | undefined {
		const target = workspace.findSiblingContainer(area, side);
		return target ? new SplitResizeSession(workspace, target) : undefined;
	}

	apply(deltaPixels: number): void {
		const delta = clamp(deltaPixels, this.minDelta, this.maxDelta);
		const next = new Map<SplitArea, [number, number]>();
		for (const entry of this.entries) {
			const sizes = next.get(entry.split) ?? [entry.split.firstSize, entry.split.secondSize];
			sizes[entry.side === 'first' ? 0 : 1] = Math.max(entry.initial + entry.sign * delta * entry.scale, 0);
			next.set(entry.split, sizes);
		}
		for (const [split, [first, second]] of next)
			this.workspace.setSizes(split, first, second);
	}

	private collect(area: Area, orientation: Orientation, side: 'first' | 'second', sign: 1 | -1) {
		if (!(area instanceof SplitArea))
			return;
		if (area.orientation !== orientation) {
			this.collect(area.first, orientation, side, sign);
			this.collect(area.second, orientation, side, sign);
			return;
		}
		const initial = side === 'first' ? area.firstSize : area.secondSize;
		this.entries.push({ split: area, side, initial, scale: this.scaleOf(area), sign });
		this.collect(side === 'first' ? area.first : area.second, orientation, side, sign);
	}

	private scaleOf(split: SplitArea): number {
		const rect = this.workspace.rectangleOf(split);
		const extent = split.orientation === Orientation.Horizontal ? rect?.width : rect?.height;
		if (!extent || extent <= 0)
			return 1;
		return (split.firstSize + split.secondSize) / extent;
	}
}
