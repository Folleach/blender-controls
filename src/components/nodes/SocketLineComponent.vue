<script setup lang="ts">
import CircleSocket from '@/svgs/sockets/CircleSocket.vue';
import type { ISocketLineProps } from '.';

defineProps<ISocketLineProps>();

function dragStart(e: DragEvent) {
    e.dataTransfer?.setData("text/plain", "hello");
    e.dataTransfer?.setDragImage(document.createElement('svg'), 0, 0);
}

function dragMove(e: DragEvent) {
}

function dragEnd(e: DragEvent) {
    console.log(e.dataTransfer?.getData("text/plain"));
}

function dragOver(e: DragEvent) {
    e.preventDefault();
}

</script>

<template>
    <div v-if="input" class="line">
        <div class="socket" v-on:drop="dragEnd" v-on:dragover="dragOver">
            <CircleSocket color="var(--flexoki-orange-600)" />
        </div>
        <div>
            <p>{{ socket.id }}</p>
        </div>
        <div></div>
    </div>
    <div v-if="!input" class="line">
        <div></div>
        <div>
            <p>{{ socket.id }}</p>
        </div>
        <div class="socket" v-on:dragstart="dragStart" :draggable="true">
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