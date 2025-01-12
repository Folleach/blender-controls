<script setup lang="ts">
import type { IWorkspaceAreaProps } from './WorkspaceAreaProps';
import { onMounted, ref, useTemplateRef } from 'vue';
import LeafAreaComponent from './LeafAreaComponent.vue';
import { ContainerArea, LeafArea, Orientation, type Rectangle } from '@/libraries/workspaces';

const props = defineProps<IWorkspaceAreaProps>();
const update = ref(0);

let container = props.area instanceof ContainerArea ? props.area as ContainerArea : undefined;

const leaf = props.area instanceof LeafArea ? props.area : null;

const size = container && `${container.leftSize?.toString()} 2px ${container.rightSize?.toString()}`;
const style = container?.orientation === Orientation.Horizontal ? { gridTemplateColumns: size! } : { gridTemplateRows: size! };

// const ss = props.level ?? 0;
// const debugStyle = {
//   left: `${ss * 10}px`,
//   top: `${ss * 50}px`,
//   right: `${ss * 10}px`,
//   bottom: `${ss * 10}px`,
// }

function updateSize() {
  const size = container && `${container.leftSize?.toString()} 2px ${container.rightSize?.toString()}`;
  if (container?.orientation === Orientation.Horizontal)
    style.gridTemplateColumns = size!
  else if (container?.orientation === Orientation.Vertical)
    style.gridTemplateRows = size!;
}

function updateContainer(newcontainer: ContainerArea) {
  if (!newcontainer) {
    console.error("trying to update container on the leaf");
    return;
  }
  container = newcontainer;
  updateSize();
  update.value++;
}

container?.update.consume(updateContainer);

const containerElement = useTemplateRef<HTMLDivElement>('containerElement');
onMounted(() => {
  const box = containerElement.value?.getBoundingClientRect();
  if (!box)
    return;
  const rectangle: Rectangle = {
    x: box.left + window.scrollX,
    y: box.top + window.scrollY,
    width: box.width,
    height: box.height,
  }
  if (leaf)
    props.workspace.setActualRectangle(leaf, rectangle);
  if (container)
    props.workspace.setActualRectangle(container, rectangle);
})

</script>

<template>
  <div v-if="container" style="height: 100%; background-color: black; position: relative;" ref="containerElement">
    <div class="template inside" :style="style" :key="update">
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
    <LeafAreaComponent :workspace="workspace" :area="area" />
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
