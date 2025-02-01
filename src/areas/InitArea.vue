<script setup lang="ts">
import { INIT_WINDOW_SERVICE_KEY } from '@/libraries/window';
import type { IWorkspaceApiProps } from '@/libraries/workspaces/api';
import { inject } from 'vue';
import type { InitAreaService } from '../components/window';
import ListItemComponent from '@/components/common/ListItemComponent.vue';
import { AdHocCommand } from '@/libraries/commands/adhocCommand';
import ListContainer from '@/components/common/ListContainer.vue';

const workspace = defineProps<IWorkspaceApiProps>();

const service = inject<InitAreaService>(INIT_WINDOW_SERVICE_KEY)

function open(id: string) {
    workspace.api.swap(id);
}

</script>

<template>
    <div v-if="service">
        <ListContainer header="Available Areas">
            <div v-for="item in service.getAreas()" :key="item.id">
                <ListItemComponent :command="new AdHocCommand(() => open(item.id))" :text="item.name" :context="{}" />
            </div>
        </ListContainer>
    </div>
</template>

<style lang="css" scoped>
.container {
    margin: 0.5rem;
}
</style>
