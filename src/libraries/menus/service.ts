import type { IMenu } from ".";
import type { None } from "../common/none";
import { getPointerPosition } from "../common/pointer";
import type { IContext } from "../contexts";
import type { Position, Rectangle } from "../workspaces";
import { LastPipe, type IPipe } from "../workspaces/bus";

export const CONTEXT_MENU_API = "context-menu-api";

interface IMenuHolder {
	position: Position;
	menu: IMenu;
}

export interface IContextMenuApi {
	set: (menu: IMenu, context: IContext, position?: Position | undefined) => void;
}

export class MenuService implements IContextMenuApi {
	stack: IMenuHolder[] = [];
	update: IPipe<None> = new LastPipe();
	rectangles: Map<number, Rectangle> = new Map();
	context: IContext = {};

	set(menu: IMenu, context: IContext, position?: Position | undefined) {
		this.context = context;
		this.push(position ?? getPointerPosition(), menu, 0);
	}

	push(position: Position, menu: IMenu, index: number) {
		while (index < this.stack.length) this.stack.pop();
		this.stack.push({ position, menu });
		this.update.push({});
	}

	reset() {
		this.stack = [];
		this.rectangles.clear();
		this.update.push({});
	}
}
