//import Vue from 'vue'
import { createApp } from 'vue'

//import Router from 'vue-router'
import App from './App.vue'

import router from './router'
import cookie from './plugins/cookie'

createApp(App).use(cookie).use(router).mount('#app')
