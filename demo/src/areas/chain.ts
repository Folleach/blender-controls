import { Bus, Graph, GraphNode, Orientation, Selection, leafTree, splitTree } from '@blender-controls/core';
import type { OutputSocket } from '@blender-controls/core';
import { NodeEditorElement, defineDomArea } from '@blender-controls/ui';
import { h } from '../dom.ts';

const GRID = 15;
const PER_ROW = 8;

export const CHAIN_GRAPH = 'blen.demo.chain.graph';
export const CHAIN_PARAMS = 'blen.demo.chain.params';

// shared state
const chain = {
	count: 10,
	changes: new Bus<number>(),
	set(count: number) {
		if (count === this.count)
			return;
		this.count = count;
		this.changes.dispatch(count);
	},
};

function rebuild(graph: Graph, count: number) {
	for (const node of graph.nodes())
		graph.remove(node);
	let previous: OutputSocket | undefined;
	for (let i = 0; i < count; i++) {
		const position = { x: (i % PER_ROW) * 14 * GRID, y: Math.floor(i / PER_ROW) * 8 * GRID };
		const node = new GraphNode(position, `Node ${i + 1}`);
		const input = node.addInput('In', 'number');
		const output = node.addOutput('Out', 'number');
		graph.add(node);
		if (previous)
			graph.link(previous, input);
		previous = output;
	}
}

export const chainGraphArea = defineDomArea(
	CHAIN_GRAPH,
	context => {
		const graph = new Graph();
		rebuild(graph, chain.count);

		const editor = new NodeEditorElement();
		editor.offset = { x: 60, y: 60 };
		editor.bind(graph, { selection: new Selection<GraphNode>(), grid: GRID });

		const stats = h('div', { class: 'graph-stats' });
		let frames = 0;
		let fps = 0;
		let since = performance.now();
		let frame = requestAnimationFrame(function tick(now) {
			frames++;
			if (now - since >= 500) {
				fps = Math.round((frames * 1000) / (now - since));
				frames = 0;
				since = now;
			}
			// the camera looks at the opposite of the offset
			const offset = editor.offset;
			const visible = editor.visible;
			const text = [
				`Position: ${Math.round(-offset.x)}, ${Math.round(-offset.y)}`,
				`Zoom: ${Math.round(editor.zoom * 100)}%`,
				`Nodes: ${visible.nodes} / ${graph.nodes().length}`,
				`Links: ${visible.relations} / ${graph.relations().length}`,
				`FPS: ${fps}`,
			].join('\n');
			if (stats.textContent !== text)
				stats.textContent = text;
			frame = requestAnimationFrame(tick);
		});

		context.lifetime.add(chain.changes.subscribe(count => rebuild(graph, count)));
		context.lifetime.add(() => cancelAnimationFrame(frame));
		context.lifetime.add(() => editor.unbind());
		return { element: h('div', { class: 'graph-host' }, editor, stats) };
	},
	{ name: '[Demo] Chain Graph' },
);

export const chainParamsArea = defineDomArea(
	CHAIN_PARAMS,
	context => {
		const field = h('blen-number-field', {
			label: 'Nodes',
			value: String(chain.count),
			min: '0',
			step: '1',
			precision: '0',
			oninput: event => chain.set((event.currentTarget as HTMLElement & { value: number }).value),
		}) as HTMLElement & { value: number };
		context.lifetime.add(chain.changes.subscribe(count => (field.value = count)));
		return { element: h('div', { class: 'padded' }, h('div', { class: 'row', style: 'justify-content: flex-start' }, field)) };
	},
	{ name: '[Demo] Chain Params' },
);

export const chainTree = () =>
	splitTree(Orientation.Vertical,
		leafTree(CHAIN_GRAPH),
		leafTree(CHAIN_PARAMS),
		[5, 1]
	);
