<script setup lang="ts">
import type { IWorkspaceAreaProps } from './WorkspaceAreaProps';
import { computed, inject, ref, useTemplateRef, watch, } from 'vue';
import LeafAreaComponent from './LeafAreaComponent.vue';
import { ContainerArea, LeafArea, Orientation, type Rectangle } from '@/libraries/workspaces';
import { capture, resizeArea } from './WorkspaceOperations';
import { WORKSPACE_OVERLAY_KEY, type IWorkspaceOverlayContext } from './OverlayInjection';
import { CONTEXT_MENU_API } from '@/libraries/menus/service';
import { Menu, MenuLeaf } from '@/libraries/menus';
import { AdHocCommand } from '@/libraries/commands/adhocCommand';

const props = defineProps<IWorkspaceAreaProps>();

function current() {
  return props.area ?? props.workspace.root;
}

const updateTrigger = ref(0);
const leafKey = ref(0);

const containerElement = useTemplateRef<HTMLDivElement>('containerElement');

function updateRect() {
  const box = containerElement.value?.getBoundingClientRect();
  if (!box) {
    return;
  }
  const rectangle: Rectangle = {
    x: box.left,
    y: box.top,
    width: box.width,
    height: box.height,
  };
  props.workspace.setActualRectangle(model.value.leaf ?? model.value.container!, rectangle);
}

const model = computed(() => {
  const area = current();
  area.update.consume({}, () => updateTrigger.value++);

  const container = area instanceof ContainerArea ? area as ContainerArea : undefined;
  const sizes = { left: container?.leftSize, right: container?.rightSize };
  const size = container && `${sizes.left?.toString()} 2px ${sizes.right?.toString()}`;
  // i'm just a clown
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = updateTrigger.value;
  return {
    container: container,
    leaf: area instanceof LeafArea ? area : undefined,
    containerStyle: container?.orientation === Orientation.Horizontal ? { gridTemplateColumns: size! } : { gridTemplateRows: size! }
  }
});

// const ss = props.level ?? 0;
// const debugStyle = {
//   left: `${ss * 10}px`,
//   top: `${ss * 50}px`,
//   right: `${ss * 10}px`,
//   bottom: `${ss * 10}px`,
// }

watch(model, updateRect);
watch(containerElement, () => {
  if (containerElement.value)
    new ResizeObserver(updateRect).observe(containerElement.value);
});
watch([() => model.value.leaf?.windowId, () => model.value.leaf?.context], () => leafKey.value++);

const overlay = inject<IWorkspaceOverlayContext>(WORKSPACE_OVERLAY_KEY);
const menuApi = inject(CONTEXT_MENU_API);

const menu = new Menu([
  new MenuLeaf("Swap Areas", new AdHocCommand(c => {
    const context = <{ area: ContainerArea }>c;
    if (!context.area)
      return;
    props.workspace.swapTree(context.area);
  }))
]);

function performResize(e: PointerEvent) {
  resizeArea(e, props.workspace, current());
  window.getSelection()?.removeAllRanges();
}

function onResizeDown(e: PointerEvent) {
  if (e.button === 0) {
    capture(e, props.workspace, overlay?.getRectContext(), performResize);
    return;
  }
  if (e.button === 2 && model.value.container) {
    showResizeContext(model.value.container);
    return;
  }
}

function showResizeContext(area: ContainerArea) {
  menuApi?.set(menu, { area });
}

</script>

<template>
  <div v-if="model.container" class="root">
    <div class="template inside" :style="model.containerStyle" ref="containerElement">
      <div class="container">
        <WorkspaceArea :level="level ? level + 1 : 1" :workspace="workspace" :area="model.container.left">
        </WorkspaceArea>
      </div>
      <div class="separator"
        :style="{ cursor: model.container.orientation === Orientation.Horizontal ? 'col-resize' : 'row-resize' }"
        @pointerdown="onResizeDown"></div>
      <div class="container">
        <WorkspaceArea :level="level ? level + 1 : 1" :workspace="workspace" :area="model.container.right">
        </WorkspaceArea>
      </div>
    </div>
    <!-- <div class="debug-inside debug-border" :style="debugStyle">
      <div style="margin: 12px; justify-content: center; display: flex;">
        <h3>({{ container.leftSize.toString() }}, {{ container.rightSize.toString() }})</h3>
      </div>
    </div> -->
  </div>
  <div v-else class="template" ref="containerElement">
    <LeafAreaComponent :workspace="workspace" :area="current()" :key="leafKey" @resize-context="showResizeContext" />
  </div>
</template>

<style scoped>
.root {
  height: 100%;
  background-color: var(--cl-bg);
  position: relative;
}

.template {
  display: grid;
  width: 100%;
  height: 100%;
}

.container {
  border-radius: 0.5em;
  background-color: var(--cl-bg2);
  position: relative;
  overflow: auto;
}

.separator {
  display: grid;
  height: 100%;
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
