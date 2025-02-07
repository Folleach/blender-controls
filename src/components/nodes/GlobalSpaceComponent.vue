<script setup lang="ts">
import { computed, provide, ref, useTemplateRef, type Ref, type ComputedRef } from 'vue';
import { MoveOperation } from '../../libraries/common/operations/MoveOperation';
import { type IGlobalSpaceApi } from '@/libraries/nodes/api';
import type { Position, Rectangle } from '@/libraries/workspaces';
import { ConstantPositionAlignment } from '@/libraries/common/alignment';
import { NODES_GLOBAL_SPACE_API } from '.';
import { SelectOperation } from '@/libraries/common/operations/SelectOperation';
import { toLocal } from '@/libraries/common/geometry';

const props = defineProps<{
    initial: Position;
    onPointerPosition?: ((e: Position) => void) | undefined;
    onSelect?: (rect: Rectangle) => void;
    onMove?: (position: Position) => void;
}>();
const spaceRootElement = useTemplateRef<HTMLDivElement>("element");

const position = ref(props.initial);
const selectRectangle: Ref<Rectangle | undefined> = ref(undefined);
const currentPointerPosition: Position = { x: 0, y: 0 };
const move: MoveOperation = new MoveOperation(p => {
    position.value = p;
    if (props.onMove)
        props.onMove(p);
}, () => {
    document.getElementById('app')!.style.cursor = "default";
}, new ConstantPositionAlignment(1));
const select: ComputedRef<SelectOperation> = computed(() => new SelectOperation(spaceRootElement.value, r => selectRectangle.value = r, () => {
    if (props.onSelect && selectRectangle.value)
        props.onSelect(selectRectangle.value);
    selectRectangle.value = undefined;
}));

function handlePointerDown(e: PointerEvent) {
    if (e.button === 1) {
        e.preventDefault();
        move.perform(e, position.value);
        document.getElementById('app')!.style.cursor = "move";
        return;
    }
    if (e.button === 0 && props.onSelect) {
        select.value.perform(e, position.value);
        return false;
    }
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
    const local = toLocal(spaceRootElement.value, e.clientX, e.clientY, position.value);
    currentPointerPosition.x = local.x;
    currentPointerPosition.y = local.y;
    if (props.onPointerPosition)
        props.onPointerPosition({ ...currentPointerPosition });
}

const selectableStyle = computed(() => {
    return {
        transform: `translate(${position.value.x + selectRectangle.value!.x}px, ${position.value.y + selectRectangle.value!.y}px`,
        width: `${selectRectangle.value!.width}px`,
        height: `${selectRectangle.value!.height}px`
    }
})
</script>

<template>
    <div class='space grid' :style="background" ref="element" @pointerdown="handlePointerDown"
        @pointermove="setPointerPosition" @pointerenter="setPointerPosition">
        <div :style="innerStyle">
            <slot></slot>
        </div>
        <div v-if="selectRectangle" :style="selectableStyle" class="selectable"></div>
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

.selectable {
    position: absolute;
    user-select: none;
    pointer-events: none;
    border-width: 1px;
    border-color: var(--cl-tx2);
    background-color: color-mix(in srgb, var(--cl-tx2) 10%, transparent 90%);
    border-style: dashed;
    stroke-dasharray: 4px 4px;
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