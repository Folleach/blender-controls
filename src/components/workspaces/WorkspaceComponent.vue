<script setup lang="ts">
import WorkspaceArea from './WorkspaceArea.vue';
import { provide, ref } from 'vue';
import WorkspaceOverlay from './WorkspaceOverlay.vue';
import type { IOverlayProps } from './WorkspaceAreaProps';
import { WORKSPACE_OVERLAY_KEY, type IWorkspaceOverlayContext } from './OverlayInjection';
import { ContainerArea, LeafArea, Orientation, Workspace } from '@/libraries/workspaces';

const a1 = new LeafArea<string>("hello");
const a2 = new LeafArea<string>("world");
const a3 = new LeafArea<string>("right");
const a4 = new LeafArea<string>("additional");
const c1 = new ContainerArea(Orientation.Vertical, a1, a2);
const c2 = new ContainerArea(Orientation.Horizontal, a3, a4);
const root = new ContainerArea(Orientation.Horizontal, c1, c2);
const workspace = new Workspace(root);

const state = ref<IOverlayProps | undefined>(undefined)
provide<IWorkspaceOverlayContext>(WORKSPACE_OVERLAY_KEY, {
  props: state.value,
  update: v => state.value = v
})
</script>

<template>
  <div class="workspace">
    <div class="inside">
      <WorkspaceArea :overlay="state" :workspace="workspace" :area="workspace.root">hehe</WorkspaceArea>
    </div>
    <div class="inside overlay">
      <WorkspaceOverlay :state="state" />
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
</style>
