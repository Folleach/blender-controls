import type { IArea, LeafArea, Workspace } from ".";

export interface IWorkspaceApi {
	swap: (id: string) => void;
	getContext: <T>() => T | undefined;
	setContext: <T>(context: T) => void;
}

export class WorkspaceApi implements IWorkspaceApi {
	private workspace: Workspace;
	private area: IArea;

	constructor(workspace: Workspace, area: IArea) {
		this.workspace = workspace;
		this.area = area;
	}

	swap(id: string) {
		this.workspace.swap(this.area, id, "context");
	}

	getContext<T>(): T | undefined {
		const leaf = <LeafArea<T>>this.area;
		if (!leaf) return undefined;
		return leaf.context;
	}

	setContext<T>(context: T) {
		const leaf = <LeafArea<T>>this.area;
		if (!leaf) return;
		leaf.context = context;
	}
}
