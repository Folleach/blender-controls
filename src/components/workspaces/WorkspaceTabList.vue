<script setup lang="ts">
import { Menu, MenuLeaf } from '@/libraries/menus';
import type { ITab, ITabListProps } from '../tabs';
import type { IWorkspaceTabListProps } from './WorkspaceAreaProps';
import { AdHocCommand } from '@/libraries/commands/adhocCommand';
import { Workspace } from '@/libraries/workspaces';
import { ref } from 'vue';
import TabList from '../tabs/TabList.vue';
import type { IWorkspaceIndex } from '@/libraries/workspaces/service';

const props = defineProps<IWorkspaceTabListProps>();

const tabs = ref<ITabListProps>();

const appendMenu = new Menu([
    new MenuLeaf("Add", new AdHocCommand(() => {
        props.service.add("the next", Workspace.buildDefault())
    }))
])

const contextMenu = new Menu([
    new MenuLeaf("Duplicate (not impl yet)", new AdHocCommand(() => {
    })),
    new MenuLeaf("Delete", new AdHocCommand(context => {
        const index = <IWorkspaceIndex>context;
        props.service.remove(index.id);
    }))
])

props.service.update.consume(() => {
    const current = props.service._active;
    const t: ITab[] = [...props.service.getIndex().map(x => {
        const tab: ITab = {
            text: x.name,
            active: x.id === current,
            execute: () => props.service.change(x.id),
            contextMenu: () => props.menuService.set(contextMenu, x)
        }
        return tab;
    })];
    tabs.value = {
        tabs: t,
        append: () => props.menuService.set(appendMenu, {}),
    }
});

</script>

<template>
    <div>
        <div v-if="tabs" style="background: #000;">
            <TabList :tabs="tabs.tabs" :append="tabs.append" />
        </div>
    </div>
</template>
