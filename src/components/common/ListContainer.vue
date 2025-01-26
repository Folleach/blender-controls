<script setup lang="ts">
import type { IListContainerProps } from '.';
import ListSeparator from './ListSeparator.vue';

defineProps<IListContainerProps>();

</script>

<template>
    <div class="root">
        <h3>{{ header }}</h3>
        <ListSeparator />
        <slot></slot>
    </div>
</template>

<style lang="css" scoped>
.root {
    margin: 0.35rem 0.5rem;
}
</style>