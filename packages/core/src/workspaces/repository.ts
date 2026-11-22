import type { AreaTree } from '../layout/tree.ts';

export interface WorkspaceRecord {
	id: string;
	name: string;
	tree: AreaTree;
}

export interface WorkspaceCollectionState {
	active?: string;
	items: WorkspaceRecord[];
}

export interface WorkspaceRepository {
	load(): Promise<WorkspaceCollectionState | undefined>;
	save(state: WorkspaceCollectionState): Promise<void>;
}

export class InMemoryWorkspaceRepository implements WorkspaceRepository {
	private state: WorkspaceCollectionState | undefined;

	constructor(initial?: WorkspaceCollectionState) {
		this.state = initial && structuredCopy(initial);
	}

	async load(): Promise<WorkspaceCollectionState | undefined> {
		return this.state && structuredCopy(this.state);
	}

	async save(state: WorkspaceCollectionState): Promise<void> {
		this.state = structuredCopy(state);
	}
}

function structuredCopy<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}
