<script setup lang="ts">
import { Orientation } from '@/libraries/workspaces';
import type { IItemsGroupProps } from '.';

defineProps<IItemsGroupProps>();
</script>

<template>
    <div
        :class="{ horizontal: orientation === Orientation.Horizontal, vertical: orientation === Orientation.Vertical }">
        <slot></slot>
    </div>
</template>

<style lang="css" scoped>
div {
    border-radius: 0.2rem;
    overflow: hidden;
    display: grid;
    gap: 1px;
}

.horizontal {
    grid-auto-flow: column;
}

.vertical {
    grid-auto-flow: row;
}
</style>
