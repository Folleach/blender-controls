import { v4 } from "uuid";
import type { Position } from "../workspaces";

export type NodeId = string;
export type SocketId = string;
export type RelationId = string;

export interface SocketBase {
	id: SocketId;
	type: string;
	node: Node;
}

export class SocketRelation {
	constructor(
		public readonly id: RelationId,
		public readonly from: OutputSocket,
		public readonly to: InputSocket,
	) {}
}

export class InputSocket implements SocketBase {
	public relation: SocketRelation | null = null;

	constructor(
		public readonly id: SocketId,
		public readonly type: string,
		public readonly node: Node,
	) {}
}

export class OutputSocket implements SocketBase {
	public relations: SocketRelation[] = [];

	constructor(
		public readonly id: SocketId,
		public readonly type: string,
		public readonly node: Node,
	) {}
}

export class Node {
	public readonly inputs: InputSocket[] = [];
	public readonly outputs: OutputSocket[] = [];

	constructor(
		public readonly id: NodeId,
		public position: Position = { x: 0, y: 0 },
	) {}

	addInputSocket(id: SocketId, type: string = "default"): InputSocket {
		const socket = new InputSocket(id, type, this);
		this.inputs.push(socket);
		return socket;
	}

	addOutputSocket(id: SocketId, type: string = "default"): OutputSocket {
		const socket = new OutputSocket(id, type, this);
		this.outputs.push(socket);
		return socket;
	}
}

export class Graph {
	private nodes: Node[] = [];
	private relations: SocketRelation[] = [];
	private nodesById: Map<NodeId, Node> = new Map();

	addNode(node: Node): boolean {
		if (this.nodesById.get(node.id)) return false;
		this.nodes.push(node);
		this.nodesById.set(node.id, node);
		return true;
	}

	removeNode(nodeId: NodeId): Node | undefined {
		const node = this.nodes.find((n) => n.id === nodeId);
		if (!node) return;

		this.relations = this.relations.filter((r) => {
			const shouldRemove = r.from.node === node || r.to.node === node;
			if (shouldRemove) {
				this.cleanupRelation(r);
			}
			return !shouldRemove;
		});

		this.nodesById.delete(node.id);
		this.nodes = this.nodes.filter((n) => n !== node);
		return node;
	}

	getNode(id: NodeId): Node | undefined {
		return this.nodesById.get(id);
	}

	link(from: OutputSocket, to: InputSocket): SocketRelation | null {
		if (!this.validateRelation(from, to)) return null;

		if (to.relation) {
			this.unlink(to.relation.id);
		}

		const relation = new SocketRelation(this.generateId(), from, to);

		this.relations.push(relation);
		from.relations.push(relation);
		to.relation = relation;

		return relation;
	}

	unlink(relationId: RelationId): void {
		const relation = this.relations.find((r) => r.id === relationId);
		if (!relation) return;

		this.relations = this.relations.filter((r) => r !== relation);
		this.cleanupRelation(relation);
	}

	private validateRelation(from: OutputSocket, to: InputSocket): boolean {
		return from.node !== to.node && from.type === to.type;
	}

	private cleanupRelation(relation: SocketRelation): void {
		const outputIndex = relation.from.relations.indexOf(relation);
		if (outputIndex !== -1) {
			relation.from.relations.splice(outputIndex, 1);
		}

		if (relation.to.relation === relation) {
			relation.to.relation = null;
		}
	}

	private generateId(): string {
		return v4();
	}

	getNodes(): Node[] {
		return [...this.nodes];
	}

	getRelations(): SocketRelation[] {
		return [...this.relations];
	}
}
