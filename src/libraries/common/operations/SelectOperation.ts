import type { Position, Rectangle } from "@/libraries/workspaces";
import { toLocal } from "../geometry";

export class SelectOperation {
	private set: (rect: Rectangle) => void;
	private element: HTMLElement | null;
	private origin: Position = { x: 0, y: 0 };
	private start: Position = { x: 0, y: 0 };
	private move: (e: PointerEvent) => void;
	private up: () => void;
	private endOperation: (() => void) | undefined;

	constructor(element: HTMLElement | null, set: (rect: Rectangle) => void, endOperation?: () => void) {
		this.element = element;
		this.set = set;
		this.endOperation = endOperation;
		this.move = this.handlePointerMove.bind(this);
		this.up = this.handlePointerUp.bind(this);
	}

	perform(e: PointerEvent, position: Position) {
		this.origin.x = position.x;
		this.origin.y = position.y;
		const local = toLocal(this.element, e.clientX, e.clientY, this.origin);
		this.start.x = local.x;
		this.start.y = local.y;

		document.addEventListener("pointermove", this.move);
		document.addEventListener("pointerup", this.up);
	}

	private handlePointerMove(e: PointerEvent) {
		window.getSelection()?.removeAllRanges();
		const end = toLocal(this.element, e.clientX, e.clientY, this.origin);
		const x = Math.min(this.start.x, end.x);
		const y = Math.min(this.start.y, end.y);
		const width = Math.abs(end.x - this.start.x);
		const height = Math.abs(end.y - this.start.y);
		this.set({ x, y, width, height });
	}

	private handlePointerUp() {
		document.removeEventListener("pointermove", this.move);
		document.removeEventListener("pointerup", this.up);
		if (this.endOperation) this.endOperation();
	}
}
