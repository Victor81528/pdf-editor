<script setup>
import { ref } from 'vue'

import Select from '../components/Select.vue'
import Editor from '../components/Editor.vue'

const selected = ref(false)

</script>

<template>
<div id="home">
    <!-- <component :is="selected ? Editor : Select" @select="selected = true" /> -->
    <component :is="Editor" />
</div>
</template>

<style lang="scss" scoped>
#home {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 30px;
    .pdf-outer {
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
        .pdf-nav {
            display: flex;
            flex-direction: row;
            width: 100%;
            align-items: center;
        }
        .pdf-content {
            position: relative;
            width: 80%;
            overflow: hidden;
        }
    }
}
.signature-container {
    background-color: white;
}
.content-container {
    img {
        display: block;
        width: 100%;
    }
}
button {
    margin: 15px;
}
</style>