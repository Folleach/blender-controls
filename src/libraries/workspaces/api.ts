import type { IArea, Workspace } from ".";

export interface IWorkspaceApiProps {
	api: IWorkspaceApi;
}

export interface IWorkspaceApi {
	swap: (id: string) => void;
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
}
