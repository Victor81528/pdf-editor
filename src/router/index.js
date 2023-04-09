import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import ('../views/Home.vue')
  },
  {
    // path: '/shop/:type',
    // name: 'Shop',
    // component: () => import(/* webpackChunkName: "about" */ '../views/Shop.vue')
  }
]

const router = createRouter({
  // History Mode
  history: createWebHistory('/'),
  routes
})

export default router
