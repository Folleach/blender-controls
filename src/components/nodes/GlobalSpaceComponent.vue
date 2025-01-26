<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { MoveOperation } from '../../libraries/common/operations/MoveOperation';

const position = ref({ x: 0, y: 0 });
const move: MoveOperation = new MoveOperation(p => position.value = p, () => {
    document.getElementById('app')!.style.cursor = "default";
});

function handlePointerDown(e: PointerEvent) {
    if (e.button !== 1) return;
    e.preventDefault();
    move.perform(e, position.value);
    document.getElementById('app')!.style.cursor = "move";
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