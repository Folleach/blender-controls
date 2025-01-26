import type { NodeSocket } from "@/libraries/nodes";
import type { Position } from "@/libraries/workspaces";

export interface ISocketLineProps {
	socket: NodeSocket;
	input: boolean;
}

export interface IJointProps {
	start: Position;
	end: Position;
}
