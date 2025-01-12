<script setup lang="ts">
import { ContainerArea, LeafArea } from '@/libraries/workspaces';
import type { ILeafAreaProps } from '../workspaces/WorkspaceAreaProps';


const props = defineProps<ILeafAreaProps>();
const leaf = props.area instanceof LeafArea ? props.area : undefined;

if (!leaf)
  throw { message: "area isn't leaf" }

const parent = props.workspace.parents.get(leaf) as ContainerArea;

</script>

<template>
  <h1>({{ parent.leftSize.toString() }}, {{ parent.rightSize.toString() }})</h1>
  <h2>{{ }}</h2>
</template>
