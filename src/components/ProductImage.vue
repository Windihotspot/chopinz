<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ src: String, alt: String, emoji: String, eager: Boolean })
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })
</script>
<template>
  <div class="relative h-full w-full overflow-hidden rounded-[inherit] bg-[#EAF8EF]">
    <img v-if="src && !failed" :src="src" :alt="alt" :loading="eager ? 'eager' : 'lazy'" decoding="async" class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" @error="failed = true" />
    <div v-else class="absolute inset-0 grid place-items-center" role="img" :aria-label="alt">{{ emoji || '🛍️' }}</div>
  </div>
</template>
