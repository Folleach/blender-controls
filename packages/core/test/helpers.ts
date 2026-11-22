import { vi } from 'vitest';
import { LeafArea, Orientation, SplitArea } from '../src/index.ts';
import type { Area, Bus, WorkspaceChange, Workspace } from '../src/index.ts';

let counter = 0;

export const leaf = (type = 'test', data: unknown = undefined) => new LeafArea(`leaf-${++counter}`, { type, data });

export const hsplit = (first: Area, second: Area, a = 1, b = 1) =>
	new SplitArea(Orientation.Horizontal, first, second, a, b);

export const vsplit = (first: Area, second: Area, a = 1, b = 1) =>
	new SplitArea(Orientation.Vertical, first, second, a, b);

export function record<E>(bus: Bus<E>): E[] {
	const events: E[] = [];
	bus.subscribe(e => events.push(e));
	return events;
}

export function changes(workspace: Workspace): WorkspaceChange[] {
	return record(workspace.changes);
}

export function captureThrown(): { readonly errors: unknown[]; restore(): void } {
	const errors: unknown[] = [];
	const spy = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation(callback => {
		try {
			callback();
		} catch (error) {
			errors.push(error);
		}
	});
	return { errors, restore: () => spy.mockRestore() };
}
