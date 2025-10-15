<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import VoiceAssistant from '@/components/VoiceAssistant.vue'
import { isUserLoggedIn } from '@/lib/auth'

const route = useRoute()

// 计算是否显示语音助手（只在用户登录后显示）
const showVoiceAssistant = computed(() => {
  return isUserLoggedIn()
})
</script>

<template>
  <router-view />
  <VoiceAssistant v-if="showVoiceAssistant" />
</template>

<style scoped>
</style>
