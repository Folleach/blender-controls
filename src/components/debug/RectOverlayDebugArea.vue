<script setup lang="ts">
import { LeafArea, type Rectangle, Workspace } from '@/libraries/workspaces';
import { ref } from 'vue';

const props = defineProps<{ workspace: Workspace }>();

const rects = ref<Rectangle[]>([]);

setInterval(() => {

    const t = [];
    for (const item of props.workspace.rectangles) {
        if (item[0] instanceof LeafArea)
            t.push(item[1]);
    }
    rects.value = t;
}, 1000);

</script>

<template>
    <div class="root">
        <div v-for="(item, index) in rects" :key="index" class="draw"
            :style="{ left: `${item.x}px`, top: `${item.y - 24}px`, width: `${item.width}px`, height: `${item.height}px` }">
        </div>
    </div>
</template>

<style lang="css" scoped>
.root {
    position: relative;
    height: 100%;
}

.draw {
    background-color: hsla(0, 100%, 100%, 0.5);
    position: absolute;
}
</style>