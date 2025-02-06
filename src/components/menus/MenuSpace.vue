<script setup lang="ts">
import { provide, ref } from "vue";
import { MENU_SPACE_OVERLAY_KEY, type IMenuSpaceInternal, type IMenuSpaceProps } from ".";
import MenuContainer from "./MenuContainer.vue";
import { distanceToRectangle } from "@/libraries/common/geometry";
import type { Position } from "@/libraries/workspaces";

const hardCloseDistance = 100;
let softCloseDistance = hardCloseDistance;

const props = defineProps<IMenuSpaceProps>();

const internal: IMenuSpaceInternal = {
	service: props.service,
};
provide<IMenuSpaceInternal>(MENU_SPACE_OVERLAY_KEY, internal);

const key = ref(0);

window.addEventListener('pointermove', (e: PointerEvent) => {
	if (internal.service.stack.length === 0)
		return;
	const point: Position = {
		x: e.pageX,
		y: e.pageY
	}
	let update = false;
	while (internal.service.stack.length !== 0) {
		const actual = internal.service.rectangles.get(internal.service.stack.length - 1);
		if (!actual)
			break;
		const distance = distanceToRectangle(point, actual);
		if (distance - 50 < Math.max(softCloseDistance, hardCloseDistance)) {
			softCloseDistance = Math.min(distance, softCloseDistance);
			break;
		}
		internal.service.stack.pop();
		update = true;
	}
	if (update)
		internal.service.update.push({});
});

props.service.update.consume({}, () => {
	softCloseDistance = Number.MAX_VALUE;
	key.value++
})

function close() {
	props.service.reset();
}
</script>

<template>
	<div class="workspace" :key="key" v-on:pointerdown="close"
		:style="{ pointerEvents: service.stack.length > 0 ? 'all' : 'none' }">
		<div v-for="(item, index) in service.stack" :key="index" class="menu"
			:style="{ position: 'absolute', left: `${item.position.x}px`, top: `${item.position.y}px` }">
			<MenuContainer :menu="item.menu" :depth="index" />
		</div>
	</div>
</template>

<style lang="css" scoped>
.workspace {
	height: 100%;
	position: relative;
}

.menu {
	pointer-events: all;
}
</style>
