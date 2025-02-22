<script setup lang="ts">
import BlenButton from '@/components/buttons/BlenButton.vue';
import { WORKSPACE_API } from '@/components/workspaces';
import CenteredComponent from '@/demo/common/CenteredComponent.vue';
import CodeComponent from '@/demo/common/CodeComponent.vue';
import { inject } from 'vue';

const code = atob("PHNjcmlwdCBzZXR1cCBsYW5nPSJ0cyI+CmltcG9ydCB7IFdPUktTUEFDRV9BUEkgfSBmcm9tICdAL2NvbXBvbmVudHMvd29ya3NwYWNlcyc7CmltcG9ydCB7IGluamVjdCB9IGZyb20gJ3Z1ZSc7Cgpjb25zdCB3b3Jrc3BhY2UgPSBpbmplY3QoV09SS1NQQUNFX0FQSSk7CgpmdW5jdGlvbiBvcGVuKCkgewogICAgd29ya3NwYWNlPy5zd2FwKCJibGVuLmRlbW8ud29ya3NwYWNlcy5zd2FwLm4xIik7Cn0KCjwvc2NyaXB0PgoKPHRlbXBsYXRlPgogICAgPGJ1dHRvbiBAY2xpY2s9Im9wZW4iPlN3YXAgbWU8L2J1dHRvbj4KPC90ZW1wbGF0ZT4K");

const workspace = inject(WORKSPACE_API);

function open() {
    workspace?.swapTo("blen.demo.workspaces.swap.n1");
}

</script>

<template>
    <CenteredComponent>
        <h1>Swap</h1>
        <CodeComponent>
            <pre>{{ code }}</pre>
        </CodeComponent>
        <BlenButton @click="open">Swap me</BlenButton>
    </CenteredComponent>
</template>
