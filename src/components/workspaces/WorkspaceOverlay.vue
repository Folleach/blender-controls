<script setup lang="ts">
import { computed } from 'vue';
import type { IOverlayProps } from './WorkspaceAreaProps';
import { Orientation, WorkspaceOperation } from '@/libraries/workspaces';

const props = defineProps<{
  state: IOverlayProps | undefined
}>();

const style = computed(() => {
  if (!props.state?.rectangle)
    return undefined;
  return {
    left: `${props.state.rectangle.x}px`,
    top: `${props.state.rectangle.y}px`,
    width: `${props.state.rectangle.width}px`,
    height: `${props.state.rectangle.height}px`
  }
});
const line = computed(() => {
  if (!props.state?.rectangle || props.state.operation !== WorkspaceOperation.Split)
    return undefined;
  return {
    left: `${props.state.orientation === Orientation.Horizontal ? props.state.rectangle.x + props.state.size : props.state.rectangle.x}px`,
    top: `${props.state.orientation === Orientation.Horizontal ? props.state.rectangle.y : props.state.rectangle.y + props.state.size}px`,
    width: `${props.state.orientation === Orientation.Horizontal ? 2 : props.state.rectangle.width}px`,
    height: `${props.state.orientation === Orientation.Horizontal ? props.state.rectangle.height : 2}px`
  }
});
</script>

<template>
  <div v-if="style" :style="style" class="overlay"></div>
  <div v-if="line" :style="line" style="background-color: black; position: absolute;"></div>
</template>

<style lang="css" scoped>
.overlay {
  background-color: #e1e1e149;
  position: absolute;
  border-radius: 0.5em;
}
</style>
