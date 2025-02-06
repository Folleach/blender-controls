<script setup lang="ts">
import WorkspaceArea from './WorkspaceArea.vue';
import { provide, ref, useTemplateRef } from 'vue';
import WorkspaceOverlay from './WorkspaceOverlay.vue';
import type { IOverlayProps } from './WorkspaceAreaProps';
import { WORKSPACE_OVERLAY_KEY, type IWorkspaceOverlayContext } from './OverlayInjection';
import { domToRect } from '@/libraries/common/geometry';
import type { Rectangle, Workspace } from '@/libraries/workspaces';

defineProps<{ workspace: Workspace }>();

const workspaceElement = useTemplateRef("workspace");

function getRectContext(): Rectangle | undefined {
  return domToRect(workspaceElement?.value?.getBoundingClientRect());
}

const state = ref<IOverlayProps | undefined>(undefined);
const context: IWorkspaceOverlayContext = {
  props: state.value,
  update: v => state.value = v,
  getRectContext
};
provide<IWorkspaceOverlayContext>(WORKSPACE_OVERLAY_KEY, context);

</script>

<template>
  <div class="workspace" ref="workspace">
    <div class="inside">
      <WorkspaceArea :overlay="state" :workspace="workspace"></WorkspaceArea>
    </div>
    <div class="inside overlay">
      <WorkspaceOverlay :state="state" :get-rect-context="getRectContext" />
    </div>
    <!-- <div class="inside" :style="{ pointerEvents: 'none' }">
      <RectOverlayDebugArea :workspace="workspace" />
    </div> -->
  </div>
</template>

<style lang="css" scoped>
.workspace {
  height: 100%;
  position: relative;
}

.inside {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}

.overlay {
  pointer-events: none;
}

.warn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
