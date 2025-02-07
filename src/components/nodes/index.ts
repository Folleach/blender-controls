import { Graph, InputSocket, Node, OutputSocket, type SocketBase } from "@/libraries/nodes";
import type { IGlobalSpaceApi } from "@/libraries/nodes/api";
import type { Position } from "@/libraries/workspaces";
import { reactive, toRefs, type InjectionKey } from "vue";

export const NODES_GLOBAL_SPACE_API = Symbol() as InjectionKey<IGlobalSpaceApi>;

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
		selected: new Set<Node>(),
	});

	const addNode = (node: Node): boolean => {
		return state.graph.addNode(node);
	};

	const removeNode = (nodeId: string): void => {
		const node = state.graph.removeNode(nodeId);
		if (node) state.selected.delete(node);
	};

	const link = (from: OutputSocket, to: InputSocket) => {
		state.graph.link(from, to);
	};

	const nodes = () => state.graph.getNodes();
	const relations = () => state.graph.getRelations();

	function select(nodes: Node[], append: boolean) {
		if (!append) state.selected.clear();
		for (const node of nodes) state.selected.add(node);
	}

	return {
		...toRefs(state),
		removeNode,
		addNode,
		nodes,
		relations,
		link,
		select,
	};
}

export type GraphState = ReturnType<typeof useGraph>;
