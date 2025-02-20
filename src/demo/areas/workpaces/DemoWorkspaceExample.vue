<script setup lang="ts">
import WorkspaceComponent from '@/components/workspaces/WorkspaceComponent.vue';
import { AreaSize, ContainerArea, LeafArea, Orientation, Workspace } from '@/libraries/workspaces';
import type { IPlaceholderContext } from '../common';
import DemoPaddedComponent from '../common/DemoPaddedComponent.vue';
import { DEMO_AREA_PLACEHOLDER } from '@/demo';
import { v4 } from 'uuid';

const first = new LeafArea<IPlaceholderContext>(v4(), DEMO_AREA_PLACEHOLDER, { title: "This is left side", subtitle: "There's a right side ->" });
const second = new LeafArea<IPlaceholderContext>(v4(), DEMO_AREA_PLACEHOLDER, { title: "Yes, I'm the right side" });
const container = new ContainerArea(Orientation.Horizontal, first, second, new AreaSize(2, "fr"), new AreaSize(1, "fr"));
const workspace = new Workspace(container);

</script>

<template>
    <DemoPaddedComponent>
        <WorkspaceComponent :workspace="workspace" />
    </DemoPaddedComponent>
</template>
