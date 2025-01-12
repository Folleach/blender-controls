<script setup lang="ts">
import MenuContainer from './MenuContainer.vue';


</script>

<template>
  <div class="workspace">
    <h1>Hello</h1>
    <div style="position: absolute; left: 100px; top: 100px;">
      <MenuContainer />
    </div>
  </div>
</template>

<style lang="css" scoped>
.workspace {
  height: 100%;
  position: relative;
}
</style>
