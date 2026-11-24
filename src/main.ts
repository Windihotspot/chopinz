import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import AOS from 'aos'

import 'vuetify/styles'
import 'aos/dist/aos.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './style.css'

const vuetify = createVuetify({
  components,
  directives,

  theme: {
    defaultTheme: 'chopinzLight',

    themes: {
      chopinzLight: {
        dark: false,

        colors: {
          primary: '#00532D',
          secondary: '#00B52D',
          background: '#F7F9F7',
          surface: '#FFFFFF',
          success: '#00A536',
          error: '#DC2626',
          warning: '#F59E0B',
          info: '#0284C7'
        }
      }
    }
  }
})

const app = createApp(App)

app.use(router)
app.use(vuetify)

app.mount('#app')

AOS.init({
  duration: 650,
  easing: 'ease-out-cubic',
  once: true,
  offset: 40
})