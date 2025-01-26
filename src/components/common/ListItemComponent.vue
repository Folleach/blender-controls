<script setup lang="ts">
import type { IListItemProps } from '.';

const props = defineProps<IListItemProps>();

function execute() {
    props.command.execute(props.context);
}

</script>

<template>
    <div class="item" v-on:click="execute">
        <div></div>
        <!-- <DuplicateIcon /> -->
        <p>{{ text }}</p>
        <div></div>
        <p class="help">Ctrl D</p>
    </div>
</template>

<style lang="css" scoped>
.item {
    display: grid;
    grid-template-columns: 1rem auto 1rem max-content;
    gap: 0.25rem;
    align-items: center;
    user-select: none;
}

.item:hover {
    background-color: color-mix(in srgb, white 15%, transparent 85%);
    border-radius: 0.25rem;
}

.help {
    color: color-mix(in srgb, black 40%, white 30%);
}
</style>