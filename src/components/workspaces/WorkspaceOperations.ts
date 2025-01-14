import {
	AreaSize,
	ContainerArea,
	LeafArea,
	Orientation,
	WorkspaceOperation,
	type IArea,
	type Position,
	type Rectangle,
	type Side,
	type Workspace,
} from "@/libraries/workspaces";
import type { IOverlayProps } from "./WorkspaceAreaProps";

const start = { x: 0, y: 0 };
const last = { x: 0, y: 0 };
const workspaceRectangles: Map<IArea, Rectangle> = new Map();
const areaSizes: Map<IArea, AreaSize[]> = new Map();
let perform: (e: PointerEvent) => void;
let end: (() => void) | undefined;

export function resizeArea(e: PointerEvent, workspace: Workspace, area: IArea, side: Side) {
	last.x = e.pageX;
	last.y = e.pageY;
	const container = workspace.findSiblingContainer(area, side);
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

	container.update.push(container);
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
		area.update.push(area);
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
	last.x = current.pageX;
	last.y = current.pageY;
	const firstArea = workspace.findArea(start, (x) => x instanceof LeafArea);
	const area = workspace.findArea(last, (x) => x instanceof LeafArea);
	if (!area) return undefined;

	const areaSize = workspace.findSize(area) ?? {
		x: 10,
		y: 10,
		width: 0,
		height: 0,
	};
	const delta = { x: right ? start.x - last.x : last.x - start.x, y: bottom ? start.y - last.y : last.y - start.y };
	const orientation = delta.x > delta.y ? Orientation.Horizontal : Orientation.Vertical;

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
	const firstArea = workspace.findArea(start, (x) => x instanceof LeafArea);
	const area = workspace.findArea(last, (x) => x instanceof LeafArea);
	if (!area) {
		console.error("area not found");
		return;
	}
	// todo: there are various joins
	if (area !== firstArea) return;
	const areaSize = workspace.findSize(area) ?? {
		x: 10,
		y: 10,
		width: 0,
		height: 0,
	};
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
		appendArea: new LeafArea<string>("this area is generated"),
		firstSize: new AreaSize(firstSize, "fr"),
		secondSize: new AreaSize(secondSize, "fr"),
		orientation: orientation,
	});
}

export function capture(e: PointerEvent, workspace: Workspace, f: (e: PointerEvent) => void, endPerform: (() => void) | undefined = undefined) {
	start.x = e.pageX;
	start.y = e.pageY;
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

function normalizeSizes(workspace: Workspace) {
	for (const area of workspace.enumerateAreas()) {
		const container = area instanceof ContainerArea ? <ContainerArea>area : undefined;
		if (!container) continue;
		const left = workspace.findSize(container.left);
		const right = workspace.findSize(container.right);
		if (!left || !right) continue;
		container.leftSize = new AreaSize(container.orientation === Orientation.Horizontal ? left.width : left.height, "fr");
		container.rightSize = new AreaSize(container.orientation === Orientation.Horizontal ? right.width : right.height, "fr");
		container.update.push(container);
	}
}

function unlock() {
	window.removeEventListener("pointermove", perform);
	if (end) end();
	end = undefined;
}

window.addEventListener("pointerup", () => unlock);
// window.addEventListener('pointermove', e => console.log("pointer move here", { x: e.pageX, y: e.pageY }));
