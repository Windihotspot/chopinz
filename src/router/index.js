import { createRouter, createWebHistory } from 'vue-router'
export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../pages/Home.vue') },
    { path: '/store', redirect: '/' },
    { path: '/store/:seller', name: 'store', component: () => import('../pages/Store.vue') },
    {
      path: '/store/:seller/product/:id',
      name: 'product',
      component: () => import('../pages/Product.vue')
    },
    { path: '/checkout', name: 'checkout', component: () => import('../pages/Checkout.vue') },
    { path: '/result', name: 'result', component: () => import('../pages/Result.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
})
