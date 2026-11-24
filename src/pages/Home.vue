<script setup>
import {ref,computed} from 'vue'
import {sellers,money} from '../data/catalog.js'
const query=ref(''), selected=ref('All')
const categories=[{name:'All',icon:'fa-border-all'},{name:'Groceries & essentials',icon:'fa-carrot'},{name:'Restaurant',icon:'fa-utensils'},{name:'Retail',icon:'fa-bag-shopping'},{name:'Wholesale',icon:'fa-boxes-stacked'},{name:'Pharmacy',icon:'fa-kit-medical'}]
const filtered=computed(()=>sellers.filter(s=>(selected.value==='All'||s.category===selected.value)&&`${s.name} ${s.category} ${s.location}`.toLowerCase().includes(query.value.trim().toLowerCase())))
function reset(){query.value='';selected.value='All'}
</script>
<template>
 <main class="shell py-8">
  <section class="relative isolate overflow-hidden rounded-[32px] bg-[#00532D] px-7 py-14 text-white md:px-14 md:py-20" data-aos="fade-up">
   <img :src="sellers[0].coverImage" alt="" class="absolute inset-0 -z-20 h-full w-full object-cover" @error="$event.target.style.display='none'" />
   <div class="absolute inset-0 -z-10 bg-linear-to-r from-[#003B20] via-[#00532D]/95 to-[#00532D]/35"></div>
   <p class="mb-4 text-sm font-bold tracking-widest text-green-200"><i class="fa-solid fa-location-dot mr-2"></i>LAGOS, NIGERIA</p>
   <h1 class="max-w-2xl text-5xl font-black leading-tight md:text-7xl">Your neighbourhood.<br/><span class="text-green-300">At your doorstep.</span></h1>
   <p class="mt-5 max-w-lg text-green-50">Discover local restaurants, fresh groceries and everyday essentials, all in one marketplace.</p>
   <label class="mt-8 flex max-w-xl items-center gap-3 rounded-2xl bg-white p-4 text-gray-700"><i class="fa-solid fa-magnifying-glass text-green-700"></i><input v-model="query" aria-label="Search stores" placeholder="Search stores, categories or locations" class="min-w-0 flex-1 outline-none"/><a href="#stores" class="primary !py-2">Explore</a></label>
  </section>
  <section class="mt-10"><p class="text-xs font-bold tracking-widest text-green-700">FIND YOUR FAVOURITES</p><h2 class="mt-2 text-3xl font-black">Shop by category</h2>
   <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
    <button v-for="c in categories" :key="c.name" @click="selected=c.name" :aria-pressed="selected===c.name" class="rounded-2xl border p-5 text-center transition hover:-translate-y-1" :class="selected===c.name?'bg-[#00532D] text-white border-[#00532D]':'bg-white border-green-100 text-[#00532D]'">
     <i :class="['fa-solid',c.icon,'text-2xl']"></i><span class="mt-3 block text-sm font-bold">{{c.name}}</span>
    </button>
   </div>
  </section>
  <section id="stores" class="mt-12 scroll-mt-28"><div class="flex items-end justify-between gap-3"><div><p class="text-xs font-bold tracking-widest text-green-700">SHOP LOCAL</p><h2 class="mt-2 text-3xl font-black">{{selected==='All'?'Explore stores':selected}}</h2></div><span class="text-sm text-gray-500">{{filtered.length}} stores</span></div>
   <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    <router-link v-for="s in filtered" :key="s.id" :to="{name:'store',params:{seller:s.id}}" class="group overflow-hidden rounded-3xl border border-green-100 bg-white transition hover:-translate-y-1 hover:shadow-xl">
     <div class="relative h-48 overflow-hidden bg-[#EAF8EF]"><img :src="s.coverImage" :alt="s.name" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" @error="$event.target.style.display='none'"/><span class="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-bold text-[#00532D]"><i class="fa-solid fa-star text-amber-500"></i> {{s.rating}}</span></div>
     <div class="relative p-5 pt-8"><img :src="s.logo" alt="" class="absolute -top-8 left-5 h-14 w-14 rounded-xl border-4 border-white bg-white"/><p class="text-xs font-semibold text-green-700">{{s.category}}</p><h3 class="mt-1 text-xl font-black text-[#14251C]">{{s.name}}</h3><p class="mt-2 text-sm text-gray-500"><i class="fa-solid fa-location-dot"></i> {{s.location}}</p><p class="mt-3 text-sm text-gray-600">{{s.description}}</p><div class="mt-5 flex items-center justify-between border-t border-green-100 pt-4 text-xs"><span><i class="fa-solid fa-clock"></i> {{s.eta}}</span><span>Delivery {{money(s.fee)}}</span><i class="fa-solid fa-arrow-right text-green-700"></i></div></div>
    </router-link>
   </div>
   <div v-if="!filtered.length" class="panel mt-5 text-center"><h3 class="font-bold">No stores found</h3><p class="my-3 text-gray-500">Try another category or search.</p><button class="secondary" @click="reset">View all stores</button></div>
  </section>
 </main>
</template>
