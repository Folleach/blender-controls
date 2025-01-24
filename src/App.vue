<script setup lang="ts">
import MenuSpace from "./components/menus/MenuSpace.vue";
import WorkspaceComponent from "./components/workspaces/WorkspaceComponent.vue";
import { ConsoleCommand } from "./libraries/commands/consoleCommand";
import { Menu, MenuDirectoryElement, MenuLeaf, MenuSeparatorElement } from "./libraries/menus";
import { MenuService } from "./libraries/menus/service";
import { LocalStorageWorkspaceRepository, WorkspaceService } from "./libraries/workspaces/service";
import { AreaSize, ContainerArea, LeafArea, Orientation, Workspace } from '@/libraries/workspaces';
import WorkspaceTabList from "./components/workspaces/WorkspaceTabList.vue";

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

const a1 = new LeafArea<string>("hello");
const a2 = new LeafArea<string>("world");
const a3 = new LeafArea<string>("right");
const a4 = new LeafArea<string>("additional");
const c1 = new ContainerArea(Orientation.Vertical, a1, a2, new AreaSize(1, "fr"), new AreaSize(2, "fr"));
const c2 = new ContainerArea(Orientation.Horizontal, a3, a4, new AreaSize(1, "fr"), new AreaSize(2, "fr"));
const root = new ContainerArea(Orientation.Horizontal, c1, c2, new AreaSize(1, "fr"), new AreaSize(2, "fr"));
const workspace = new Workspace(root);

const workspaceService = new WorkspaceService(new LocalStorageWorkspaceRepository());
workspaceService.restore().then(successfully => {
	if (!successfully)
		workspaceService.add("main", workspace);
});

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
