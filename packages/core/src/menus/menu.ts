import { executeCommand } from '../commands.ts';
import type { CommandLike } from '../commands.ts';
import { Bus } from '../events.ts';
import { distanceToRectangle } from '../geometry.ts';
import type { Position, Rectangle } from '../geometry.ts';

export interface MenuItemOptions {
	hint?: string;
	disabled?: boolean;
	icon?: string;
}

export class MenuItem<C = any> {
	constructor(
		readonly text: string,
		readonly command: CommandLike<C>,
		readonly options: MenuItemOptions = {},
	) {}

	execute(context: C): void {
		executeCommand(this.command, context);
	}
}

export class MenuSeparator {}

export class MenuDirectory {
	constructor(
		readonly text: string,
		readonly menu: MenuSource,
	) {}
}

export type MenuElement = MenuItem | MenuSeparator | MenuDirectory;

export interface MenuSource {
	elements(context: unknown): readonly MenuElement[] | Promise<readonly MenuElement[]>;
}

export class Menu implements MenuSource {
	constructor(private readonly items: readonly MenuElement[] | ((context: unknown) => readonly MenuElement[])) {}

	elements(context: unknown): readonly MenuElement[] {
		return typeof this.items === 'function' ? this.items(context) : this.items;
	}
}

export class MenuLevel {
	rectangle: Rectangle | undefined;

	constructor(
		readonly menu: MenuSource,
		readonly position: Position,
		readonly depth: number,
	) {}
}

export interface ContextMenuOptions {
	keepDistance?: number;
	slack?: number;
}

export class ContextMenu {
	readonly changes: Bus<void> = new Bus();

	private _levels: MenuLevel[] = [];
	private _context: unknown;
	private closest = Number.POSITIVE_INFINITY;
	private readonly keepDistance: number;
	private readonly slack: number;

	constructor(options: ContextMenuOptions = {}) {
		this.keepDistance = options.keepDistance ?? 100;
		this.slack = options.slack ?? 50;
	}

	get levels(): readonly MenuLevel[] {
		return this._levels;
	}

	get context(): unknown {
		return this._context;
	}

	get isOpen(): boolean {
		return this._levels.length > 0;
	}

	open(menu: MenuSource, position: Position, context?: unknown): void {
		this._context = context;
		this._levels = [new MenuLevel(menu, position, 0)];
		this.closest = Number.POSITIVE_INFINITY;
		this.changes.dispatch();
	}

	openSubmenu(depth: number, position: Position, menu: MenuSource): void {
		if (depth <= 0 || depth > this._levels.length)
			return;
		if (this._levels[depth]?.menu === menu)
			return;
		this._levels = [...this._levels.slice(0, depth), new MenuLevel(menu, position, depth)];
		this.closest = Number.POSITIVE_INFINITY;
		this.changes.dispatch();
	}

	execute(item: MenuItem): void {
		if (item.options.disabled)
			return;
		const context = this._context;
		this.close();
		item.execute(context);
	}

	closeFrom(depth: number): void {
		if (depth >= this._levels.length)
			return;
		this._levels = this._levels.slice(0, Math.max(depth, 0));
		if (this._levels.length === 0)
			this._context = undefined;
		this.closest = Number.POSITIVE_INFINITY;
		this.changes.dispatch();
	}

	close(): void {
		this.closeFrom(0);
	}

	setRectangle(level: MenuLevel, rectangle: Rectangle): void {
		level.rectangle = rectangle;
	}

	track(pointer: Position): void {
		let depth = this._levels.length;
		while (depth > 0) {
			const rectangle = this._levels[depth - 1]!.rectangle;
			if (!rectangle)
				break;
			const distance = distanceToRectangle(pointer, rectangle);
			if (distance - this.slack < Math.max(this.closest, this.keepDistance)) {
				this.closest = Math.min(this.closest, distance);
				break;
			}
			depth--;
		}
		if (depth < this._levels.length)
			this.closeFrom(depth);
	}
}
