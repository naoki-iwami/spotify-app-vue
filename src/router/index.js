import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/spotify-login',
    name: 'SpotifyLogin',
    component: () => import(/* webpackChunkName: "about" */ '../views/SpotifyLogin.vue')
  },
  {
    path: '/callback',
    name: 'SpotifyCallback',
    component: () => import(/* webpackChunkName: "about" */ '../views/SpotifyCallback.vue')
  },
  {
    path: '/spotify-start',
    name: 'SpotifyStart',
    component: () => import(/* webpackChunkName: "about" */ '../views/SpotifyStart.vue')
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
