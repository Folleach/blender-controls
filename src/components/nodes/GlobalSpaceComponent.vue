<script setup lang="ts">
import { computed, onMounted, provide, ref, useTemplateRef } from 'vue';
import { MoveOperation } from '../../libraries/common/operations/MoveOperation';
import { type IGlobalSpaceApi, NODES_GLOBAL_SPACE_API } from '@/libraries/nodes/api';
import type { Position } from '@/libraries/workspaces';

const props = defineProps<{
    onPointerPosition?: ((e: Position) => void) | undefined;
}>();

const position = ref({ x: 0, y: 0 });
const currentPointerPosition: Position = { x: 0, y: 0 };
const currentOffset: Position = { x: 0, y: 0 };
const move: MoveOperation = new MoveOperation(p => position.value = p, () => {
    document.getElementById('app')!.style.cursor = "default";
});

function handlePointerDown(e: PointerEvent) {
    if (e.button !== 1) return;
    e.preventDefault();
    move.perform(e, position.value);
    document.getElementById('app')!.style.cursor = "move";
};

const innerStyle = computed(() => {
    return {
        transform: `translate(${position.value.x}px, ${position.value.y}px)`,
    }
});

const background = computed(() => {
    return {
        backgroundPosition: `${position.value.x % 60}px ${position.value.y % 60}px`
    }
});

provide<IGlobalSpaceApi>(NODES_GLOBAL_SPACE_API, {
    getPointerPosition: () => ({ ...currentPointerPosition })
});

function setPointerPosition(e: PointerEvent) {
    currentPointerPosition.x = -position.value.x + (e.pageX - currentOffset.x);
    currentPointerPosition.y = -position.value.y + (e.pageY - currentOffset.y);
    if (props.onPointerPosition)
        props.onPointerPosition({ ...currentPointerPosition });
}

const spaceRootElement = useTemplateRef<HTMLDivElement>("element");
onMounted(() => {
    if (!spaceRootElement.value) {
        console.error("failed to watch to global space div");
        return;
    }
    const offset = spaceRootElement.value.getBoundingClientRect();
    currentOffset.x = offset?.left ?? 0;
    currentOffset.y = offset?.top ?? 0
});

</script>

<template>
    <div class='space grid' :style="background" ref="element" @pointerdown="handlePointerDown"
        @pointermove="setPointerPosition" @pointerenter="setPointerPosition">
        <div :style="innerStyle">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped lang="css">
.space {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background: var(--cl-bg2);
}

.grid {
    position: absolute;
    background-image:
        linear-gradient(to right, color-mix(in srgb, var(--cl-bg2) 95%, var(--cl-tx2) 5%) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--cl-bg2) 95%, var(--cl-tx2) 5%) 1px, transparent 1px);
    background-size: 60px 60px;
}

.space>div {
    position: absolute;
    transform: translateZ(0);
    will-change: transform;
    background-size: 30px 10px;
}
</style>