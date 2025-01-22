<script setup lang="ts">
import DisclosureRightIcon from '@/svgs/DisclosureRightIcon.vue';
import { type IMenuSpaceInternal, MENU_SPACE_OVERLAY_KEY, type IMenuDirectoryProps } from '.';
import { inject, useTemplateRef } from 'vue';
import type { Position } from '@/libraries/workspaces';

const props = defineProps<IMenuDirectoryProps>();

const internal = inject<IMenuSpaceInternal>(MENU_SPACE_OVERLAY_KEY);
const element = useTemplateRef<HTMLDivElement>('item');
function show() {
    if (!internal) {
        console.error("menu service doesn't provided");
        return;
    }
    if (props.depth + 1 !== internal?.service.stack.length
        && props.directory.menu === internal.service.stack[internal.service.stack.length - 1].menu)
        return;
    const bond = element.value?.getBoundingClientRect();
    const position: Position = {
        x: (bond?.left ?? 0) + (element.value?.offsetWidth ?? 0) + 8,
        y: (bond?.top ?? 0) - 6
    }
    internal?.service.push(position, props.directory.menu, props.depth + 1);
}
</script>

<template>
    <div class="item" v-on:pointerenter="show" ref="item">
        <div></div>
        <p>{{ props.directory.text }}</p>
        <div></div>
        <DisclosureRightIcon />
    </div>
</template>

<style lang="css" scoped>
.item {
    display: grid;
    grid-template-columns: 1rem auto 1rem max-content;
    gap: 0.25rem;
    align-items: center;
}
</style>

<style lang="css">
.p-blender-icon {
    fill: color-mix(in srgb, black 40%, white 40%);
    margin: 0.2rem 0.4rem;
    align-items: center;
}
</style>