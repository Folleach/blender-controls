import { Graph, GraphNode, Menu, MenuItem, Selection } from '@blender-controls/core';
import type { ContextMenu } from '@blender-controls/core';
import { NodeEditorElement, defineDomArea, openContextMenu } from '@blender-controls/ui';
import { h } from '../dom.ts';

const GRID = 15;

function sampleNode(position: { x: number; y: number }, title = 'Node') {
	const node = new GraphNode(position, title);
	node.addOutput('Output', 'number');
	node.addInput('Input', 'number');
	node.addInput('Yet another', 'number');
	return node;
}

export const nodesArea = (contextMenu: ContextMenu) =>
	defineDomArea(
		'blen.demo.nodes',
		context => {
			const graph = new Graph();
			const selection = new Selection<GraphNode>();
			const first = new GraphNode({ x: 30, y: 45 }, 'Value');
			const out = first.addOutput('Number', 'number');
			const second = new GraphNode({ x: 300, y: 120 }, 'Viewer');
			const input = second.addInput('Number', 'number');
			graph.add(first);
			graph.add(second);
			graph.link(out, input);

			const editor = new NodeEditorElement();
			editor.offset = { x: 100, y: 100 };
			editor.bind(graph, {
				selection,
				grid: GRID,
				renderContent: () => h('p', { style: 'margin: 0.5rem 1rem' }, 'Dynamic content here'),
			});

			const deleteSelected = () => {
				for (const node of selection.values())
					graph.remove(node);
			};
			editor.addEventListener('contextmenu', event => {
				const event_ = event as MouseEvent;
				const at = editor.toGraph({ x: event_.clientX, y: event_.clientY });
				const position = { x: Math.round(at.x / GRID) * GRID, y: Math.round(at.y / GRID) * GRID };
				const menu = new Menu([
					new MenuItem('Add Node', () => {
						const node = sampleNode(position);
						graph.add(node);
						selection.select([node]);
					}, { icon: 'add' }),
					new MenuItem('Delete Selected', deleteSelected, { hint: 'X', disabled: selection.size === 0 }),
					new MenuItem(editor.curving === 0 ? 'Curved Links' : 'Straight Links', () => {
						editor.curving = editor.curving === 0 ? 1 : 0;
					}),
					new MenuItem('Reset View', () => (editor.offset = { x: 100, y: 100 })),
				]);
				openContextMenu(contextMenu, menu, event_);
			});
			editor.tabIndex = 0;
			editor.addEventListener('keydown', event => {
				if (event.key === 'x' || event.key === 'Delete')
					deleteSelected();
			});

			context.lifetime.add(() => editor.unbind());
			return { element: editor };
		},
		{ name: 'Nodes' },
	);
