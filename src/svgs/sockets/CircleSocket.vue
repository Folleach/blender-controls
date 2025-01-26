<script setup lang="ts">
defineProps<{ color: string }>();
</script>

<template>
    <svg width="12px" height="12px">
        <circle class="socket-style" cx="6px" cy="6px" r="5px" :fill="color" />
    </svg>
</template>

<style>
.socket-style {
    stroke-width: 1.5px;
    stroke: var(--cl-bg2)
}
</style>