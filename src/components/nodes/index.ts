import { Graph, InputSocket, Node, OutputSocket, type SocketBase } from "@/libraries/nodes";
import type { Position } from "@/libraries/workspaces";
import { reactive, toRefs } from "vue";

export interface ISocketLineProps {
	socket: SocketBase;
	graph: GraphState;
	updateRelative?: ((socket: SocketBase, position: Position) => void) | undefined;
}

export const NODES_SOCKET_POSITIONS_KEY = "nodes-socket-positions-key";
export type SocketPositions = Map<SocketBase, Position>;

export default function useGraph() {
	const state = reactive({
		graph: new Graph(),
	});

	const addNode = (node: Node): boolean => {
		return state.graph.addNode(node);
	};

	const link = (from: OutputSocket, to: InputSocket) => {
		state.graph.link(from, to);
	};

	const nodes = () => state.graph.getNodes();
	const relations = () => state.graph.getRelations();

	return {
		...toRefs(state),
		addNode,
		nodes,
		relations,
		link,
	};
}

export type GraphState = ReturnType<typeof useGraph>;
