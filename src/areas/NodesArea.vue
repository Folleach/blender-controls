<script setup lang="ts">
import GlobalSpaceComponent from '@/components/nodes/GlobalSpaceComponent.vue';
import NodeComponent from '@/components/nodes/NodeComponent.vue';
import { Menu, MenuLeaf } from '@/libraries/menus';
import { AdHocCommand } from '@/libraries/commands/adhocCommand';
import { v4 } from 'uuid';
import { inject, provide, reactive } from 'vue';
import { CONTEXT_MENU_API, type IContextMenuApi } from '@/libraries/menus/service';
import { Node } from '@/libraries/nodes';
import useGraph, { NODES_SOCKET_POSITIONS_KEY, type SocketPositions } from '@/components/nodes';
import SocketRelationComponent from '@/components/nodes/SocketRelationComponent.vue';
import type { Position } from '@/libraries/workspaces';

const graph = useGraph();
const n1 = new Node("n1", { x: 0, y: 0 });
n1.addOutputSocket("output", "number");

const n2 = new Node("n2", { x: 0, y: 100 });
n2.addInputSocket("input", "number");

graph.addNode(n1);
graph.addNode(n2);

const pointerPosition: Position = { x: 0, y: 0 };
let interactionPosition: Position | undefined;
const menu = new Menu([
    new MenuLeaf("Add", new AdHocCommand(() => {
        const node = new Node(v4());
        node.position.x = interactionPosition?.x ?? 0;
        node.position.y = interactionPosition?.y ?? 0
        node.addInputSocket("input", "number");
        node.addInputSocket("yet another", "number");
        node.addOutputSocket("output", "number");
        graph.addNode(node);
    }))
]);

const menuService = inject<IContextMenuApi>(CONTEXT_MENU_API);

function openMenu(e: PointerEvent) {
    if (e.button !== 2)
        return;
    interactionPosition = {
        x: pointerPosition.x - (pointerPosition.x % 15),
        y: pointerPosition.y - (pointerPosition.y % 15)
    };
    menuService?.set(menu, {});
}

const socketPositions = reactive<SocketPositions>(new Map());
provide(NODES_SOCKET_POSITIONS_KEY, socketPositions);

function setPosition(e: Position) {
    pointerPosition.x = e.x;
    pointerPosition.y = e.y;
}

</script>

<template>
    <div style="height: 100%;" v-on:pointerdown="openMenu">
        <GlobalSpaceComponent @pointer-position="setPosition">
            <SocketRelationComponent v-for="relation in graph.relations()" :relation="relation" :key="relation.id" />
            <NodeComponent v-for="node in graph.nodes()" :node="node" :graph="graph" :key="node.id">
                <p style="margin: 1rem;">Dynamic Content Here</p>
            </NodeComponent>
        </GlobalSpaceComponent>
    </div>

</template>
