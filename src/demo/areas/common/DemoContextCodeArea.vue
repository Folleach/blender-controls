<script setup lang="ts">
import { WORKSPACE_API } from '@/components/workspaces';
import CodeComponent from '@/demo/common/CodeComponent.vue';
import { inject } from 'vue';
import type { ICodeContext } from '.';

const workspace = inject(WORKSPACE_API);

</script>

<template>
    <CodeComponent>
        <pre>{{ workspace?.getContext<ICodeContext>()?.code ?? "code is not present" }}</pre>
    </CodeComponent>
</template>
