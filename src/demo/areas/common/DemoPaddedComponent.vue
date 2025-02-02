<template>
    <div style="height: 100%;" class="svg-pattern-container">
        <div style="background-position: 16px 16px; height: 100%; overflow: hidden;" class="svg-pattern-container">
            <div style="height: 100%; padding: 2rem;">
                <slot></slot>
            </div>
        </div>
    </div>
</template>

<style lang="css" scoped>
.svg-pattern-container {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><line x1="0" y1="32" x2="32" y2="0" stroke="%23222" stroke-width="6" stroke-linecap="square" /></svg>');
    background-repeat: repeat;
}
</style>