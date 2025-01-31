<script setup lang="ts">
import { computed, inject } from 'vue';
import { NODES_SOCKET_POSITIONS_KEY, type SocketPositions } from '.';
import JointComponent from './JointComponent.vue';
import type { SocketRelation } from '@/libraries/nodes';

const props = defineProps<{
    relation: SocketRelation
}>();

const socketPositions = inject<SocketPositions>(NODES_SOCKET_POSITIONS_KEY)!;

const from = computed(() =>
    socketPositions.get(props.relation.from) || { x: 0, y: 0 }
);

const to = computed(() =>
    socketPositions.get(props.relation.to) || { x: 0, y: 0 }
);
</script>

<template>
    <JointComponent :from="from" :to="to" />
</template>
