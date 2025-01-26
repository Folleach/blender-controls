<script setup lang="ts">
import { GraphNode } from '@/libraries/nodes';
import { computed, ref } from 'vue';
import SocketLineComponent from './SocketLineComponent.vue';
import { MoveOperation } from '../../libraries/common/operations/MoveOperation';
import type { Position } from '@/libraries/workspaces';
import { ConstantPositionAlignment } from '@/libraries/common/alignment';
import { v4 } from 'uuid';

const node = new GraphNode(v4(), { x: 100, y: 100 });
const position = ref<Position>(node.position);

const move = new MoveOperation(p => {
    node.position = p;
    position.value = p;
}, undefined, new ConstantPositionAlignment(15));

node.inputs = [
    { id: "Input" },
    { id: "Additional" }
]
node.outputs = [
    { id: "Output" }
]

const style = computed(() => {
    return {
        transform: `translate(${position.value.x}px, ${position.value.y}px)`
    }
});

function handleMove(e: PointerEvent) {
    if (e.button !== 0)
        return;
    move.perform(e, position.value);
}

</script>

<template>
    <div class="node" :style="style">
        <div class="title" v-on:pointerdown="handleMove">
            <p>Title</p>
        </div>
        <div class="body">
            <div v-for="item in node.outputs" :key="item.id">
                <SocketLineComponent :socket="item" :input="false" />
            </div>
            <div v-for="item in node.inputs" :key="item.id">
                <SocketLineComponent :socket="item" :input="true" />
            </div>
        </div>
    </div>
</template>

<style lang="css" scoped>
.node {
    position: absolute;

    min-width: 120px;
    background-color: var(--cl-ui);
    color: var(--cl-tx);
}

.title {
    background-color: var(--flexoki-cyan-900);
    user-select: none;
}

.body {
    margin: 0 -6px;
}
</style>