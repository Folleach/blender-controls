<script setup lang="ts">
import type { IWorkspaceAreaProps } from './WorkspaceAreaProps';
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import LeafAreaComponent from './LeafAreaComponent.vue';
import { ContainerArea, ContainerUpdateType, LeafArea, Orientation, type Rectangle } from '@/libraries/workspaces';

const props = defineProps<IWorkspaceAreaProps>();

const container = props.area instanceof ContainerArea ? props.area as ContainerArea : undefined;
const forceUpdate = ref(0);
const sizes = ref({
  left: container?.leftSize,
  right: container?.rightSize
});

const leaf = props.area instanceof LeafArea ? props.area : null;
const style = computed(() => {
  const size = container && `${sizes.value.left?.toString()} 2px ${sizes.value.right?.toString()}`;
  return container?.orientation === Orientation.Horizontal ? { gridTemplateColumns: size! } : { gridTemplateRows: size! };
});

// const ss = props.level ?? 0;
// const debugStyle = {
//   left: `${ss * 10}px`,
//   top: `${ss * 50}px`,
//   right: `${ss * 10}px`,
//   bottom: `${ss * 10}px`,
// }

const containerElement = useTemplateRef<HTMLDivElement>('containerElement');

function updateRect() {
  const box = containerElement.value?.getBoundingClientRect();
  if (!box)
    return;
  const rectangle: Rectangle = {
    x: box.left,
    y: box.top,
    width: box.width,
    height: box.height,
  };
  props.workspace.setActualRectangle(leaf ?? container!, rectangle);
}

onMounted(() => {
  if (containerElement.value)
    new ResizeObserver(updateRect).observe(containerElement.value);
})

function updateContainer(newcontainer: ContainerUpdateType) {
  sizes.value = {
    left: container?.leftSize,
    right: container?.rightSize
  }
  if (newcontainer === ContainerUpdateType.Split) {
    forceUpdate.value++;
  }
}

container?.update.consume(updateContainer);

</script>

<template>
  <div v-if="container" style="height: 100%; background-color: black; position: relative;" ref="containerElement">
    <div class="template inside" :style="style" :key="forceUpdate">
      <div class="container">
        <WorkspaceArea :level="level ? level + 1 : 1" :workspace="workspace" :area="container.left"></WorkspaceArea>
      </div>
      <div style="display: grid;"></div>
      <div class="container">
        <WorkspaceArea :level="level ? level + 1 : 1" :workspace="workspace" :area="container.right"></WorkspaceArea>
      </div>
    </div>
    <!-- <div class="debug-inside debug-border" :style="debugStyle">
      <div style="margin: 12px; justify-content: center; display: flex;">
        <h3>({{ container.leftSize.toString() }}, {{ container.rightSize.toString() }})</h3>
      </div>
    </div> -->
  </div>
  <div v-else class="template" ref="containerElement">
    <LeafAreaComponent :workspace="workspace" :area="area" :key="leaf?.context" />
  </div>
</template>

<style scoped>
.template {
  display: grid;
  width: 100%;
  height: 100%;
}

.container {
  border-radius: 0.5em;
  background-color: var(--color-background);
  position: relative;
}

.inside {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}

.debug-inside {
  position: absolute;
  pointer-events: none;
}

.debug-border {
  border: medium dashed green;
  background-color: #0a480e2c;
}
</style>
