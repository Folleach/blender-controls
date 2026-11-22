import { AreaRegistry, WorkspaceCollection, leafTree } from '@blender-controls/core';
import {
	LocalStorageWorkspaceRepository,
	MenuLayerElement,
	WorkspacesElement,
	applyTheme,
	areaPickerArea,
	defineElements,
	flexokiDark,
	flexokiPalette,
} from '@blender-controls/ui';
import type { DomAreaInstance } from '@blender-controls/ui';
import { codeArea, placeholderArea } from './areas/common.ts';
import { elementsArea } from './areas/elements.ts';
import { LIVE_TABS, liveTabsArea } from './areas/live-tabs.ts';
import { nodesArea } from './areas/nodes.ts';
import { welcomeArea } from './areas/welcome.ts';
import {
	iframeDemoArea,
	splitApiArea,
	swapArea,
	swappedArea,
	workspaceExampleArea,
	workspacesTree,
} from './areas/workspaces.ts';

defineElements();
applyTheme({ ...flexokiPalette, ...flexokiDark });

const menuLayer = document.getElementById('menu') as MenuLayerElement;
const contextMenu = menuLayer.contextMenu;
const app = document.getElementById('app') as WorkspacesElement;

const repository = new LocalStorageWorkspaceRepository('blen-demo-v2');
const collection = new WorkspaceCollection({ repository });

let resetting = false;
const reset = () => {
	resetting = true;
	repository.clear();
	location.reload();
};

const registry = new AreaRegistry<DomAreaInstance>()
	.register(areaPickerArea())
	.register(welcomeArea(reset))
	.register(nodesArea(contextMenu))
	.register(elementsArea)
	.register(placeholderArea)
	.register(codeArea)
	.register(workspaceExampleArea(contextMenu))
	.register(swapArea)
	.register(swappedArea)
	.register(splitApiArea)
	.register(iframeDemoArea)
	.register(liveTabsArea(collection, app));

if (!(await collection.restore())) {
	collection.add('Welcome', leafTree('blen.demo.welcome'));
	collection.add('Workspaces', workspacesTree());
	collection.add('Nodes', leafTree('blen.demo.nodes'));
	collection.add('UI Elements', leafTree('blen.demo.elements'));
	collection.add('Live Tabs', leafTree(LIVE_TABS));
}

window.addEventListener('pagehide', () => {
	if (!resetting)
		void collection.save();
});

app.connect(collection, registry, {
	contextMenu,
	createArea: () => ({ type: 'blen.area-picker', data: undefined }),
	newWorkspace: () => leafTree('blen.area-picker'),
	retain: (tab, recent) => recent.slice(0, 3).includes(tab),
});
