<script setup lang="ts">
import AddIcon from '@/svgs/AddIcon.vue';
import { type ITab, type ITabListProps } from '.';

defineProps<ITabListProps>();

function onContext(e: PointerEvent, tab: ITab) {
    if (e.button !== 2)
        return false;
    e.stopPropagation();
    if (tab.contextMenu)
        tab.contextMenu();
}

</script>

<template>
    <div class="container">
        <div v-for="(item, index) in tabs" class="tab" :key="index" v-on:click="item.execute"
            v-on:pointerdown="e => onContext(e, item)"
            :style="{ backgroundColor: item.active ? '#333' : '', color: item.active ? 'white' : '' }">
            <p>{{ item.text }}</p>
        </div>
        <div v-if="append" class="tab" :onclick="append">
            <AddIcon />
        </div>
    </div>
</template>

<style scoped lang="css">
.container {
    display: flex;
    gap: 0.15rem;
    user-select: none;
    overflow-x: scroll;
}

.tab {
    background-color: #222;
}

.tab:hover {
    background-color: #272727;
}

p {
    margin: 0.15rem 0.5rem;
}
</style>