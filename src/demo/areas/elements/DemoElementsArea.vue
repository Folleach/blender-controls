<script setup lang="ts">
import BlenButton from '@/components/buttons/BlenButton.vue';
import BlenRawButton from '@/components/buttons/BlenRawButton.vue';
import BlenItemsGroup from '@/components/common/BlenItemsGroup.vue';
import BelnNumberField from '@/components/fields/BelnNumberField.vue';
import BlenRawNumberField from '@/components/fields/BlenRawNumberField.vue';
import { Orientation } from '@/libraries/workspaces';
import { ref } from 'vue';

const buttonsCounter = ref(0);

const numberFieldsValue = ref(50);

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

        <div>
            <h2>Number Fields</h2>
            <div class="one">
                <p>Current: {{ numberFieldsValue }}</p>
                <BelnNumberField unit="px" v-model="numberFieldsValue"></BelnNumberField>
            </div>
            <div class="one">
                <p>With Denominator = 100</p>
                <BelnNumberField :unit="'\u00B0'" :denominator="100" :model-value="24.56"></BelnNumberField>
            </div>
            <div class="one">
                <p>With Denominator = 4</p>
                <BelnNumberField :unit="'\u00B0'" :denominator="4" :scale="2" :model-value="24.25">
                </BelnNumberField>
            </div>

            <div class="one">
                <p>With Scale = 3</p>
                <p style="color: var(--cl-tx2)">If the scale isn't specified, it will be selected automatically.</p>
                <BelnNumberField :unit="'\u00B0'" :denominator="100" :scale="3" :model-value="24.25">
                </BelnNumberField>
            </div>
            <div class="one">
                <p>With Range [0, 100]</p>
                <BelnNumberField unit="%" :min="0" :max="100"></BelnNumberField>
            </div>
            <div class="one">
                <p>Grouped Fields</p>
                <BlenItemsGroup :orientation="Orientation.Vertical">
                    <BlenRawNumberField title="X" unit="m"></BlenRawNumberField>
                    <BlenRawNumberField title="Y" unit="m"></BlenRawNumberField>
                    <BlenRawNumberField title="Z" unit="m"></BlenRawNumberField>
                </BlenItemsGroup>
            </div>
            <div class="one" style="color: var(--cl-tx2);">
                <p>Are you using Firefox?</p>
                <p>See <a href="https://superuser.com/a/1209405" target="_blank">this</a> to disable notification when
                    changing the number field</p>
            </div>
        </div>
    </div>
</template>

<style lang="css" scoped>
.root {
    display: grid;
    grid-template-columns: 200px 200px;
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
