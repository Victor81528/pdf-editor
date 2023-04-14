<script setup>
import { ref, shallowRef } from 'vue'

import Select from '../components/Select.vue'
import Editor from '../components/Editor.vue'
import EditorMultiple from '../components/EditorMultiple.vue'

import { useGlobalStore } from '../store/global.js'

const store = useGlobalStore()

</script>

<template>
<div id="home">
    <Select v-if="store.comp === 'Select'" />
    <Editor v-else-if="store.comp === 'Editor'" />
    <EditorMultiple v-else-if="store.comp === 'EditorMultiple'" />
</div>
</template>

<style lang="scss" scoped>
#home {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 30px;
}
</style>