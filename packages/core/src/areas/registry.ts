import { Bus } from '../events.ts';
import type { Lifetime } from '../events.ts';
import type { Orientation } from '../geometry.ts';
import type { AreaDescriptor, LeafArea } from '../layout/area.ts';
import type { Workspace } from '../layout/workspace.ts';

export interface AreaInstance {
	dispose?(): void;
}

export interface AreaCommands {
	replace(descriptor: AreaDescriptor): void;
	setData(data: unknown): void;
	split(
		orientation: Orientation,
		descriptor: AreaDescriptor,
		options?: { sizes?: readonly [number, number]; before?: boolean },
	): LeafArea;
	close(): boolean;
	closeLeaf(id: string): boolean;
}

export interface AreaInfo {
	readonly type: string;
	readonly name: string;
	readonly hidden: boolean; // from area picker
}

export interface AreaCatalog {
	readonly changes: Bus<void>;
	list(): AreaInfo[];
	descriptor(type: string): AreaDescriptor | undefined;
}

export interface AreaContext<D = unknown> {
	readonly leaf: LeafArea<D>;
	readonly workspace: Workspace;
	readonly lifetime: Lifetime;
	readonly commands: AreaCommands;
	readonly catalog: AreaCatalog;
	readonly data: D;
}

export interface AreaDefinition<I extends AreaInstance = AreaInstance, D = any> {
	readonly type: string;
	readonly name?: string;
	readonly hidden?: boolean;
	defaultData?(): D;
	create(context: AreaContext<D>): I;
}

export class AreaRegistry<I extends AreaInstance = AreaInstance> implements AreaCatalog {
	readonly changes: Bus<void> = new Bus();
	private readonly definitions: Map<string, AreaDefinition<I>> = new Map();

	register(definition: AreaDefinition<I>): this {
		this.definitions.set(definition.type, definition);
		this.changes.dispatch();
		return this;
	}

	unregister(type: string): boolean {
		const removed = this.definitions.delete(type);
		if (removed)
			this.changes.dispatch();
		return removed;
	}

	get(type: string): AreaDefinition<I> | undefined {
		return this.definitions.get(type);
	}

	list(): AreaInfo[] {
		return [...this.definitions.values()].map(definition => ({
			type: definition.type,
			name: definition.name ?? definition.type,
			hidden: definition.hidden ?? false,
		}));
	}

	descriptor(type: string): AreaDescriptor | undefined {
		const definition = this.definitions.get(type);
		if (!definition)
			return undefined;
		return { type, data: definition.defaultData?.() };
	}
}
