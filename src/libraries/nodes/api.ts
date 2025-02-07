import type { Position } from "../workspaces";

export interface IGlobalSpaceApi {
	getPointerPosition: () => Position;
}

export interface ISocketDragAndDrop {
	nodeId: string;
	socketId: string;
}
