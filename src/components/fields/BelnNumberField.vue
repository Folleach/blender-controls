<script setup lang="ts">
import { Orientation } from '@/libraries/workspaces';
import type { INumberFieldProps } from '.';
import BlenItemsGroup from '../common/BlenItemsGroup.vue';
import BlenRawNumberField from './BlenRawNumberField.vue';

const props = defineProps<INumberFieldProps>();
const model = defineModel<number>();
</script>

<template>
    <BlenItemsGroup :orientation="Orientation.Horizontal">
        <BlenRawNumberField v-bind="props" v-model="model">
            <slot></slot>
        </BlenRawNumberField>
    </BlenItemsGroup>
</template>
