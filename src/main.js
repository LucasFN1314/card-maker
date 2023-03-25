import { createApp } from 'vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import './assets/sass/style.scss'
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

//let app = createApp(App).mount('#app');

let app = createApp(App);
app.mount("#app");
app.use(Toast, {});
