<script setup lang="ts">
import WorkspaceComponent from './components/workspaces/WorkspaceComponent.vue';

const broadcast = new BroadcastChannel('channel');
broadcast.addEventListener('message', (a: MessageEvent<{ message: string }>) => {
  console.info(a.data.message)
});

broadcast.postMessage({
  message: "hello!!!"
})
</script>

<template>
  <div style="height: 100%; position: relative;">
    <div style="position: absolute;" class="c-full">
      <WorkspaceComponent />
    </div>
    <!-- <div style="position: absolute;" class="c-full">
      <MenuSpace />
    </div> -->
  </div>
</template>

<style scoped></style>
