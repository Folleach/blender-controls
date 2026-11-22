import { describe, expect, it, vi } from 'vitest';
import { ContextMenu, Menu, MenuDirectory, MenuItem, MenuSeparator } from '../src/index.ts';

const rect = { x: 0, y: 0, width: 100, height: 100 };

describe('ContextMenu', () => {
	it('executes items with the context after closing', () => {
		const contextMenu = new ContextMenu();
		let openWhileExecuting = true;
		const item = new MenuItem<{ id: number }>('Do', context => {
			openWhileExecuting = contextMenu.isOpen;
			expect(context).toEqual({ id: 7 });
		});

		contextMenu.open(new Menu([item]), { x: 0, y: 0 }, { id: 7 });
		contextMenu.execute(item);

		expect(openWhileExecuting).toBe(false);
		expect(contextMenu.levels).toHaveLength(0);
	});

	it('does not execute disabled items', () => {
		const contextMenu = new ContextMenu();
		const action = vi.fn();
		const item = new MenuItem('Nope', action, { disabled: true });
		contextMenu.open(new Menu([item]), { x: 0, y: 0 });

		contextMenu.execute(item);

		expect(action).not.toHaveBeenCalled();
		expect(contextMenu.isOpen).toBe(true);
	});

	it('replaces deeper levels when another submenu opens', () => {
		const contextMenu = new ContextMenu();
		const one = new Menu([]);
		const two = new Menu([]);
		contextMenu.open(new Menu([new MenuDirectory('one', one), new MenuSeparator()]), { x: 0, y: 0 });

		contextMenu.openSubmenu(1, { x: 100, y: 0 }, one);
		contextMenu.openSubmenu(2, { x: 200, y: 0 }, two);
		contextMenu.openSubmenu(1, { x: 100, y: 20 }, two);

		expect(contextMenu.levels.map(l => l.menu)).toEqual([contextMenu.levels[0]!.menu, two]);
	});

	it('ignores reopening the same submenu', () => {
		const contextMenu = new ContextMenu();
		const sub = new Menu([]);
		contextMenu.open(new Menu([]), { x: 0, y: 0 });
		contextMenu.openSubmenu(1, { x: 100, y: 0 }, sub);
		const changes = vi.fn();
		contextMenu.changes.subscribe(changes);

		contextMenu.openSubmenu(1, { x: 100, y: 0 }, sub);

		expect(changes).not.toHaveBeenCalled();
	});

	it('keeps the menu while the pointer approaches or stays near', () => {
		const contextMenu = new ContextMenu({ keepDistance: 100, slack: 50 });
		contextMenu.open(new Menu([]), { x: 0, y: 0 });
		contextMenu.setRectangle(contextMenu.levels[0]!, rect);

		contextMenu.track({ x: 300, y: 50 }); // far, but this is the closest approach so far
		contextMenu.track({ x: 200, y: 50 });
		contextMenu.track({ x: 120, y: 50 });

		expect(contextMenu.isOpen).toBe(true);
	});

	it('closes once the pointer moves clearly away', () => {
		const contextMenu = new ContextMenu({ keepDistance: 100, slack: 50 });
		contextMenu.open(new Menu([]), { x: 0, y: 0 });
		contextMenu.setRectangle(contextMenu.levels[0]!, rect);

		contextMenu.track({ x: 110, y: 50 });
		contextMenu.track({ x: 260, y: 50 }); // 160px away: beyond keepDistance + slack

		expect(contextMenu.isOpen).toBe(false);
	});

	it('closes submenus first, keeping the parent the pointer is near', () => {
		const contextMenu = new ContextMenu({ keepDistance: 20, slack: 10 });
		contextMenu.open(new Menu([]), { x: 0, y: 0 });
		contextMenu.setRectangle(contextMenu.levels[0]!, rect);
		contextMenu.openSubmenu(1, { x: 300, y: 0 }, new Menu([]));
		contextMenu.setRectangle(contextMenu.levels[1]!, { x: 300, y: 0, width: 100, height: 100 });

		contextMenu.track({ x: 290, y: 50 });
		contextMenu.track({ x: 50, y: 50 });

		expect(contextMenu.levels).toHaveLength(1);
	});
});
