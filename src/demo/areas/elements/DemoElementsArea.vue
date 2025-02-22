<script setup lang="ts">
import BlenButton from '@/components/buttons/BlenButton.vue';
import BlenRawButton from '@/components/buttons/BlenRawButton.vue';
import BlenItemsGroup from '@/components/common/BlenItemsGroup.vue';
import { Orientation } from '@/libraries/workspaces';
import { ref } from 'vue';

const buttonsCounter = ref(0);

</script>

<template>
    <div class="root">
        <div>
            <h2>Buttons</h2>
            <div class="one">
                <BlenRawButton>Raw Button</BlenRawButton>
            </div>
            <div class="one">
                <BlenButton>Default Button</BlenButton>
            </div>
            <div class="one">
                <BlenItemsGroup :orientation="Orientation.Horizontal">
                    <BlenRawButton>Grouped</BlenRawButton>
                    <BlenRawButton>Buttons</BlenRawButton>
                </BlenItemsGroup>
            </div>
            <div class="one">
                <BlenItemsGroup :orientation="Orientation.Vertical">
                    <BlenRawButton>Vertical</BlenRawButton>
                    <BlenRawButton>Grouped</BlenRawButton>
                    <BlenRawButton>Buttons</BlenRawButton>
                </BlenItemsGroup>
            </div>
            <div class="one">
                <p>Counter: {{ buttonsCounter }}</p>
                <BlenButton @click="buttonsCounter++">Click</BlenButton>
            </div>
        </div>
    </div>
</template>

<style lang="css" scoped>
.root {
    display: grid;
    grid-template-columns: 200px auto;
    gap: 2rem;
    margin: 2rem;
}

h2 {
    text-align: center;
}

.one {
    margin: 1rem 0;
}
</style>
