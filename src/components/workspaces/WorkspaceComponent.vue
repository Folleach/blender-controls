<script setup lang="ts">
import WorkspaceArea from './WorkspaceArea.vue';
import { isProxy, provide, ref, toRaw, useTemplateRef } from 'vue';
import WorkspaceOverlay from './WorkspaceOverlay.vue';
import type { IOverlayProps } from './WorkspaceAreaProps';
import { WORKSPACE_OVERLAY_KEY, type IWorkspaceOverlayContext } from './OverlayInjection';
import { WorkspaceService } from '@/libraries/workspaces/service';
import { domToRect } from '@/libraries/common/geometry';
import type { Rectangle } from '@/libraries/workspaces';

const props = defineProps<{ service: WorkspaceService }>();
const service = isProxy(props.service) ? toRaw(props.service) : props.service;
let active = service.active();
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

const key = ref(0);
service.update.consume(() => {
  active = service.active();
  key.value++
});
</script>

<template>
  <div v-if="active" class="workspace" :key="key" ref="workspace">
    <div class="inside">
      <WorkspaceArea :overlay="state" :workspace="active" :area="active.root"></WorkspaceArea>
    </div>
    <div class="inside overlay">
      <WorkspaceOverlay :state="state" :get-rect-context="getRectContext" />
    </div>
  </div>
  <div v-if="!active" class="workspace" :key="key">
    <div class="warn">
      <h1>There is an empty workspace here</h1>
    </div>
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
