<script setup lang="ts">
import type { Position } from '@/libraries/workspaces';
import { computed, onMounted, ref } from 'vue';

const position = ref({ x: 0, y: 0 });
const b1: Position = { x: 0, y: 0 };
const b2: Position = { x: 0, y: 0 };

function handlePointerDown(e: PointerEvent) {
    if (e.button !== 1)
        return;
    e.preventDefault();

    b2.x = position.value.x;
    b2.y = position.value.y;
    b1.x = e.clientX;
    b1.y = e.clientY;

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
};

function handlePointerMove(e: PointerEvent) {
    position.value = {
        x: b2.x + (e.clientX - b1.x),
        y: b2.y + (e.clientY - b1.y),
    }
};

function handlePointerUp() {
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
};

onMounted(() => {
    console.info("render global space");
});

const innerStyle = computed(() => {
    return {
        transform: `translate(${position.value.x}px, ${position.value.y}px)`,
    }
});

</script>

<template>
    <div class='back-plate-soft space' v-on:pointerdown="handlePointerDown">
        <div :style="innerStyle">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped lang="css">
.space {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
}

.space>div {
    position: absolute;
    background-size: 30px 10px;
}

.back-plate-soft {
    background: var(--color-background-soft);
    border-radius: 6px;
}
</style>