<template>
    <div class="root">
        <div>
            <slot></slot>
        </div>
    </div>
</template>

<style lang="css" scoped>
.root {
    display: flex;
    justify-content: center;
    text-align: center;
    align-items: center;
    margin: 1rem;
}
</style>