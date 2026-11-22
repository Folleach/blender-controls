import { throwLater } from '../errors.ts';
import { Bus, Lifetime } from '../events.ts';
import type { Disposable } from '../events.ts';
import { createId } from '../identifier.ts';
import { LeafArea } from '../layout/area.ts';
import type { Workspace } from '../layout/workspace.ts';
import type { AreaCommands, AreaContext, AreaInstance, AreaRegistry } from './registry.ts';

export type AreaFallbackReason = 'missing' | 'failed';

export interface AreaRuntimeOptions<I extends AreaInstance> {
	fallback?: (context: AreaContext, reason: AreaFallbackReason, error?: unknown) => I;
}

export interface AreaInstanceEvent<I> {
	readonly leaf: LeafArea;
	readonly instance: I;
}

interface Entry<I> {
	instance: I;
	lifetime: Lifetime;
	missing: boolean;
}

export class AreaRuntime<I extends AreaInstance = AreaInstance> {
	readonly created: Bus<AreaInstanceEvent<I>> = new Bus();
	readonly disposed: Bus<AreaInstanceEvent<I>> = new Bus();

	private readonly entries: Map<LeafArea, Entry<I>> = new Map();
	private readonly subscriptions: Disposable[];
	private _disposed = false;

	constructor(
		readonly workspace: Workspace,
		readonly registry: AreaRegistry<I>,
		private readonly options: AreaRuntimeOptions<NoInfer<I>> = {},
	) {
		this.subscriptions = [
			workspace.changes.subscribe(change => {
				if (change.kind === 'leaf-added')
					this.create(change.leaf);
				else if (change.kind === 'leaf-removed')
					this.destroy(change.leaf);
				else if (change.kind === 'descriptor' && change.replaced) {
					this.destroy(change.leaf);
					this.create(change.leaf);
				}
			}),
			registry.changes.subscribe(() => this.retryMissing()),
		];
		for (const leaf of workspace.leaves())
			this.create(leaf);
	}

	get(leaf: LeafArea): I | undefined {
		return this.entries.get(leaf)?.instance;
	}

	*instances(): Iterable<AreaInstanceEvent<I>> {
		for (const [leaf, entry] of this.entries)
			yield { leaf, instance: entry.instance };
	}

	dispose(): void {
		if (this._disposed)
			return;
		this._disposed = true;
		for (const unsubscribe of this.subscriptions)
			unsubscribe();
		for (const leaf of [...this.entries.keys()])
			this.destroy(leaf);
	}

	private create(leaf: LeafArea) {
		if (this._disposed || this.entries.has(leaf))
			return;
		const definition = this.registry.get(leaf.descriptor.type);
		if (!definition) {
			this.createFallback(leaf, 'missing');
			return;
		}
		const attempt = this.attempt(leaf, context => definition.create(context));
		if ('error' in attempt) {
			throwLater(attempt.error, `failed to create area '${definition.type}'`);
			this.createFallback(leaf, 'failed', attempt.error);
			return;
		}
		this.store(leaf, attempt, false);
	}

	private createFallback(leaf: LeafArea, reason: AreaFallbackReason, error?: unknown) {
		const fallback = this.options.fallback;
		if (!fallback)
			return;
		const attempt = this.attempt(leaf, context => fallback(context, reason, error));
		if ('error' in attempt) {
			throwLater(attempt.error, 'area fallback failed');
			return;
		}
		this.store(leaf, attempt, reason === 'missing');
	}

	private attempt(
		leaf: LeafArea,
		factory: (context: AreaContext) => I,
	): { instance: I; lifetime: Lifetime } | { error: unknown } {
		const lifetime = new Lifetime();
		try {
			return { instance: factory(this.contextFor(leaf, lifetime)), lifetime };
		} catch (error) {
			lifetime.dispose();
			return { error };
		}
	}

	private store(leaf: LeafArea, created: { instance: I; lifetime: Lifetime }, missing: boolean) {
		this.entries.set(leaf, { ...created, missing });
		this.created.dispatch({ leaf, instance: created.instance });
	}

	private destroy(leaf: LeafArea) {
		const entry = this.entries.get(leaf);
		if (!entry)
			return;
		this.entries.delete(leaf);
		this.disposed.dispatch({ leaf, instance: entry.instance });
		try {
			entry.instance.dispose?.();
		} catch (error) {
			throwLater(error, `failed to dispose area '${leaf.descriptor.type}'`);
		}
		entry.lifetime.dispose();
	}

	private retryMissing() {
		for (const [leaf, entry] of [...this.entries]) {
			if (entry.missing && this.registry.get(leaf.descriptor.type)) {
				this.destroy(leaf);
				this.create(leaf);
			}
		}
	}

	private contextFor(leaf: LeafArea, lifetime: Lifetime): AreaContext {
		const workspace = this.workspace;
		const commands: AreaCommands = {
			replace: descriptor => workspace.replace(leaf, descriptor),
			setData: data => workspace.setData(leaf, data),
			split: (orientation, descriptor, options = {}) => {
				const created = new LeafArea(createId(), descriptor);
				workspace.split(leaf, created, { orientation, sizes: options.sizes, before: options.before });
				return created;
			},
			close: () => workspace.remove(leaf),
			closeLeaf: id => {
				const target = workspace.findLeaf(id);
				return target ? workspace.remove(target) : false;
			},
		};
		return {
			leaf,
			workspace,
			lifetime,
			commands,
			catalog: this.registry,
			get data() {
				return leaf.descriptor.data;
			},
		};
	}
}
