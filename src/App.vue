<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import VoiceAssistant from '@/components/VoiceAssistant.vue'
import AccessibilityPanel from '@/components/AccessibilityPanel.vue'
import { isUserLoggedIn } from '@/lib/auth'

const route = useRoute()

// Calculate whether to show voice assistant (only show when user is logged in)
const showVoiceAssistant = computed(() => {
  return isUserLoggedIn()
})

// Calculate whether to show accessibility panel (only show when user is logged in)
const showAccessibilityPanel = computed(() => {
  return isUserLoggedIn()
})
</script>

<template>
  <router-view />
  <VoiceAssistant v-if="showVoiceAssistant" />
  <AccessibilityPanel v-if="showAccessibilityPanel" />
</template>

<style scoped>
</style>
