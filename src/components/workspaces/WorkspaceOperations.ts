import {
	AreaSize,
	ContainerArea,
	AreaUpdateType,
	INIT_AREA_ID,
	LeafArea,
	Orientation,
	Side,
	WorkspaceOperation,
	type IArea,
	type Position,
	type Rectangle,
	type Workspace,
} from "@/libraries/workspaces";
import type { IOverlayProps } from "./WorkspaceAreaProps";
import { closestSide } from "@/libraries/common/geometry";

const start = { x: 0, y: 0 };
const last = { x: 0, y: 0 };
let context: Rectangle | undefined = undefined;
const workspaceRectangles: Map<IArea, Rectangle> = new Map();
const areaSizes: Map<IArea, AreaSize[]> = new Map();
let perform: (e: PointerEvent) => void;
let end: (() => void) | undefined;

export function resizeArea(e: PointerEvent, workspace: Workspace, area: IArea, side?: Side) {
	contexted(last, e);
	const container = area instanceof ContainerArea ? area : workspace.findSiblingContainer(area, side);
	if (!container) {
		console.error("failed to resize, this is not container", container);
		return;
	}
	const origArea = areaSizes.get(container);
	if (!origArea) return;

	const delta = getDelta();

	let newSize: Position = {
		x: origArea[0].size + delta.x,
		y: origArea[1].size - delta.x,
	};
	if (container.orientation === Orientation.Vertical) {
		newSize = {
			x: origArea[0].size + delta.y,
			y: origArea[1].size - delta.y,
		};
	}

	container.leftSize.size = newSize.x;
	container.rightSize.size = newSize.y;

	resizeParts(container.left, delta, container.orientation, false);
	resizeParts(container.right, { x: -delta.x, y: -delta.y }, container.orientation, true);

	container.update.push(AreaUpdateType.Resize);
}

function resizeParts(area: IArea, delta: Position, orientation: Orientation, left: boolean) {
	if (area instanceof ContainerArea) {
		if (area.orientation !== orientation) {
			resizeParts(area.left, delta, orientation, left);
			resizeParts(area.right, delta, orientation, left);
			return;
		}
		const item = left ? area.leftSize : area.rightSize;
		const orig = areaSizes.get(area)![left ? 0 : 1];
		item.size = orig.size + (orientation === Orientation.Horizontal ? delta.x : delta.y);
		area.update.push(AreaUpdateType.Resize);
		resizeParts(left ? area.left : area.right, delta, orientation, left);
	}
}

export function continuesSplit(
	start: PointerEvent,
	current: PointerEvent,
	workspace: Workspace,
	right: boolean,
	bottom: boolean,
): IOverlayProps | undefined {
	contexted(last, current);
	const firstArea = workspace.findArea(start, (x) => x instanceof LeafArea);
	const area = workspace.findArea(last, (x) => x instanceof LeafArea);
	if (!area) {
		return undefined;
	}

	const areaSize = workspace.findSize(area) ?? { x: 10, y: 10, width: 0, height: 0 };

	const delta = { x: right ? start.x - last.x : last.x - start.x, y: bottom ? start.y - last.y : last.y - start.y };
	const orientation = delta.x > delta.y ? Orientation.Horizontal : Orientation.Vertical;

	if (area !== firstArea) {
		return { rectangle: getNearestRectangle(areaSize) };
	}

	return {
		orientation,
		rectangle: areaSize,
		size:
			orientation === Orientation.Horizontal
				? areaSize.width - (right ? delta.x : areaSize.width - delta.x)
				: areaSize.height - (bottom ? delta.y : areaSize.height - delta.y),
		operation: area === firstArea ? WorkspaceOperation.Split : WorkspaceOperation.Join,
	};
}

