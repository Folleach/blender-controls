<script setup lang="ts">
import MenuSpace from "./components/menus/MenuSpace.vue";
import { CONTEXT_MENU_API, MenuService, type IContextMenuApi } from "./libraries/menus/service";
import { LocalStorageWorkspaceRepository, WorkspaceService } from "./libraries/workspaces/service";
import { AreaSize, ContainerArea, LeafArea, Orientation, Workspace } from '@/libraries/workspaces';
import WorkspaceTabList from "./components/workspaces/WorkspaceTabList.vue";
import { provide } from "vue";
import { INIT_WINDOW_SERVICE_KEY } from "./libraries/window";
import { InitAreaService } from "./components/window";
import DebugComponent from "./areas/DebugArea.vue";
import InitWindowComponent from "./areas/InitArea.vue";
import NodesArea from "./areas/NodesArea.vue";
import MultipleWorkspaceComponent from "./components/workspaces/MultipleWorkspaceComponent.vue";
import { v4 } from "uuid";

const broadcast = new BroadcastChannel("channel");
broadcast.addEventListener("message", (a: MessageEvent<{ message: string }>) => {
	console.info(a.data.message);
});

broadcast.postMessage({
	message: "hello!!!",
});

const menuService = new MenuService();

const a1 = new LeafArea<string>(v4(), "some", "hello");
const a2 = new LeafArea<string>(v4(), "some", "world");
const a3 = new LeafArea<string>(v4(), "some", "right");
const a4 = new LeafArea<string>(v4(), "some", "additional");
const c1 = new ContainerArea(Orientation.Vertical, a1, a2, new AreaSize(1, "fr"), new AreaSize(2, "fr"));
const c2 = new ContainerArea(Orientation.Horizontal, a3, a4, new AreaSize(1, "fr"), new AreaSize(2, "fr"));
const root = new ContainerArea(Orientation.Horizontal, c1, c2, new AreaSize(1, "fr"), new AreaSize(2, "fr"));
const workspace = new Workspace(root);

const workspaceService = new WorkspaceService(new LocalStorageWorkspaceRepository());
workspaceService.restore().then(successfully => {
	if (!successfully)
		workspaceService.add("main", workspace);
});

const MyYetAnother = () => DebugComponent;

const initWindowService = new InitAreaService();
initWindowService.registerArea("blen.debug", {
	name: "Debug",
	defaultContext: "Context"
}, MyYetAnother);
initWindowService.registerArea('blen.node-component', {
	name: "Nodes",
	defaultContext: "none",
}, () => NodesArea)
initWindowService.registerArea("blen.init-window", {
	name: "Init Area (current)",
	defaultContext: "none"
}, () => InitWindowComponent)

provide(INIT_WINDOW_SERVICE_KEY, initWindowService);
provide<IContextMenuApi>(CONTEXT_MENU_API, menuService);

</script>

<template>
	<div style="height: 100%;" oncontextmenu="return false">
		<div style="display: grid; grid-template-rows: auto 1fr; height: 100%;">
			<WorkspaceTabList :service="workspaceService" :menu-service="menuService" />
			<div style="height: 100%;">
				<MultipleWorkspaceComponent :service="workspaceService" :menu="menuService" />
			</div>
		</div>

		<div style="position: absolute; pointer-events: none;" class="c-full">
			<MenuSpace :service="menuService" />
		</div>
	</div>
</template>

<style scoped></style>
