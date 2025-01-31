<script setup lang="ts">
import CircleSocket from '@/svgs/sockets/CircleSocket.vue';
import { onMounted, useTemplateRef } from 'vue';
import type { ISocketLineProps } from '.';
import { InputSocket, OutputSocket } from '@/libraries/nodes';
import type { ISocketDragAndDrop } from '@/libraries/nodes/api';

const props = defineProps<ISocketLineProps>();

function dragStart(e: DragEvent) {
    const current: ISocketDragAndDrop = {
        nodeId: props.socket.node.id,
        socketId: props.socket.id
    };
    e.dataTransfer?.setData("application/json", JSON.stringify(current));
    e.dataTransfer?.setDragImage(document.createElement('div'), 0, 0);
}

function dragEnd(e: DragEvent) {
    const data = e.dataTransfer?.getData("application/json");
    if (!data)
        return;
    const value = JSON.parse(data) as ISocketDragAndDrop;
    const available = props.socket instanceof OutputSocket ? props.graph.graph.value.getNode(value.nodeId)?.inputs : props.graph.graph.value.getNode(value.nodeId)?.outputs;
    const target = available?.find(x => x.id === value.socketId);
    if (!target) {
        console.warn("todo: failed to link same sockets");
        return;
    }
    if (props.socket instanceof OutputSocket && target instanceof InputSocket) {
        props.graph.link(props.socket, target);
        return;
    }
    if (props.socket instanceof InputSocket && target instanceof OutputSocket) {
        props.graph.link(target, props.socket);
        return;
    }
    console.warn("failed to link sockets");
}

function dragOver(e: DragEvent) {
    e.preventDefault();
}

const element = useTemplateRef<HTMLDivElement>('element');

function updateSocket() {
    const rect = element.value?.getBoundingClientRect();
    if (!rect || !props.updateRelative)
        return;
    props.updateRelative(props.socket, { x: rect.left, y: rect.top });
}

onMounted(() => {
    if (element.value)
        new ResizeObserver(updateSocket).observe(element.value);

    updateSocket();
});

</script>

<template>
    <div v-if="(props.socket instanceof InputSocket)" class="line" ref="element">
        <div class="socket" v-on:drop="dragEnd" v-on:dragover="dragOver">
            <CircleSocket color="var(--flexoki-orange-600)" />
        </div>
        <div>
            <p>{{ socket.id }}</p>
        </div>
        <div></div>
    </div>
    <div v-else class="line">
        <div></div>
        <div style="text-align: right;">
            <p>{{ socket.id }}</p>
        </div>
        <div class="socket" v-on:dragstart="dragStart" :draggable="true" ref="element">
            <CircleSocket color="var(--flexoki-blue-600)" />
        </div>
    </div>
</template>

<style lang="css" scoped>
.line {
    display: grid;
    grid-template-columns: 12px auto 12px;
}

.line>div>svg {
    align-self: center;
}
</style>