export function finishSplit(workspace: Workspace, right: boolean, bottom: boolean) {
	const firstArea = workspace.findArea({ x: start.x + (context?.x ?? 0), y: start.y + (context?.y ?? 0) }, (x) => x instanceof LeafArea);
	const area = workspace.findArea(last, (x) => x instanceof LeafArea);
	if (!area) {
		console.error("area not found");
		return;
	}

	const areaSize = workspace.findSize(area) ?? { x: 10, y: 10, width: 0, height: 0 };

	if (area !== firstArea) {
		if (!firstArea) return;
		const side = closestSide(last, areaSize);
		const rect = getNearestRectangle(areaSize);
		workspace.remove(firstArea);
		let first: number = 0;
		let second: number = 0;
		if (side === Side.Left) {
			first = rect.width;
			second = areaSize.width - rect.width;
		}
		if (side === Side.Top) {
			first = rect.height;
			second = areaSize.height - rect.height;
		}
		if (side === Side.Right) {
			second = rect.width;
			first = areaSize.width - rect.width;
		}
		if (side === Side.Bottom) {
			second = rect.height;
			first = areaSize.height - rect.height;
		}
		workspace.split(area, {
			appendArea: firstArea,
			firstSize: new AreaSize(first, "fr"),
			secondSize: new AreaSize(second, "fr"),
			orientation: side === Side.Top || side === Side.Bottom ? Orientation.Vertical : Orientation.Horizontal,
			left: side === Side.Left || side === Side.Top,
		});
		return;
	}
	const delta = { x: right ? start.x - last.x : last.x - start.x, y: bottom ? start.y - last.y : last.y - start.y };
	const orientation = delta.x > delta.y ? Orientation.Horizontal : Orientation.Vertical;

	let firstSize = 0;
	let secondSize = 0;

	if (orientation === Orientation.Horizontal) {
		secondSize = right ? delta.x : areaSize.width - delta.x;
		firstSize = areaSize.width - secondSize;
	} else {
		secondSize = bottom ? delta.y : areaSize.height - delta.y;
		firstSize = areaSize.height - secondSize;
	}

	workspace.split(area, {
		appendArea: new LeafArea<string>(INIT_AREA_ID, "none"),
		firstSize: new AreaSize(firstSize, "fr"),
		secondSize: new AreaSize(secondSize, "fr"),
		orientation: orientation,
		left: false,
	});
}

export function capture(
	e: PointerEvent,
	workspace: Workspace,
	c: Rectangle | undefined,
	f: (e: PointerEvent) => void,
	endPerform: (() => void) | undefined = undefined,
) {
	context = c;
	contexted(start, e);
	normalizeSizes(workspace);
	workspaceRectangles.clear();
	for (const rect of workspace.rectangles) workspaceRectangles.set(rect[0], structuredClone(rect[1]));
	areaSizes.clear();
	for (const area of workspace.enumerateAreas()) {
		if (area instanceof ContainerArea) areaSizes.set(area, [structuredClone(area.leftSize), structuredClone(area.rightSize)]);
	}
	perform = f;
	end = endPerform;
	window.addEventListener("pointermove", perform);
	window.addEventListener("pointerup", unlock);
}

function getDelta(): Position {
	return { x: last.x - start.x, y: last.y - start.y };
}

function getNearestRectangle(areaSize: Rectangle): Rectangle {
	const side = closestSide(last, areaSize);
	if (side === Side.Bottom)
		return { ...areaSize, y: last.y + (context?.y ?? 0), height: areaSize.height - (last.y - areaSize.y) - (context?.y ?? 0) };
	if (side === Side.Right) return { ...areaSize, x: last.x, width: areaSize.width - (last.x - areaSize.x) };
	if (side === Side.Top) return { ...areaSize, y: areaSize.y, height: last.y - areaSize.y + (context?.y ?? 0) };
	if (side === Side.Left) return { ...areaSize, x: areaSize.x, width: last.x - areaSize.x };
	return { x: 0, y: 0, width: 0, height: 0 };
}

function normalizeSizes(workspace: Workspace) {
	for (const area of workspace.enumerateAreas()) {
		const container = area instanceof ContainerArea ? <ContainerArea>area : undefined;
		if (!container) continue;
		const left = workspace.findSize(container.left);
		const right = workspace.findSize(container.right);
		if (!left || !right) continue;
		container.leftSize = new AreaSize(container.orientation === Orientation.Horizontal ? left.width : left.height, "fr");
		container.rightSize = new AreaSize(container.orientation === Orientation.Horizontal ? right.width : right.height, "fr");
		container.update.push(AreaUpdateType.Resize);
	}
}

function unlock() {
	window.removeEventListener("pointermove", perform);
	if (end) end();
	end = undefined;
}

function contexted(position: Position, e: PointerEvent) {
	const x = e.pageX - (context?.x ?? 0);
	const y = e.pageY - (context?.y ?? 0);
	if (x < 0 || y < 0) {
		return;
	}
	position.x = x;
	position.y = y;
}

window.addEventListener("pointerup", () => unlock);
// window.addEventListener("pointermove", (e) => console.log("pointer move here", { x: e.pageX, y: e.pageY }));
// window.addEventListener("pointermove", (e) => console.log("currect context", context));
