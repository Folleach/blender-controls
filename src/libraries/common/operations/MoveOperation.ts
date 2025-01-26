import type { IPositionAlignment } from "@/libraries/common/alignment";
import type { Position } from "@/libraries/workspaces";

export class MoveOperation {
	private set: (position: Position) => void;
	private end: (() => void) | undefined;
	private b1: Position = { x: 0, y: 0 };
	private b2: Position = { x: 0, y: 0 };
	private move: (e: PointerEvent) => void;
	private up: () => void;
	private alignment: IPositionAlignment | undefined;

	constructor(set: (position: Position) => void, end?: (() => void) | undefined, alignment?: IPositionAlignment | undefined) {
		this.set = set;
		this.end = end;
		this.alignment = alignment;
		this.move = this.handlePointerMove.bind(this);
		this.up = this.handlePointerUp.bind(this);
	}

	perform(e: PointerEvent, position: Position) {
		this.b2.x = position.x;
		this.b2.y = position.y;
		this.b1.x = e.clientX;
		this.b1.y = e.clientY;

		document.addEventListener("pointermove", this.move);
		document.addEventListener("pointerup", this.up);
	}

	private handlePointerMove(e: PointerEvent) {
		let position = {
			x: this.b2.x + (e.clientX - this.b1.x),
			y: this.b2.y + (e.clientY - this.b1.y),
		};
		if (this.alignment) position = this.alignment.align(position);
		this.set(position);
	}

	private handlePointerUp() {
		document.removeEventListener("pointermove", this.move);
		document.removeEventListener("pointerup", this.up);
		if (this.end) this.end();
	}
}
