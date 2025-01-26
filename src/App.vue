<script setup lang="ts">
import MenuSpace from "./components/menus/MenuSpace.vue";
import WorkspaceComponent from "./components/workspaces/WorkspaceComponent.vue";
import { ConsoleCommand } from "./libraries/commands/consoleCommand";
import { Menu, MenuDirectoryElement, MenuLeaf, MenuSeparatorElement } from "./libraries/menus";
import { MenuService } from "./libraries/menus/service";
import { LocalStorageWorkspaceRepository, WorkspaceService } from "./libraries/workspaces/service";
import { AreaSize, ContainerArea, LeafArea, Orientation, Workspace } from '@/libraries/workspaces';
import WorkspaceTabList from "./components/workspaces/WorkspaceTabList.vue";
import { GraphNode, GraphSpaceService } from "./libraries/nodes";
import { provide } from "vue";
import { INIT_WINDOW_SERVICE_KEY } from "./libraries/window";
import { InitAreaService } from "./components/window";
import DebugComponent from "./areas/DebugArea.vue";
import NodeComponent from "./components/nodes/NodeComponent.vue";
import InitWindowComponent from "./areas/InitArea.vue";

const broadcast = new BroadcastChannel("channel");
broadcast.addEventListener("message", (a: MessageEvent<{ message: string }>) => {
	console.info(a.data.message);
});

broadcast.postMessage({
	message: "hello!!!",
});

const next = new Menu([
	new MenuLeaf("there is nothing", new ConsoleCommand(), undefined)
])

const anotherNext = new Menu([
	new MenuLeaf("there is nothing too", new ConsoleCommand(), undefined),
	new MenuLeaf("nothing", new ConsoleCommand(), undefined)
]);

const menu = new Menu([
	new MenuLeaf("Hello", new ConsoleCommand(), undefined),
	new MenuSeparatorElement(),
	new MenuLeaf("world", new ConsoleCommand(), undefined),
	new MenuDirectoryElement("The next", next),
	new MenuDirectoryElement("yet another next", anotherNext)
]);

const menuService = new MenuService();

function openContextMenu(e: PointerEvent) {
	if (e.button != 2)
		return;
	menuService.set(menu, { message: "open from App" });
	return true;
}

const a1 = new LeafArea<string>("some", "hello");
const a2 = new LeafArea<string>("some", "world");
const a3 = new LeafArea<string>("some", "right");
const a4 = new LeafArea<string>("some", "additional");
const c1 = new ContainerArea(Orientation.Vertical, a1, a2, new AreaSize(1, "fr"), new AreaSize(2, "fr"));
const c2 = new ContainerArea(Orientation.Horizontal, a3, a4, new AreaSize(1, "fr"), new AreaSize(2, "fr"));
const root = new ContainerArea(Orientation.Horizontal, c1, c2, new AreaSize(1, "fr"), new AreaSize(2, "fr"));
const workspace = new Workspace(root);

const workspaceService = new WorkspaceService(new LocalStorageWorkspaceRepository());
workspaceService.restore().then(successfully => {
	if (!successfully)
		workspaceService.add("main", workspace);
});

const graphService = new GraphSpaceService();
graphService.addNode(new GraphNode("123", { x: 100, y: 100 }));
graphService.addNode(new GraphNode("111", { x: 0, y: 100 }));

const MyYetAnother = () => DebugComponent;

const initWindowService = new InitAreaService();
initWindowService.registerArea("blen.debug", {
	name: "Debug",
	defaultContext: "Context"
}, MyYetAnother);
initWindowService.registerArea('blen.node-component', {
	name: "Nodes",
	defaultContext: "none",
}, () => NodeComponent)
initWindowService.registerArea("blen.init-window", {
	name: "Init Area (current)",
	defaultContext: "none"
}, () => InitWindowComponent)

provide(INIT_WINDOW_SERVICE_KEY, initWindowService);

</script>

<template>
	<div style="height: 100%;" oncontextmenu="return false">
		<div style="display: grid; grid-template-rows: auto 1fr; height: 100%;" v-on:pointerdown="openContextMenu">
			<WorkspaceTabList :service="workspaceService" :menu-service="menuService" />
			<div style="height: 100%;">
				<WorkspaceComponent :service="workspaceService" />
			</div>
		</div>

		<div style="position: absolute; pointer-events: none;" class="c-full">
			<MenuSpace :service="menuService" />
		</div>
	</div>
</template>

<style scoped></style>
