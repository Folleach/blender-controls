import { Side, type Position, type Rectangle } from "../workspaces";

export function distanceToRectangle(point: Position, rect: Rectangle): number {
	const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
	const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
	return Math.sqrt(dx * dx + dy * dy);
}

export function closestSide(position: Position, rect: Rectangle): Side {
	const left = rect.x;
	const right = rect.x + rect.width;
	const top = rect.y;
	const bottom = rect.y + rect.height;

	const distanceToLeft = Math.abs(position.x - left);
	const distanceToRight = Math.abs(position.x - right);
	const distanceToTop = Math.abs(position.y - top);
	const distanceToBottom = Math.abs(position.y - bottom);

	const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);

	if (minDistance === distanceToLeft) return Side.Left;
	if (minDistance === distanceToRight) return Side.Right;
	if (minDistance === distanceToTop) return Side.Top;
	return Side.Bottom;
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

export function toLocal(spaceElement: HTMLElement | null, clientX: number, clientY: number, origin: Position) {
	const rect = spaceElement?.getBoundingClientRect() ?? { left: 0, top: 0 };

	return {
		x: clientX - rect.left - origin.x,
		y: clientY - rect.top - origin.y,
	};
}
