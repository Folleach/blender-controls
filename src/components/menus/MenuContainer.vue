<script setup lang="ts">
import { MenuDirectoryElement, MenuLeaf, MenuSeparatorElement } from "@/libraries/menus";
import { type IMenuSpaceInternal, MENU_SPACE_OVERLAY_KEY, type IMenuContainerProps } from ".";
import MenuDirectory from "./MenuDirectory.vue";
import MenuItem from "./MenuItem.vue";
import MenuSeparator from "./MenuSeparator.vue";
import { inject, onMounted, useTemplateRef } from "vue";
import type { Rectangle } from "@/libraries/workspaces";

const props = defineProps<IMenuContainerProps>();

const internal = inject<IMenuSpaceInternal>(MENU_SPACE_OVERLAY_KEY);
const element = useTemplateRef<HTMLDivElement>('element');

onMounted(() => {
	const box = element.value?.getBoundingClientRect();
	if (!box)
		return;
	const rect: Rectangle = {
		x: box.left,
		y: box.top,
		width: box.width,
		height: box.height
	}
	internal?.service.rectangles.set(props.depth, rect);
})

function stopPropagation(e: MouseEvent) {
	e.stopPropagation();
}
</script>

<template>
	<div class="container" ref="element" v-on:click="stopPropagation">
		<div class="container-inside">
			<div v-for="(item, index) in menu.elements()" :key="index"
				:class="(!(item instanceof MenuSeparatorElement)) ? 'selectable' : ''">
				<MenuSeparator v-if="(item instanceof MenuSeparatorElement)">
				</MenuSeparator>
				<MenuItem v-if="(item instanceof MenuLeaf)" :item="item">
				</MenuItem>
				<MenuDirectory v-if="(item instanceof MenuDirectoryElement)" :directory="item" :depth="depth">
				</MenuDirectory>
			</div>
		</div>
	</div>
</template>

<style lang="css" scoped>
.container {
	width: auto;
	background-color: #1b1b1b;
	border-radius: 0.25rem;
	padding: 0.35rem 0;
	border-width: 1px;
	border-color: color-mix(in srgb, white 15%, transparent 85%);
	border-style: solid;
}

.container-inside {
	padding: 0 0.35rem;
}

.container-inside>div {
	padding: 0.05rem 0.25rem;
	user-select: none;
}

.selectable:hover {
	background-color: color-mix(in srgb, white 15%, transparent 85%);
	border-radius: 0.25rem;
}
</style>
