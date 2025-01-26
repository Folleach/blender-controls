import type { Position } from "../workspaces";

export interface IPositionAlignment {
	align: (position: Position) => Position;
}

export class ConstantPositionAlignment implements IPositionAlignment {
	private grid: number;

	constructor(grid: number) {
		this.grid = grid;
	}

	align(position: Position): Position {
		return {
			x: Math.round(position.x / this.grid) * this.grid,
			y: Math.round(position.y / this.grid) * this.grid,
		};
	}
}
