<script setup lang="ts">
import { WORKSPACE_API } from '@/components/workspaces';
import CenteredComponent from '@/demo/common/CenteredComponent.vue';
import { Orientation } from '@/libraries/workspaces';
import { inject, ref, } from 'vue';
import { DEMO_AREA_PLACEHOLDER } from '@/demo';
import type { ISplitApiExampleContext } from '.';
import { v4 } from 'uuid';
import ListSeparator from '@/components/common/ListSeparator.vue';
import BlenItemsGroup from '@/components/common/BlenItemsGroup.vue';
import BlenRawButton from '@/components/buttons/BlenRawButton.vue';

const workspace = inject(WORKSPACE_API);

const holders = ref(workspace?.getContext<ISplitApiExampleContext>()?.holders ?? []);

function split(orientation: Orientation) {
    const id = v4();
    const array = [...holders.value];
    array.push(id);
    holders.value = array;
    workspace?.setContext<ISplitApiExampleContext>({ holders: array });
    // todo: do not destroy this component when split, as the local state is lost.
    // idk how to achieve this because workspace rebuild leaf area to container area
    workspace?.split(orientation, id, DEMO_AREA_PLACEHOLDER, { title: "Lorem ipsum? ^_^", subtitle: id });
}

function close(id: string) {
    if (holders.value) {
        const t = holders.value.filter(x => x !== id);
        holders.value = t;
        workspace?.setContext<ISplitApiExampleContext>({ holders: t });
        workspace?.close(id);
    }
}
</script>

<template>
    <CenteredComponent>
        <h1>Split</h1>
        <p>With this feature you can create areas opening for a while</p>
        <div style="height: 1rem;"></div>
        <BlenItemsGroup :orientation="Orientation.Horizontal">
            <BlenRawButton @click="split(Orientation.Horizontal)">Split Horizontal</BlenRawButton>
            <BlenRawButton @click="split(Orientation.Vertical)">Split Vertical</BlenRawButton>
        </BlenItemsGroup>
        <ListSeparator />
        <BlenItemsGroup :orientation="Orientation.Vertical">
            <BlenRawButton v-for="item in holders" @click="close(item)" :key="item">Close ({{ item.substring(0, 8) }})
            </BlenRawButton>
        </BlenItemsGroup>
    </CenteredComponent>
</template>
