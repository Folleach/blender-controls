<script setup lang="ts">
import type { Size } from '@/libraries/common/geometry';

const props = defineProps<Size>();
</script>

<template>
    <svg v-bind="props" viewBox="0 0 700 1100" xmlns="http://www.w3.org/2000/svg">
        <g fill="#fff">
            <path
                d="m53.494141 601.99414a.50005.50005 0 0 0 -.347657.85938l3.646485 3.64648-3.646485 3.64648a.50005.50005 0 1 0 .707032.70704l4-4a.50005.50005 0 0 0 0-.70704l-4-4a.50005.50005 0 0 0 -.359375-.15234z"
                transform="matrix(100 0 0 100 -5199.6393 -60100.06299999999)" />
        </g>
    </svg>
</template>