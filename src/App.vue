<script setup>
import Loading from './components/Loading.vue'
import { useGlobalStore } from './store/global.js'

const store = useGlobalStore()

</script>

<template>
  <router-view />
  <Loading v-if="store.isLoading" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
