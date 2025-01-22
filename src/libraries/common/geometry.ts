import type { Position, Rectangle } from "../workspaces";

export function distanceToRectangle(point: Position, rect: Rectangle): number {
	const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
	const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
	return Math.sqrt(dx * dx + dy * dy);
}

export function domToRect(box: DOMRect | undefined): Rectangle | undefined {
	if (!box) return undefined;
	return {
		x: box.left,
		y: box.top,
		width: box.width,
		height: box.height,
	};
}
