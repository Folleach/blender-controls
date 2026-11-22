import { AreaRegistry, ContextMenu, Orientation, Workspace, fromTree, leafTree, splitTree } from '@blender-controls/core';
import type { DomAreaInstance } from '@blender-controls/ui';
import { WorkspaceElement, createDomRuntime, defineDomArea, html, iframeArea } from '@blender-controls/ui';
import { code, h } from '../dom.ts';
import { PLACEHOLDER, placeholderArea } from './common.ts';
import type { PlaceholderData } from './common.ts';

export const EXAMPLE_CODE = `
import { AreaRegistry, Orientation, Workspace, fromTree, leafTree, splitTree } from '@blender-controls/core';
import { WorkspaceElement, createDomRuntime, defineDomArea, defineElements } from '@blender-controls/ui';

defineElements();

const registry = new AreaRegistry().register(
	defineDomArea('hello', context => {
		// created once per leaf, survives every layout change
		const element = document.createElement('h2');
		element.textContent = context.data.title;
		return { element };
	}),
);

const workspace = new Workspace(fromTree(
	splitTree(Orientation.Horizontal,
		leafTree('hello', { title: 'This is the left side' }),
		leafTree('hello', { title: "Yes, I'm the right side" }),
		[2, 1]),
));

const view = new WorkspaceElement();
view.connect(workspace, createDomRuntime(workspace, registry));
document.body.append(view);
`;

export const workspaceExampleArea = (contextMenu: ContextMenu) => defineDomArea(
	'blen.demo.workspaces.example',
	context => {
		const registry = new AreaRegistry<DomAreaInstance>().register(placeholderArea);
		const workspace = new Workspace(
			fromTree(
				splitTree(
					Orientation.Horizontal,
					leafTree<PlaceholderData>(PLACEHOLDER, { title: 'This is the left side', subtitle: 'There is a right side →' }),
					leafTree<PlaceholderData>(PLACEHOLDER, { title: "Yes, I'm the right side" }),
					[2, 1],
				),
			),
		);
		const runtime = createDomRuntime(workspace, registry);
		const view = new WorkspaceElement();
		view.style.height = '100%';
		view.connect(workspace, runtime, { contextMenu });
		context.lifetime.add(() => {
			view.disconnect();
			runtime.dispose();
		});
		return { element: h('div', { class: 'padded' }, view) };
	},
	{ name: '[Demo] Workspace Example' },
);

export const swapArea = defineDomArea(
	'blen.demo.workspaces.swap',
	context => ({
		element: h(
			'div',
			{ class: 'centered' },
			h('h1', {}, 'Swap'),
			code(`
defineDomArea('swap', context => {
	const button = new ButtonElement();
	button.onclick = () => context.commands.replace({ type: 'other', data: undefined });
	return { element: button };
});`),
			h(
				'blen-button',
				{ onclick: () => context.commands.replace({ type: 'blen.demo.workspaces.swapped', data: undefined }) },
				'Swap me',
			),
		),
	}),
	{ name: '[Demo] Swap' },
);

export const swappedArea = defineDomArea(
	'blen.demo.workspaces.swapped',
	context => ({
		element: h(
			'div',
			{ class: 'centered' },
			h('h1', {}, 'Swapped!'),
			h(
				'blen-button',
				{ onclick: () => context.commands.replace({ type: 'blen.demo.workspaces.swap', data: undefined }) },
				'Back',
			),
		),
	}),
	{ name: '[Demo] Swapped' },
);

interface SplitApiData {
	holders: string[];
}

export const splitApiArea = defineDomArea<SplitApiData>(
	'blen.demo.workspaces.split-api',
	context => {
		let holders = [...(context.data?.holders ?? [])];
		let clicks = 0;
		const list = h('blen-group', { orientation: 'vertical' });
		const opened = h('p', { class: 'muted' });

		const render = () => {
			holders = holders.filter(id => context.workspace.findLeaf(id));
			opened.textContent = `${holders.length} area(s) opened by this one; local clicks: ${clicks}`;
			list.replaceChildren(
				...holders.map(id =>
					h(
						'blen-button',
						{
							onclick: () => {
								context.commands.closeLeaf(id);
								save();
							},
						},
						`Close (${id.slice(-8)})`,
					),
				),
			);
		};
		const save = () => {
			render();
			context.commands.setData({ holders });
		};
		const split = (orientation: Orientation) => {
			clicks++;
			const leaf = context.commands.split(orientation, {
				type: PLACEHOLDER,
				data: { title: 'Lorem ipsum? ^_^', subtitle: `opened #${holders.length + 1}` },
			});
			holders.push(leaf.id);
			save();
		};
		context.lifetime.add(context.workspace.changes.subscribe(change => change.kind === 'leaf-removed' && render()));

		const element = h(
			'div',
			{ class: 'centered' },
			h('h1', {}, 'Split'),
			h('p', {}, 'Open areas for a while; the counter below is plain local state and survives splitting.'),
			h(
				'blen-group',
				{},
				h('blen-button', { onclick: () => split(Orientation.Horizontal) }, 'Split Horizontal'),
				h('blen-button', { onclick: () => split(Orientation.Vertical) }, 'Split Vertical'),
			),
			opened,
			h('blen-separator'),
			list,
		);
		render();
		return { element };
	},
	{ name: '[Demo] Split API', defaultData: () => ({ holders: [] }) },
);

const markup = html`
<!doctype html>
	<body style="font: 14px sans-serif; color: #cecdc3; background: #1c1b1a; display: grid; place-items: center; height: 100vh; margin: 0">
		<div style="text-align: center">
			<h2>Area from iframe</h2>
			<p>Running for <b id="t">0</b> s</p>
		</div>
	<script>
		let s = 0; setInterval(() => document.getElementById('t').textContent = ++s, 1000);
	</script>
</body>
`;

export const iframeDemoArea = iframeArea('blen.demo.iframe', {
	name: '[Demo] Iframe',
	src: () => 'about:blank',
	attributes: {
		srcdoc: markup,
	},
});

export const workspacesTree = () =>
	splitTree(
		Orientation.Vertical,
		splitTree(
			Orientation.Horizontal,
			leafTree('blen.demo.code', { title: 'Workspace example code', code: EXAMPLE_CODE }),
			leafTree('blen.demo.workspaces.example'),
			[2, 3],
		),
		splitTree(
			Orientation.Horizontal,
			leafTree('blen.demo.workspaces.swap'),
			splitTree(
				Orientation.Horizontal,
				leafTree<SplitApiData>('blen.demo.workspaces.split-api', { holders: [] }),
				leafTree('blen.demo.iframe'),
				[2, 3],
			),
			[1, 5],
		),
	);
