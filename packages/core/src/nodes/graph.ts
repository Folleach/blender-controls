import { Bus } from '../events.ts';
import type { Position } from '../geometry.ts';

export type SocketDirection = 'input' | 'output';

abstract class SocketBase {
	abstract readonly direction: SocketDirection;

	constructor(
		readonly key: string,
		readonly type: string,
		readonly node: GraphNode,
	) {}
}

export class InputSocket extends SocketBase {
	readonly direction = 'input';
	relation: Relation | undefined;
}

export class OutputSocket extends SocketBase {
	readonly direction = 'output';
	readonly relations: Relation[] = [];
}

export type Socket = InputSocket | OutputSocket;

export class Relation {
	constructor(
		readonly from: OutputSocket,
		readonly to: InputSocket,
	) {}
}

export class GraphNode<D = unknown> {
	readonly inputs: InputSocket[] = [];
	readonly outputs: OutputSocket[] = [];

	constructor(
		public position: Position = { x: 0, y: 0 },
		public title: string = '',
		public data?: D,
	) {}

	addInput(key: string, type = 'default'): InputSocket {
		if (this.socket(key, 'input'))
			throw new Error(`node already has an input '${key}'`);
		const socket = new InputSocket(key, type, this);
		this.inputs.push(socket);
		return socket;
	}

	addOutput(key: string, type = 'default'): OutputSocket {
		if (this.socket(key, 'output'))
			throw new Error(`node already has an output '${key}'`);
		const socket = new OutputSocket(key, type, this);
		this.outputs.push(socket);
		return socket;
	}

	socket(key: string, direction: SocketDirection): Socket | undefined {
		return (direction === 'input' ? this.inputs : this.outputs).find(socket => socket.key === key);
	}
}

export type GraphChange =
	| { readonly kind: 'node-added'; readonly node: GraphNode }
	| { readonly kind: 'node-removed'; readonly node: GraphNode }
	| { readonly kind: 'node-moved'; readonly node: GraphNode }
	| { readonly kind: 'linked'; readonly relation: Relation }
	| { readonly kind: 'unlinked'; readonly relation: Relation };

export class Graph {
	readonly changes: Bus<GraphChange> = new Bus();

	private readonly _nodes: Set<GraphNode> = new Set();
	private readonly _relations: Set<Relation> = new Set();

	nodes(): GraphNode[] {
		return [...this._nodes];
	}

	relations(): Relation[] {
		return [...this._relations];
	}

	has(node: GraphNode): boolean {
		return this._nodes.has(node);
	}

	add(node: GraphNode): boolean {
		if (this._nodes.has(node))
			return false;
		this._nodes.add(node);
		this.changes.dispatch({ kind: 'node-added', node });
		return true;
	}

	remove(node: GraphNode): boolean {
		if (!this._nodes.has(node))
			return false;
		for (const relation of this.relations()) {
			if (relation.from.node === node || relation.to.node === node)
				this.unlink(relation);
		}
		this._nodes.delete(node);
		this.changes.dispatch({ kind: 'node-removed', node });
		return true;
	}

	move(node: GraphNode, position: Position): void {
		if (node.position.x === position.x && node.position.y === position.y)
			return;
		node.position = { ...position };
		this.changes.dispatch({ kind: 'node-moved', node });
	}

	canLink(from: OutputSocket, to: InputSocket): boolean {
		return from.node !== to.node
			&& from.type === to.type
			&& this._nodes.has(from.node)
			&& this._nodes.has(to.node);
	}

	link(from: OutputSocket, to: InputSocket): Relation | undefined {
		if (!this.canLink(from, to))
			return undefined;
		if (to.relation?.from === from)
			return to.relation;
		if (to.relation)
			this.unlink(to.relation);

		const relation = new Relation(from, to);
		this._relations.add(relation);
		from.relations.push(relation);
		to.relation = relation;
		this.changes.dispatch({ kind: 'linked', relation });
		return relation;
	}

	unlink(relation: Relation): void {
		if (!this._relations.delete(relation))
			return;
		const index = relation.from.relations.indexOf(relation);
		if (index !== -1)
			relation.from.relations.splice(index, 1);
		if (relation.to.relation === relation)
			relation.to.relation = undefined;
		this.changes.dispatch({ kind: 'unlinked', relation });
	}
}
