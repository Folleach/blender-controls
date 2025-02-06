<script setup lang="ts">
import type { WorkspaceService } from '@/libraries/workspaces/service';
import { isProxy, ref, toRaw } from 'vue';
import WorkspaceComponent from './WorkspaceComponent.vue';
import type { IContextMenuApi } from '@/libraries/menus/service';
import WorkspaceTabList from './WorkspaceTabList.vue';

const props = defineProps<{
    service: WorkspaceService,
    menu: IContextMenuApi,
}>()
const service = isProxy(props.service) ? toRaw(props.service) : props.service;

let active = service.active();

const key = ref(0);
service.update.consume('workspace', () => {
    active = service.active();
    key.value++
});

</script>

<template>
    <div :key="key" style="display: grid; grid-template-rows: auto 1fr; height: 100%;">
        <WorkspaceTabList :service="service" :menu-service="menu" />
        <div v-if="active" style="height: 100%;">
            <WorkspaceComponent :workspace="active" />
        </div>
        <div v-if="!active" class="workspace" :key="key">
            <div class="warn">
                <h1>There is an empty workspace here</h1>
            </div>
        </div>
    </div>
</template>

<style lang="css" scoped>
.workspace {
    height: 100%;
    position: relative;
}
</style>