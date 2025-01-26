import type { Position } from "../workspaces";

export interface ISocketId {
	nodeId: string;
	socketId: string;
}

export interface IGraphSpaceService {
	addNode: (node: GraphNode) => GraphNode;
	link: (from: ISocketId, to: ISocketId) => void;
}

export class GraphSpaceService implements IGraphSpaceService {
	private nodes: Map<string, GraphNode> = new Map();

	constructor() {}

	addNode(node: GraphNode): GraphNode {
		const current = this.nodes.get(node.id);
		if (current) return current;

		this.nodes.set(node.id, node);
		return node;
	}

	link(from: ISocketId, to: ISocketId) {}

	*getNodes(): Iterable<GraphNode> {
		for (const node of this.nodes) yield node[1];
	}
}

export class GraphNode {
	id: string;
	position: Position;
	inputs: NodeSocket[] = [];
	outputs: NodeSocket[] = [];

	constructor(id: string, position: Position) {
		this.id = id;
		this.position = position;
	}
}

export interface NodeSocket {
	id: string;
}

export interface NodeJoint {
	from: ISocketId;
}
