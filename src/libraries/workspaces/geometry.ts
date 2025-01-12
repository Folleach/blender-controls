import type { Position, Rectangle } from ".";

export function intersect(value: number, left: number, right: number) {
	return value >= left && value <= right;
}

export function intersect2d(position: Position, rect: Rectangle) {
	return intersect(position.x, rect.x, rect.x + rect.width) && intersect(position.y, rect.y, rect.y + rect.height);
}
