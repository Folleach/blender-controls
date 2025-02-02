<script setup lang="ts">
import { WORKSPACE_API } from '@/components/workspaces';
import { inject } from 'vue';
import type { IPlaceholderContext } from '.';

const workspace = inject(WORKSPACE_API);

const context = workspace?.getContext<IPlaceholderContext>() ?? {
    title: "Context Is Not Present"
}

</script>

<template>
    <div style="justify-content: center; height: 100%; align-items: center; display: flex; text-align: center;">
        <div>
            <h2>{{ context.title }}</h2>
            <p v-if="context.subtitle">{{ context.subtitle }}</p>
        </div>
    </div>
</template>
