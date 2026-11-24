<script setup>
import {useCart} from '../composables/cart';import {money} from '../data/catalog';const {result}=useCart();
</script>
<template><div class="shell py-16"><div class="panel mx-auto max-w-xl text-center" data-aos="zoom-in"><template v-if="result"><i class="fa-solid fa-circle-check text-6xl text-green-600"></i><h1 class="my-5 text-3xl font-black">Demo order confirmed!</h1><p>No money was charged. This is a simulated order.</p><p class="my-4 font-bold">{{result.reference}} · {{money(result.total)}}</p><p>{{result.provider}} (demo)</p><p v-for="g in result.groups" :key="g.name" class="my-2">{{g.name}} · {{g.mode}}</p></template><p v-else>No demo order in this session.</p><router-link to="/" class="primary mt-6">Continue shopping</router-link></div></div></template>
