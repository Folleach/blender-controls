<script setup lang="ts">
import { WORKSPACE_API } from '@/components/workspaces';
import CenteredComponent from '@/demo/common/CenteredComponent.vue';
import { inject } from 'vue';

const workspace = inject(WORKSPACE_API);

function open() {
    workspace?.swapTo("blen.demo.workspaces.swap");
}

</script>

<template>
    <CenteredComponent>
        <h1>That's how Swap works! ^_^</h1>
        <p> There is nothing left of the previous area.</p>
        <p>But! You can bring her back!</p>
        <button style="margin-top: 1rem;" @click="open">Swap back ʕノ•ᴥ•ʔノ ︵ ┻━┻</button>
    </CenteredComponent>
</template>
