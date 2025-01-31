<script setup lang="ts">
import { computed, inject, onUnmounted, useTemplateRef, watch } from 'vue';
import SocketLineComponent from './SocketLineComponent.vue';
import { MoveOperation } from '../../libraries/common/operations/MoveOperation';
import type { Position } from '@/libraries/workspaces';
import { ConstantPositionAlignment } from '@/libraries/common/alignment';
import type { InputSocket, Node, OutputSocket, SocketBase } from '@/libraries/nodes';
import { NODES_SOCKET_POSITIONS_KEY, type GraphState, type SocketPositions } from '.';

const props = defineProps<{
    node: Node,
    graph: GraphState
}>();
const node = props.node;

const move = new MoveOperation(p => {
    node.position = p;
}, undefined, new ConstantPositionAlignment(15));

function handleMove(e: PointerEvent) {
    if (e.button !== 0)
        return;
    move.perform(e, node.position);
}

const style = computed(() => {
    return { transform: `translate(${node.position.x}px, ${node.position.y}px)` }
});

const nodeDiv = useTemplateRef<HTMLDivElement>('element');

const relatives: Map<SocketBase, Position> = new Map();
const socketPositions = inject<SocketPositions>(NODES_SOCKET_POSITIONS_KEY);

function updateRelative(socket: SocketBase, position: Position) {
    const rect = nodeDiv.value?.getBoundingClientRect();
    if (!rect)
        return;
    relatives.set(socket, {
        x: position.x - rect.left + 8,
        y: position.y - rect.top + 8
    });
}

function updateGlobalPosition(socket: InputSocket | OutputSocket) {
    if (!socketPositions)
        throw new Error("socket posiitons service is not provided.");
    const relative = relatives.get(socket);
    socketPositions.set(socket, {
        x: node.position.x + (relative?.x || 0),
        y: node.position.y + (relative?.y || 0)
    });
}

function removeGlobalPosition(socket: InputSocket | OutputSocket) {
    if (!socketPositions)
        throw new Error("socket posiitons service is not provided.");
    socketPositions.delete(socket);
}

watch(node, () => {
    props.node.inputs.forEach(updateGlobalPosition);
    props.node.outputs.forEach(updateGlobalPosition);
})

onUnmounted(() => {
    props.node.inputs.forEach(removeGlobalPosition);
    props.node.outputs.forEach(removeGlobalPosition);
})

</script>

<template>
    <div class="node" :style="style" ref="element">
        <div class="title" v-on:pointerdown="handleMove">
            <p>Title</p>
        </div>
        <div class="body">
            <div v-for="item in node.outputs" :key="item.id">
                <SocketLineComponent :socket="item" :graph="graph" :updateRelative="updateRelative" />
            </div>
        </div>
        <slot></slot>
        <div class="body">
            <div v-for="item in node.inputs" :key="item.id">
                <SocketLineComponent :socket="item" :graph="graph" :updateRelative="updateRelative" />
            </div>
        </div>
    </div>
</template>

<style lang="css" scoped>
.node {
    position: absolute;
    transform: translateZ(0);
    will-change: transform;

    min-width: 120px;
    width: max-content;
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