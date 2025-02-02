<script setup lang="ts">
import { ref } from 'vue';


const contributors = ref<{
    url: string,
    avatar: string
}[] | undefined>();

interface IContributor {
    avatar_url: string,
    gravatar_id: string,
    html_url: string,
    contributions: number,
    type: string
}

async function getContributors() {
    const response = await fetch("https://api.github.com/repos/folleach/blender-controls/contributors");
    const data = await response.json() as IContributor[];
    data.sort((a, b) => b.contributions - a.contributions)
    contributors.value = data.filter(x => x.type.toLocaleLowerCase() === "user").map(x => ({
        url: x.html_url,
        avatar: x.avatar_url
    }));
}

getContributors();

</script>

<template>
    <div class="root">
        <div>
            <h1>Hello <span style="font-family: serif;">^_^</span></h1>
            <p>This is a demo application using the <a
                    href="https://github.com/Folleach/blender-controls"><code>blender-ui</code></a> library!</p>
            <p>Feel free to explore the tabs above to get to know the library better.</p>
            <br />
            <div class="block">
                <h2>Licence</h2>
                <p>Apache-2.0</p>
            </div>
            <div class="block" v-if="contributors">
                <h2>Contributors</h2>
                <div class="contributors">
                    <div v-for="contributor in contributors" :key="contributor.url">
                        <a :href="contributor.url" target="_blank"><img width="64px" :src="contributor.avatar"
                                class="avatar" /></a>
                    </div>
                </div>
            </div>
            <img class="corner-hint" width="80px"
                src="https://s3.folleach.net/blender-controls/static/corner-hint.png" />
            <div class="corner-hint-text">
                <p>Try to pull the corner</p>
                <p>when you see the +</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.root {
    text-align: center;
    font-size: 2em;
    background-color: var(--cl-bg2);
}

.root>div {
    padding-top: 4em;
}

.contributors {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}

.contributors>div {
    margin: 0.5rem;
}

h1,
h3 {
    margin: 1rem;
}

.avatar {
    border-radius: 100%;
}

.block {
    margin-bottom: 2rem;
}

.corner-hint {
    position: absolute;
    right: 0;
    top: 0;
    opacity: 20%;
    user-select: none;
    pointer-events: none;
}

.corner-hint-text {
    position: absolute;
    right: 5rem;
    top: 3rem;
    color: var(--cl-tx2);
    opacity: 30%;
    user-select: none;
}
</style>
