<script setup lang="ts">
import { computed, ref } from 'vue';
import type { IJointProps } from '.';
import type { Position } from '@/libraries/workspaces';

const props = defineProps<IJointProps>();
const state = ref<{
    corner: Position,
    pos1: Position,
    pos2: Position
}>({
    corner: { x: 0, y: 0 },
    pos1: { x: 0, y: 0 },
    pos2: { x: 0, y: 0 },
});

function calculate() {
    let left = Infinity;
    let top = Infinity;

    left = Math.min(props.start.x, props.end.x);
    top = Math.min(props.start.y, props.end.y);

    const x1 = props.start.x - left;
    const y1 = props.start.y - top;
    const x2 = props.end.x - left;
    const y2 = props.end.y - top;

    state.value = {
        corner: { x: left, y: top },
        pos1: { x: x1, y: y1 },
        pos2: { x: x2, y: y2 }
    };
}

const style = computed(() => {

    let width = Math.max(state.value.pos1.x, state.value.pos2.x);
    let height = Math.max(state.value.pos1.y, state.value.pos2.y);
    if (width == 0)
        width = 10;
    if (height == 0)
        height = 10;

    return {
        transform: `translate(${state.value.corner.x}px, ${state.value.corner.y}px)`,
        width: width,
        height: height
    }
});

calculate();

</script>

<template>
    <svg class="joint" :style="style">
        <line :x1="state.pos1.x" :y1="state.pos1.y" :x2="state.pos2.x" :y2="state.pos2.y" stroke='#8020e0' />
    </svg>
</template>

<style lang="css" scoped>
.joint {
    position: absolute;
}
</style>