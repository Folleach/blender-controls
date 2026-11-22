import { describe, expect, it } from 'vitest';
import { Graph, GraphNode, Selection } from '../src/index.ts';
import type { GraphChange } from '../src/index.ts';
import { record } from './helpers.ts';

const pair = () => {
	const graph = new Graph();
	const source = new GraphNode();
	const output = source.addOutput('out', 'number');
	const target = new GraphNode();
	const input = target.addInput('in', 'number');
	graph.add(source);
	graph.add(target);
	return { graph, source, target, output, input };
};

describe('Graph', () => {
	it('links compatible sockets and announces it', () => {
		const { graph, output, input } = pair();
		const log = record<GraphChange>(graph.changes);

		const relation = graph.link(output, input)!;

		expect(input.relation).toBe(relation);
		expect(output.relations).toEqual([relation]);
		expect(log).toEqual([{ kind: 'linked', relation }]);
	});

	it('refuses different types, the same node and nodes outside the graph', () => {
		const { graph, source, output } = pair();
		const stranger = new GraphNode();
		const strangerInput = stranger.addInput('in', 'number');
		const text = new GraphNode();
		const textInput = text.addInput('in', 'string');
		graph.add(text);
		const selfInput = source.addInput('self', 'number');

		expect(graph.link(output, textInput)).toBeUndefined();
		expect(graph.link(output, selfInput)).toBeUndefined();
		expect(graph.link(output, strangerInput)).toBeUndefined();
	});

	it('replaces the previous relation of an input', () => {
		const { graph, output, input } = pair();
		const other = new GraphNode();
		const otherOutput = other.addOutput('out', 'number');
		graph.add(other);

		const first = graph.link(output, input)!;
		const second = graph.link(otherOutput, input)!;

		expect(input.relation).toBe(second);
		expect(output.relations).not.toContain(first);
		expect(graph.relations()).toEqual([second]);
	});

	it('removes relations together with the node', () => {
		const { graph, source, output, input } = pair();
		graph.link(output, input);

		expect(graph.remove(source)).toBe(true);

		expect(graph.relations()).toEqual([]);
		expect(input.relation).toBeUndefined();
		expect(graph.has(source)).toBe(false);
		expect(graph.remove(source)).toBe(false);
	});

	it('finds sockets by key and refuses duplicate keys', () => {
		const node = new GraphNode();
		const input = node.addInput('value', 'number');
		const output = node.addOutput('value', 'number');

		expect(node.socket('value', 'input')).toBe(input);
		expect(node.socket('value', 'output')).toBe(output);
		expect(() => node.addInput('value')).toThrow();
	});

	it('moves nodes and announces only real moves', () => {
		const { graph, source } = pair();
		const log = record<GraphChange>(graph.changes);

		graph.move(source, { x: 0, y: 0 });
		graph.move(source, { x: 15, y: 30 });

		expect(source.position).toEqual({ x: 15, y: 30 });
		expect(log).toEqual([{ kind: 'node-moved', node: source }]);
	});
});

describe('Selection', () => {
	it('replaces or appends', () => {
		const selection = new Selection<string>();
		selection.select(['a', 'b']);
		selection.select(['c'], true);
		expect(selection.values()).toEqual(['a', 'b', 'c']);

		selection.select(['d']);
		expect(selection.values()).toEqual(['d']);
	});
});
