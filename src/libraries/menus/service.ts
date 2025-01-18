import type { IMenu } from ".";
import type { None } from "../common/none";
import type { IContext } from "../contexts";
import type { Position, Rectangle } from "../workspaces";
import { LastPipe, type IPipe } from "../workspaces/bus";

interface IMenuHolder {
	position: Position;
	menu: IMenu;
}

export interface IMenuService {
	set: (position: Position, menu: IMenu, context: IContext) => void;
}

export class MenuService implements IMenuService {
	stack: IMenuHolder[] = [];
	update: IPipe<None> = new LastPipe();
	rectangles: Map<number, Rectangle> = new Map();
	context: IContext = {};

	set(position: Position, menu: IMenu, context: IContext) {
		this.context = context;
		this.push(position, menu, 0);
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
