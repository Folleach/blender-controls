<script setup lang="ts">
import { computed } from 'vue';
import type { INumberFieldProps } from '.';
import { usePointerLock } from './usePointerLock';
import RightArrowThin from '@/svgs/RightArrowThin.vue';

const props = defineProps<INumberFieldProps>();
const model = defineModel<number>();

const local = computed(() => {
    const denominator = props.denominator ?? 1;
    return {
        denominator,
        fixed: props.scale ?? Math.max(Math.ceil(Math.log10(denominator)), 0)
    }
});

function normal(number: number, denominator: number) {
    const frac = denominator / 1;
    return Math.ceil(frac * number) / frac;
}

function update(relative: number) {
    const value = normal((model.value ?? 0) + (relative * (1 / local.value.denominator)), local.value.denominator);
    model.value = Math.min(Math.max(value, props.min ?? Number.NEGATIVE_INFINITY), props.max ?? Number.POSITIVE_INFINITY);
}

const { requestLock } = usePointerLock({
    onMove: relative => update(relative.x)
})

function down(e: PointerEvent) {
    requestLock(e.currentTarget as HTMLElement);
}

</script>

<template>
    <div class="main hoverable">
        <div @pointerdown="down" class="hoverable" style="cursor: col-resize;" :class="{ right: props.title }">
            <p style="margin: 0 1rem;">{{ (model ?? 0).toFixed(local.fixed) }} {{ unit }}</p>
        </div>
        <div class="arrow hoverable" style="left: 0;" @click="update(-1)" @pointerdown="down">
            <RightArrowThin :width="10" :height="10" style="transform: scaleX(-1);" />
        </div>
        <div class="arrow hoverable" style="right: 0;" @click="update(+1)" @pointerdown="down">
            <RightArrowThin :width="10" :height="10" />
        </div>
        <p style="position: absolute; left: 1rem; top: 0;">
            {{ props.title }}
        </p>
    </div>
</template>

<style lang="css" scoped>
div {
    height: 20px;
}

.main {
    position: relative;
    text-align: center;
    user-select: none;
}

.main:hover .arrow {
    display: block;
}

.hoverable {
    background-color: var(--cl-ui2);
}

.hoverable:hover {
    background-color: var(--cl-ui3);
}

p {
    margin: 0;
}

.arrow {
    position: absolute;
    top: 0;
    width: 14px;
    display: none;
}

.right {
    text-align: right;
}
</style>