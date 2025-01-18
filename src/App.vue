<script setup lang="ts">
import MenuSpace from "./components/menus/MenuSpace.vue";
import WorkspaceComponent from "./components/workspaces/WorkspaceComponent.vue";
import { ConsoleCommand } from "./libraries/commands/consoleCommand";
import { Menu, MenuDirectoryElement, MenuLeaf, MenuSeparatorElement } from "./libraries/menus";
import { MenuService } from "./libraries/menus/service";

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
menuService.set({ x: 150, y: 50 }, menu, 0);

function openContextMenu(e: PointerEvent) {
	if (e.button != 2)
		return;
	menuService.set({ x: e.pageX, y: e.pageY }, menu, { message: "open from App" });
	return true;
}
</script>

<template>
	<div style="height: 100%; position: relative" v-on:pointerdown="openContextMenu" oncontextmenu="return false">
		<div style="position: absolute" class="c-full">
			<WorkspaceComponent />
		</div>
		<div style="position: absolute" class="c-full">
			<MenuSpace :service="menuService" />
		</div>
	</div>
</template>

<style scoped></style>
