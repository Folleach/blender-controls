<script setup lang="ts">
import "./demo.css";

import DebugArea from '@/areas/DebugArea.vue';
import InitArea from '@/areas/InitArea.vue';
import NodesArea from '@/areas/NodesArea.vue';
import MenuSpace from '@/components/menus/MenuSpace.vue';
import { InitAreaService } from '@/components/window';
import { CONTEXT_MENU_API, MenuService, type IContextMenuApi } from '@/libraries/menus/service';
import { INIT_WINDOW_SERVICE_KEY } from '@/libraries/window';
import { InMemoryWorkspaceRepository, WorkspaceService } from '@/libraries/workspaces/service';
import { provide } from 'vue';
import DemoWelcomeArea from './areas/welcome/DemoWelcomeArea.vue';
import { AreaSize, ContainerArea, LeafArea, Orientation, Workspace } from '@/libraries/workspaces';
import DemoSwapArea from './areas/workpaces/DemoSwapArea.vue';
import SwapN1Component from './areas/workpaces/SwapN1Component.vue';
import { DEMO_AREA_CODE, DEMO_AREA_PLACEHOLDER, DEMO_AREA_WORKSPACE_CODE, DEMO_AREA_WORKSPACE_EXAMPLE } from ".";
import DemoWorkspaceExample from "./areas/workpaces/DemoWorkspaceExample.vue";
import DemoWorkspaceCode from "./areas/workpaces/DemoWorkspaceCode.vue";
import MultipleWorkspaceComponent from "@/components/workspaces/MultipleWorkspaceComponent.vue";
import DemoContextCodeArea from "./areas/common/DemoContextCodeArea.vue";
import DemoPlaceholderArea from "./areas/common/DemoPlaceholderArea.vue";
import type { IPlaceholderContext } from "./areas/common";

const menuService = new MenuService();
const initWindowService = new InitAreaService();
initWindowService.registerArea("blen.debug", { name: "Debug" }, () => DebugArea);
initWindowService.registerArea('blen.node-component', { name: "Nodes" }, () => NodesArea)
initWindowService.registerArea("blen.init-window", { name: "Init Area (current)" }, () => InitArea)
initWindowService.registerArea("blen.demo.welcome", { name: "[Demo] Welcome" }, () => DemoWelcomeArea);
initWindowService.registerArea("blen.demo.workspaces.swap", { name: "[Demo] Swap" }, () => DemoSwapArea);
initWindowService.registerArea("blen.demo.workspaces.swap.n1", { name: "[Demo] Swap n1" }, () => SwapN1Component);
initWindowService.registerArea(DEMO_AREA_WORKSPACE_EXAMPLE, { name: "[Demo] Workspace Example" }, () => DemoWorkspaceExample);
initWindowService.registerArea(DEMO_AREA_WORKSPACE_CODE, { name: "[Demo] Workspace Example Code" }, () => DemoWorkspaceCode);
initWindowService.registerArea(DEMO_AREA_CODE, { name: "[Demo] Code Context" }, () => DemoContextCodeArea);
initWindowService.registerArea(DEMO_AREA_PLACEHOLDER, { name: "[Demo] Placeholder" }, () => DemoPlaceholderArea);

// welcome
const welcomeRoot = new LeafArea("blen.demo.welcome", undefined);
const welcomeWorkspace = new Workspace(welcomeRoot);

// workspace
const demoAreaWorkspaceExample = new LeafArea(DEMO_AREA_WORKSPACE_EXAMPLE, undefined);
const demoAreaWorkspaceCode = new LeafArea(DEMO_AREA_WORKSPACE_CODE, undefined);
const demoAreasWorkspaceContainer = new ContainerArea(Orientation.Horizontal, demoAreaWorkspaceCode, demoAreaWorkspaceExample, new AreaSize(2, "fr"), new AreaSize(3, "fr"));

const demoAreaSwapCode = new LeafArea("blen.demo.workspaces.swap", undefined);

const empty = new LeafArea<IPlaceholderContext>(DEMO_AREA_PLACEHOLDER, { title: "Nothing to show here yet." });
const demoAreaSwapCodeWithEmpty = new ContainerArea(Orientation.Horizontal, demoAreaSwapCode, empty, new AreaSize(1, "fr"), new AreaSize(5, "fr"));

const workspaceRoot = new ContainerArea(Orientation.Vertical, demoAreasWorkspaceContainer, demoAreaSwapCodeWithEmpty, new AreaSize(1, "fr"), new AreaSize(1, "fr"));
const workspaceWorkspace = new Workspace(workspaceRoot);

// nodes
const nodesRoot = new LeafArea('blen.node-component', () => NodesArea);
const nodesWorkspace = new Workspace(nodesRoot);

const workspaceService = new WorkspaceService(new InMemoryWorkspaceRepository());
workspaceService.restore().then(async successfully => {
    if (!successfully) {
        const welcome = await workspaceService.add("Welcome", welcomeWorkspace);
        await workspaceService.add("Workspaces", workspaceWorkspace);
        await workspaceService.add("Nodes", nodesWorkspace)
        workspaceService.change(welcome);
    }
});

provide(INIT_WINDOW_SERVICE_KEY, initWindowService);
provide<IContextMenuApi>(CONTEXT_MENU_API, menuService);

</script>

<template>
    <div style="height: 100%;" oncontextmenu="return false">
        <MultipleWorkspaceComponent :service="workspaceService" :menu="menuService" />
        <div style="position: absolute; pointer-events: none;" class="c-full">
            <MenuSpace :service="menuService" />
        </div>
    </div>
</template>

<style>
pre {
    width: fit-content;
}
</style>
