<script setup lang="ts">
import { inject } from 'vue';
import { type IMenuSpaceInternal, MENU_SPACE_OVERLAY_KEY, type IMenuItemProps } from '.';

const props = defineProps<IMenuItemProps>();

const internal = inject<IMenuSpaceInternal>(MENU_SPACE_OVERLAY_KEY);

function execute() {
    if (!internal)
        return;
    props.item.command.execute(internal.service.context);
    internal?.service.reset();
}
</script>

<template>
    <div class="item" v-on:click="execute">
        <div></div>
        <!-- <DuplicateIcon /> -->
        <p>{{ $props.item.text }}</p>
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
}

.help {
    color: color-mix(in srgb, black 40%, white 30%);
}
</style>