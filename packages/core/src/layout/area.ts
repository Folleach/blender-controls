import { Bus } from '../events.ts';
import type { Orientation, Rectangle } from '../geometry.ts';

export interface AreaDescriptor<D = unknown> {
	readonly type: string;
	readonly data: D;
}

export abstract class Area {}
export class ResizeEvent {}
export class ChildrenEvent {}
export type SplitEvent = ResizeEvent | ChildrenEvent;

export class SplitArea extends Area {
	readonly update: Bus<SplitEvent> = new Bus();

	constructor(
		public orientation: Orientation,
		public first: Area,
		public second: Area,
		public firstSize: number = 1,
		public secondSize: number = 1,
	) {
		super();
	}
}

export class RectangleEvent {
	constructor(readonly rectangle: Rectangle) {}
}

export class DescriptorEvent {
	constructor(
		readonly previous: AreaDescriptor,
		readonly replaced: boolean,
	) {}
}

export type LeafEvent = RectangleEvent | DescriptorEvent;

export class LeafArea<D = unknown> extends Area {
	readonly update: Bus<LeafEvent> = new Bus();

	descriptor: AreaDescriptor<D>;

	constructor(
		readonly id: string,
		descriptor: AreaDescriptor<D>,
	) {
		super();
		this.descriptor = descriptor;
	}
}
