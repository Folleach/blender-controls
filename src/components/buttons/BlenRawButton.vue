<script setup lang="ts">
import type { IButtonProps } from '.';

defineProps<IButtonProps>();
</script>

<template>
    <button @click="onClick">
        <slot></slot>
    </button>
</template>

<style lang="css" scoped>
button {
    border-style: none;
    height: 20px;
    background-color: var(--cl-ui2);
    color: var(--cl-tx-abs);
}

button:hover {
    background-color: var(--cl-ui3);
}

button:active {
    background-color: var(--cl-accent);
}
</style>
