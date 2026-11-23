import type { Position } from './geometry.ts';

export interface PositionAlignment {
	align(position: Position): Position;
}

export class GridAlignment implements PositionAlignment {
	constructor(private readonly grid: number) {}

	align(position: Position): Position {
		return {
			x: Math.round(position.x / this.grid) * this.grid,
			y: Math.round(position.y / this.grid) * this.grid,
		};
	}
}

export class DragSession {
	private readonly origin: Position;
	private readonly pointer: Position;

	constructor(origin: Position, pointer: Position, private readonly alignment?: PositionAlignment) {
		this.origin = { ...origin };
		this.pointer = { ...pointer };
	}

	at(pointer: Position): Position {
		const position = {
			x: this.origin.x + (pointer.x - this.pointer.x),
			y: this.origin.y + (pointer.y - this.pointer.y),
		};
		return this.alignment ? this.alignment.align(position) : position;
	}
}
