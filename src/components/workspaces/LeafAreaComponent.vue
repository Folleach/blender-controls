<script setup lang="ts">
import { type ILeafAreaProps } from './WorkspaceAreaProps';
import { finishSplit, capture as capture, continuesSplit, resizeArea } from './WorkspaceOperations';
import { inject, provide } from 'vue';
import { WORKSPACE_OVERLAY_KEY, type IWorkspaceOverlayContext } from './OverlayInjection';
import { LeafArea, Side } from '@/libraries/workspaces';
import { WorkspaceApi } from '@/libraries/workspaces/api';
import type { InitAreaService } from '../window';
import { INIT_WINDOW_SERVICE_KEY } from '@/libraries/window';
import { WORKSPACE_API } from '.';

const props = defineProps<ILeafAreaProps>();
const leaf = props.area instanceof LeafArea ? props.area : undefined;

if (!leaf)
  throw { message: "area isn't leaf" }

const overlay = inject<IWorkspaceOverlayContext>(WORKSPACE_OVERLAY_KEY);
const windowService = inject<InitAreaService>(INIT_WINDOW_SERVICE_KEY);
let currentRight = false;
let currentBottom = false;

function performSplit(e: PointerEvent, w: PointerEvent, right: boolean, bottom: boolean) {
  const result = continuesSplit(e, w, props.workspace, right, bottom);
  if (!result || !result.rectangle)
    return;

  overlay?.update(result);
  window.getSelection()?.removeAllRanges();
  currentRight = right;
  currentBottom = bottom;
}

function performResize(w: PointerEvent, side: Side) {
  if (!leaf)
    return;
  resizeArea(w, props.workspace, leaf, side);
  window.getSelection()?.removeAllRanges();
}

function finish() {
  overlay?.update(undefined);
  finishSplit(props.workspace, currentRight, currentBottom);
}

const component = windowService?.create(leaf.windowId);

provide(WORKSPACE_API, new WorkspaceApi(props.workspace, leaf));

</script>

<template>
  <div class="leaf">
    <component :is="component" />
  </div>
  <div class="corner"
    v-on:pointerdown="(e) => capture(e, workspace, overlay?.getRectContext(), (w) => performSplit(e, w, false, false), finish)">
  </div>
  <div class="corner top-right"
    v-on:pointerdown="(e) => capture(e, workspace, overlay?.getRectContext(), (w) => performSplit(e, w, true, false), finish)">
  </div>
  <div class="corner bottom-left"
    v-on:pointerdown="(e) => capture(e, workspace, overlay?.getRectContext(), (w) => performSplit(e, w, false, true), finish)">
  </div>
  <div class="corner bottom-right"
    v-on:pointerdown="(e) => capture(e, workspace, overlay?.getRectContext(), (w) => performSplit(e, w, true, true), finish)">
  </div>
  <div class="side top"
    v-on:pointerdown="(e) => capture(e, workspace, overlay?.getRectContext(), w => performResize(w, Side.Top))">
  </div>
  <div class="side right"
    v-on:pointerdown="(e) => capture(e, workspace, overlay?.getRectContext(), w => performResize(w, Side.Right))">
  </div>
  <div class="side bottom"
    v-on:pointerdown="(e) => capture(e, workspace, overlay?.getRectContext(), w => performResize(w, Side.Bottom))">
  </div>
  <div class="side left"
    v-on:pointerdown="(e) => capture(e, workspace, overlay?.getRectContext(), w => performResize(w, Side.Left))">
  </div>
</template>

<style lang="css" scoped>
.splitter {
  width: 100%;
  height: 100%;
}

.leaf {
  overflow: auto;
  overflow-y: auto;
  height: 100%;
  background: var(--cl-bg2);
}

.corner {
  width: 6px;
  height: 6px;
  position: absolute;
  cursor: crosshair;
  user-select: none;
}

.side {
  position: absolute;
  user-select: none;
}

.top-right {
  right: 0;
}

.bottom-right {
  bottom: 0;
  right: 0;
}

.bottom-left {
  bottom: 0;
}

.top {
  left: 6px;
  height: 6px;
  width: calc(100% - 12px);
  cursor: row-resize;
}

.right {
  top: 6px;
  right: 0;
  height: calc(100% - 12px);
  width: 6px;
  cursor: col-resize;
}

.bottom {
  left: 6px;
  bottom: 0;
  height: 6px;
  width: calc(100% - 12px);
  cursor: row-resize;
}

.left {
  top: 6px;
  height: calc(100% - 12px);
  width: 6px;
  cursor: col-resize;
}
</style>
