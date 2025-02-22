<script setup lang="ts">
import { Orientation } from '@/libraries/workspaces';
import type { IButtonProps } from '.';
import BlenItemsGroup from '../common/BlenItemsGroup.vue';
import BlenRawButton from './BlenRawButton.vue';

const props = defineProps<IButtonProps>();

</script>

<template>
    <BlenItemsGroup :orientation="Orientation.Horizontal">
        <BlenRawButton v-bind="props">
            <slot></slot>
        </BlenRawButton>
    </BlenItemsGroup>
</template>
