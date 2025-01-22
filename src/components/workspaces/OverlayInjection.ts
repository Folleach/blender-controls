import type { Rectangle } from "@/libraries/workspaces";
import type { IOverlayProps } from "./WorkspaceAreaProps";

export const WORKSPACE_OVERLAY_KEY = "blender-workspace-overlay";

export interface IWorkspaceOverlayContext {
	props: IOverlayProps | undefined;
	update: (value: IOverlayProps | undefined) => void;
	getRectContext: () => Rectangle | undefined;
}
