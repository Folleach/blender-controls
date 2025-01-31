import type { Position } from "../workspaces";

export const NODES_GLOBAL_SPACE_API = "nodes-global-space-api";

export interface IGlobalSpaceApi {
	getPointerPosition: () => Position;
}

export interface ISocketDragAndDrop {
	nodeId: string;
	socketId: string;
}
