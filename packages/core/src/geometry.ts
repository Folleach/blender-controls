export enum Orientation {
	Horizontal = 0,
	Vertical = 1,
}

export enum Side {
	Left = 0,
	Top = 1,
	Right = 2,
	Bottom = 3,
}

export interface Position {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface Rectangle extends Position, Size { }

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function distanceToRectangle(point: Position, rect: Rectangle): number {
	const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
	const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
	return Math.sqrt(dx * dx + dy * dy);
}

export function closestSide(position: Position, rect: Rectangle): Side {
	const distanceToLeft = Math.abs(position.x - rect.x);
	const distanceToRight = Math.abs(position.x - (rect.x + rect.width));
	const distanceToTop = Math.abs(position.y - rect.y);
	const distanceToBottom = Math.abs(position.y - (rect.y + rect.height));

	const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);

	if (minDistance === distanceToLeft)
		return Side.Left;
	if (minDistance === distanceToRight)
		return Side.Right;
	if (minDistance === distanceToTop)
		return Side.Top;
	return Side.Bottom;
}

export function orientationOf(side: Side): Orientation {
	return side === Side.Left || side === Side.Right ? Orientation.Horizontal : Orientation.Vertical;
}

export function intersect(value: number, left: number, right: number): boolean {
	return value >= left && value <= right;
}

export function intersect2d(position: Position, rect: Rectangle): boolean {
	return intersect(position.x, rect.x, rect.x + rect.width) && intersect(position.y, rect.y, rect.y + rect.height);
}

export function rectanglesIntersect(a: Rectangle, b: Rectangle): boolean {
	return a.x <= b.x + b.width && b.x <= a.x + a.width && a.y <= b.y + b.height && b.y <= a.y + a.height;
}

export function rectangleFromPoints(a: Position, b: Position): Rectangle {
	return {
		x: Math.min(a.x, b.x),
		y: Math.min(a.y, b.y),
		width: Math.abs(b.x - a.x),
		height: Math.abs(b.y - a.y),
	};
}

export function compareRectangles(a: Rectangle | undefined, b: Rectangle | undefined): boolean {
	if (!a || !b)
		return a === b;
	return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
