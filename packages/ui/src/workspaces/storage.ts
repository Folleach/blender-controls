import { throwLater } from '@blender-controls/core';
import type { WorkspaceCollectionState, WorkspaceRepository } from '@blender-controls/core';

export class LocalStorageWorkspaceRepository implements WorkspaceRepository {
	constructor(private readonly key = 'blen-workspaces') {
	}

	async load(): Promise<WorkspaceCollectionState | undefined> {
		let raw: string | null;
		try {
			raw = localStorage.getItem(this.key);
		} catch (error) {
			throwLater(error, 'failed to read workspaces from localStorage');
			return undefined;
		}
		if (raw === null)
			return undefined;
		try {
			return JSON.parse(raw) as WorkspaceCollectionState;
		} catch (error) {
			throwLater(error, 'stored workspaces are not valid JSON');
			return undefined;
		}
	}

	async save(state: WorkspaceCollectionState): Promise<void> {
		localStorage.setItem(this.key, JSON.stringify(state));
	}

	clear(): void {
		localStorage.removeItem(this.key);
	}
}
