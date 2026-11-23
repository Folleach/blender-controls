import { describe, expect, it, vi } from 'vitest';
import { AreaRegistry, AreaRuntime, Corner, Orientation, SplitGesture, Workspace, applyGesture } from '../src/index.ts';
import type { AreaContext, AreaInstance } from '../src/index.ts';
import { captureThrown, hsplit, leaf } from './helpers.ts';

interface TestInstance extends AreaInstance {
	readonly type: string;
	readonly context: AreaContext;
	disposed: boolean;
}

const definition = (type: string) => ({
	type,
	name: `Area ${type}`,
	defaultData: () => ({ fresh: true }),
	create(context: AreaContext): TestInstance {
		const instance: TestInstance = {
			type,
			context,
			disposed: false,
			dispose() {
				instance.disposed = true;
			},
		};
		return instance;
	},
});

const setup = (root = hsplit(leaf('a'), leaf('b'))) => {
	const registry = new AreaRegistry<TestInstance>().register(definition('a')).register(definition('b'));
	const workspace = new Workspace(root);
	const runtime = new AreaRuntime(workspace, registry);
	return { registry, workspace, runtime };
};

describe('AreaRuntime', () => {
	it('creates an instance for every existing leaf', () => {
		const { workspace, runtime } = setup();
		for (const l of workspace.leaves())
			expect(runtime.get(l)?.type).toBe(l.descriptor.type);
	});

	it('keeps instances when a neighbour is split', () => {
		const { workspace, runtime } = setup();
		const [a] = workspace.leaves();
		const before = runtime.get(a!);

		workspace.split(a!, leaf('b'), { orientation: Orientation.Vertical });

		expect(runtime.get(a!)).toBe(before);
		expect(before?.disposed).toBe(false);
	});

	it('keeps the instance when the leaf is joined elsewhere', () => {
		const a = leaf('a');
		const b = leaf('b');
		const { workspace, runtime } = setup(hsplit(a, b));
		workspace.setRectangle(a, { x: 0, y: 0, width: 400, height: 600 });
		workspace.setRectangle(b, { x: 400, y: 0, width: 400, height: 600 });
		const before = runtime.get(a);

		const result = new SplitGesture(workspace, a, Corner.TopRight, { x: 400, y: 0 }).finish({ x: 700, y: 500 })!;
		applyGesture(workspace, result, () => leaf('b'));

		expect(runtime.get(a)).toBe(before);
		expect(before?.disposed).toBe(false);
	});

	it('creates instances for added leaves and disposes removed ones', () => {
		const { workspace, runtime } = setup();
		const [a, b] = workspace.leaves();
		const removed = runtime.get(b!)!;
		const created = vi.fn();
		runtime.created.subscribe(created);

		const c = leaf('a');
		workspace.split(a!, c, { orientation: Orientation.Horizontal });
		workspace.remove(b!);

		expect(runtime.get(c)).toBeDefined();
		expect(created).toHaveBeenCalledTimes(1);
		expect(removed.disposed).toBe(true);
		expect(runtime.get(b!)).toBeUndefined();
	});

	it('runs lifetime cleanups when the instance goes away', () => {
		const { workspace, runtime } = setup();
		const [, b] = workspace.leaves();
		const cleanup = vi.fn();
		runtime.get(b!)!.context.lifetime.add(cleanup);

		workspace.remove(b!);

		expect(cleanup).toHaveBeenCalled();
	});

	it('recreates the instance on replace but not on setData', () => {
		const { workspace, runtime } = setup();
		const [a] = workspace.leaves();
		const original = runtime.get(a!)!;

		original.context.commands.setData({ saved: 1 });
		expect(runtime.get(a!)).toBe(original);
		expect(original.context.data).toEqual({ saved: 1 });

		original.context.commands.replace({ type: 'b', data: undefined });
		expect(original.disposed).toBe(true);
		expect(runtime.get(a!)?.type).toBe('b');
	});

	it('lets areas split and close through commands', () => {
		const { workspace, runtime } = setup();
		const [a] = workspace.leaves();
		const commands = runtime.get(a!)!.context.commands;

		const created = commands.split(Orientation.Vertical, { type: 'b', data: undefined });
		expect(workspace.parent(created)?.first).toBe(a);
		expect(runtime.get(created)?.type).toBe('b');

		expect(commands.closeLeaf(created.id)).toBe(true);
		expect(workspace.findLeaf(created.id)).toBeUndefined();
	});

	it('uses the fallback for unknown types and upgrades once the type is registered', () => {
		const registry = new AreaRegistry<TestInstance>().register(definition('a'));
		const missing = leaf('later');
		const workspace = new Workspace(hsplit(leaf('a'), missing));
		const reasons: string[] = [];
		const runtime = new AreaRuntime(workspace, registry, {
			fallback: (context, reason) => {
				reasons.push(reason);
				return { type: 'fallback', context, disposed: false };
			},
		});

		expect(runtime.get(missing)?.type).toBe('fallback');
		expect(reasons).toEqual(['missing']);

		registry.register(definition('later'));
		expect(runtime.get(missing)?.type).toBe('later');
	});

	it('uses the fallback when create throws and cleans up what it registered', () => {
		const thrown = captureThrown();
		const cleanup = vi.fn();
		const registry = new AreaRegistry<TestInstance>().register({
			type: 'broken',
			create(context) {
				context.lifetime.add(cleanup);
				throw new Error('boom');
			},
		});
		const broken = leaf('broken');
		const runtime = new AreaRuntime(new Workspace(broken), registry, {
			fallback: (context, reason) => ({ type: reason, context, disposed: false }),
		});

		expect(runtime.get(broken)?.type).toBe('failed');
		expect(cleanup).toHaveBeenCalled();
		expect((thrown.errors[0] as Error).message).toBe("failed to create area 'broken'");
		thrown.restore();
	});

	it('disposes everything and stops listening on dispose', () => {
		const { workspace, runtime } = setup();
		const instances = workspace.leaves().map(l => runtime.get(l)!);

		runtime.dispose();
		workspace.split(workspace.leaves()[0]!, leaf('a'), { orientation: Orientation.Vertical });

		expect(instances.every(i => i.disposed)).toBe(true);
		expect([...runtime.instances()]).toHaveLength(0);
	});

	it('exposes the catalog with default data', () => {
		const { registry } = setup();
		expect(registry.list()).toEqual([
			{ type: 'a', name: 'Area a', hidden: false },
			{ type: 'b', name: 'Area b', hidden: false },
		]);
		expect(registry.descriptor('a')).toEqual({ type: 'a', data: { fresh: true } });
		expect(registry.descriptor('nope')).toBeUndefined();
	});
});
