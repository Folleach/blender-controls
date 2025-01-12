import type { IArea, Orientation, Rectangle, Workspace, WorkspaceOperation } from "@/libraries/workspaces";

export interface IWorkspaceAreaProps {
	area: IArea;
	workspace: Workspace;
	level?: number;
}

export interface IContainerAreaProps {
	area: IArea;
	workspace: Workspace;
}

export interface ILeafAreaProps {
	area: IArea;
	workspace: Workspace;
}

export interface IOverlayProps {
	rectangle: Rectangle | undefined;
	orientation: Orientation;
	size: number;
	operation: WorkspaceOperation;
}
