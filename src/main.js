import './style.css'


import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'

axios.defaults.baseURL = 'http://localhost:8000/api'

const app = createApp(App)

app.config.globalProperties.$axios = axios

app.use(createPinia())
app.use(router)

app.mount('#app')
