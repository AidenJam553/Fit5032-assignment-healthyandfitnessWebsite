<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { useForumStore } from '@/lib/stores/forum'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const store = useForumStore()
const route = useRoute()
const router = useRouter()
const post = computed(() => store.getById(String(route.params.id)))
if (!post.value) router.replace('/forum')
</script>

<template>
  <div class="page">
    <SiteHeader />
    <div class="container detail">
      <router-link to="/forum">← Back to Forum</router-link>
      <h1>{{ post?.title }}</h1>
      <div class="muted">{{ post?.author }} · {{ post?.topic }} · {{ new Date(post?.createdAt || Date.now()).toLocaleString() }}</div>
      <div class="panel content" v-html="(post?.content || '').replace(/</g,'&lt;')"></div>
    </div>
  </div>
</template>

<style scoped>
.detail { padding: 24px 0; max-width: 760px; }
.panel.content { background: #fff; border: 1px solid var(--green-100); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-md); white-space: pre-wrap; }
.muted { color: #64748b; margin-bottom: 8px; }
</style>


