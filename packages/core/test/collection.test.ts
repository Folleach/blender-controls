import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	InMemoryWorkspaceRepository,
	LeafArea,
	Orientation,
	WorkspaceCollection,
	leafTree,
	splitTree,
} from '../src/index.ts';
import { captureThrown } from './helpers.ts';

const tree = () => splitTree(Orientation.Horizontal, leafTree('a'), leafTree('b'));

describe('WorkspaceCollection', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('activates the first added workspace', () => {
		const collection = new WorkspaceCollection();
		const first = collection.add('first', tree());
		collection.add('second', tree());

		expect(collection.active).toBe(first);
		expect(collection.tabs.map(t => t.name)).toEqual(['first', 'second']);
	});

	it('activates a neighbour when the active workspace is removed', () => {
		const collection = new WorkspaceCollection();
		const first = collection.add('first', tree());
		const second = collection.add('second', tree());
		const third = collection.add('third', tree());

		collection.activate(second.id);
		collection.remove(second.id);
		expect(collection.active).toBe(third);

		collection.remove(third.id);
		expect(collection.active).toBe(first);

		collection.remove(first.id);
		expect(collection.active).toBeUndefined();
	});

	it('duplicates with fresh leaf ids right after the original', () => {
		const collection = new WorkspaceCollection();
		const first = collection.add('first', tree());
		collection.add('second', tree());

		const copy = collection.duplicate(first.id)!;

		expect(collection.tabs.map(t => t.name)).toEqual(['first', 'first copy', 'second']);
		const originalIds = first.workspace.leaves().map(l => l.id);
		const copyIds = copy.workspace.leaves().map(l => l.id);
		expect(copyIds.some(id => originalIds.includes(id))).toBe(false);
		expect(copy.workspace.leaves().map(l => l.descriptor.type)).toEqual(['a', 'b']);
	});

	it('reorders and renames', () => {
		const collection = new WorkspaceCollection();
		const first = collection.add('first', tree());
		collection.add('second', tree());

		collection.move(first.id, 5);
		collection.rename(first.id, 'renamed');

		expect(collection.tabs.map(t => t.name)).toEqual(['second', 'renamed']);
	});

	it('saves and restores the whole state', async () => {
		const repository = new InMemoryWorkspaceRepository();
		const collection = new WorkspaceCollection({ repository });
		collection.add('first', tree());
		const second = collection.add('second', tree(), { activate: true });
		await collection.save();

		const restored = new WorkspaceCollection({ repository });
		expect(await restored.restore()).toBe(true);

		expect(restored.tabs.map(t => t.name)).toEqual(['first', 'second']);
		expect(restored.active?.id).toBe(second.id);
		expect(restored.active?.workspace.leaves().map(l => l.id)).toEqual(second.workspace.leaves().map(l => l.id));
	});

	it('autosaves workspace changes after a delay, coalescing bursts', async () => {
		const repository = new InMemoryWorkspaceRepository();
		const save = vi.spyOn(repository, 'save');
		const collection = new WorkspaceCollection({ repository, autosaveDelay: 100 });
		const tab = collection.add('first', tree());
		const [a] = tab.workspace.leaves();

		tab.workspace.setData(a!, 1);
		tab.workspace.setData(a!, 2);
		expect(save).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(100);
		expect(save).toHaveBeenCalledTimes(1);
		expect((await repository.load())?.items[0]?.tree).toMatchObject({ children: [{ data: 2 }, {}] });
	});

	it('skips broken records instead of failing the restore', async () => {
		const thrown = captureThrown();
		const repository = new InMemoryWorkspaceRepository({
			active: 'missing',
			items: [
				{ id: 'broken', name: 'broken', tree: { kind: 'nope' } as never },
				{ id: 'ok', name: 'ok', tree: leafTree('a') },
			],
		});
		const collection = new WorkspaceCollection({ repository });

		expect(await collection.restore()).toBe(true);
		expect(collection.tabs.map(t => t.id)).toEqual(['ok']);
		expect(collection.active?.id).toBe('ok');
		expect((thrown.errors[0] as Error).message).toBe("failed to restore workspace 'broken'");
		thrown.restore();
	});

	it('accepts ready areas as well as trees', () => {
		const collection = new WorkspaceCollection();
		const root = new LeafArea('x', { type: 'a', data: undefined });
		expect(collection.add('area', root).workspace.root).toBe(root);
	});
});
