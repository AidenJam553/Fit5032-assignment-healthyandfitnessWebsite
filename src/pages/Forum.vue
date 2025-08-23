<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { useForumStore } from '@/lib/stores/forum'
import { getCurrentUser } from '@/lib/auth'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const forum = useForumStore()
const router = useRouter()
onMounted(() => forum.seedIfEmpty())

function newPost() {
  const user = getCurrentUser()
  if (!user) {
    router.push({ path: '/login', query: { redirect: '/forum/new' } })
    return
  }
  router.push('/forum/new')
}
</script>

<template>
  <div class="page forum-page">
    <SiteHeader />

    <section class="sub-hero">
      <div class="container">
        <h1 class="title">Community Forum</h1>
        <p class="subtitle">Ask questions, share progress, and get feedback from peers.</p>
        <div class="toolbar">
          <div class="tabs">
            <button class="tab is-active">All</button>
            <button class="tab">Trending</button>
            <button class="tab">New</button>
            <button class="tab">Following</button>
          </div>
          <div class="search">
            <input class="search__input" placeholder="Search posts..." />
          </div>
          <button class="btn btn--primary" @click="newPost">New Post</button>
        </div>
      </div>
    </section>

    <div class="container forum-grid">
      <main class="feed">
        <article class="post" v-for="p in (forum.activeTopic==='All' ? forum.posts : forum.posts.filter(pp => pp.topic === forum.activeTopic))" :key="p.id" @click="router.push({ name: 'forum-detail', params: { id: p.id } })" style="cursor:pointer">
          <div class="cover" aria-hidden="true"></div>
          <div class="post__body">
            <div class="post__meta">
              <div class="avatar">{{ p.author.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase() }}</div>
              <div class="who">
                <strong>{{ p.author }}</strong>
                <span class="muted">{{ new Date(p.createdAt).toLocaleString() }} · {{ p.topic }}</span>
              </div>
            </div>
            <h3 class="post__title">{{ p.title }}</h3>
            <p class="post__excerpt">{{ (p.content || '').slice(0,140) }}...</p>
            <div class="chips">
              <span class="chip">Cardio</span>
              <span class="chip">Motivation</span>
            </div>
            <div class="stats">
              <span>24 replies</span>
              <span>128 likes</span>
            </div>
          </div>
        </article>
      </main>
      <div v-if="(forum.activeTopic==='All' ? forum.posts : forum.posts.filter(pp => pp.topic === forum.activeTopic)).length === 0" class="empty">
        No posts yet under this category.
      </div>

      <aside class="sidebar">
        <div class="panel">
          <h3 class="panel__title">Categories</h3>
          <ul class="cat-list">
            <li :class="{active: forum.activeTopic==='All'}" @click="forum.setTopic('All')"><span class="dot"></span> All</li>
            <li :class="{active: forum.activeTopic==='General'}" @click="forum.setTopic('General')"><span class="dot"></span> General</li>
            <li :class="{active: forum.activeTopic==='Nutrition'}" @click="forum.setTopic('Nutrition')"><span class="dot"></span> Nutrition</li>
            <li :class="{active: forum.activeTopic==='Workout'}" @click="forum.setTopic('Workout')"><span class="dot"></span> Workout</li>
            <li :class="{active: forum.activeTopic==='Weight loss'}" @click="forum.setTopic('Weight loss')"><span class="dot"></span> Weight loss</li>
            <li :class="{active: forum.activeTopic==='Q & A'}" @click="forum.setTopic('Q & A')"><span class="dot"></span> Q & A</li>
          </ul>
        </div>
        <div class="panel">
          <h3 class="panel__title">Top contributors</h3>
          <div class="user-row">
            <div class="avatar small">AN</div>
            <div>
              <strong>Ana Nelson</strong>
              <div class="muted">256 pts</div>
            </div>
          </div>
          <div class="user-row placeholder"></div>
          <div class="user-row placeholder"></div>
        </div>
      </aside>
    </div>

    <footer class="container forum-footer">
      <div class="tip">Be kind and stay on topic. Read our community guidelines.</div>
    </footer>
  </div>
</template>

<style scoped>
.page { background: var(--green-50); min-height: 100vh; }
.forum-page .container { max-width: 1240px; }
.sub-hero { background: linear-gradient(180deg, rgba(240,253,244,.9), #fff); border-bottom: 1px solid var(--green-100); }
.sub-hero .container { padding-top: 0.5cm; }
.sub-hero .title { margin: 0; letter-spacing: .2px; }
.subtitle { color: var(--gray-700); margin: 8px 0 18px 0; line-height: 1.6; }
.toolbar { display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: center; padding: 8px 0 16px; }
.tabs { display: inline-flex; gap: 10px; }
.tab { background: #fff; border: 1px solid var(--green-100); padding: 10px 14px; border-radius: 999px; cursor: pointer; box-shadow: var(--shadow-sm); transition: box-shadow .15s ease, transform .05s ease; }
.tab:hover { box-shadow: var(--shadow-md); }
.tab:active { transform: translateY(1px); }
.tab.is-active { background: var(--green-700); color: #fff; border-color: var(--green-700); box-shadow: var(--shadow-md); }
.search { background: #fff; border: 1px solid var(--green-100); border-radius: 999px; padding: 8px 12px; box-shadow: var(--shadow-sm); }
.search__input { border: 0; outline: none; font-size: 14px; min-width: 280px; }

.forum-grid { display: grid; grid-template-columns: 1fr 360px; gap: 28px; padding: 28px 0; }
.feed { display: grid; grid-template-columns: 1fr; gap: 20px; }
.post { background: #fff; border: 1px solid var(--green-100); border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-md); min-height: 180px; display: flex; flex-direction: column; }
.post.placeholder { height: 180px; background: var(--green-100); border: 0; box-shadow: var(--shadow-sm); }
.cover { height: 110px; background: radial-gradient(260px 120px at 10% -20%, var(--green-50), #fff), linear-gradient(45deg, var(--green-200), var(--green-600)); opacity: .12; }
.post.compact .cover { height: 80px; }
.post__body { padding: 20px; display: flex; flex-direction: column; gap: 6px; }
.post__meta { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--green-200); color: #0f172a; display: grid; place-content: center; font-weight: 700; box-shadow: inset 0 0 0 2px rgba(255,255,255,.8); }
.avatar.small { width: 30px; height: 30px; font-size: 12px; }
.who { line-height: 1.35; display: flex; flex-direction: column; }
.muted { color: var(--gray-700); font-size: 13px; letter-spacing: .2px; margin-top: 6px; }
.post__title { margin: 12px 0 8px 0; letter-spacing: .2px; }
.post__excerpt { margin: 0 0 12px 0; color: var(--gray-700); line-height: 1.7; }
.chips { display: flex; gap: 10px; margin-bottom: 12px; margin-top: 4px; }
.chip { background: #fff; border: 1px solid var(--green-100); border-radius: 999px; padding: 6px 12px; font-size: 12px; }
.stats { display: flex; gap: 20px; font-size: 12px; color: var(--gray-700); }

.sidebar .panel { padding: 20px; }
.panel__title { margin: 0 0 14px 0; font-size: 16px; }
.cat-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.cat-list li { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 6px 8px; border-radius: 8px; }
.cat-list li.active, .cat-list li:hover { background: var(--green-50); }
.dot { width: 8px; height: 8px; border-radius: 999px; background: var(--green-600); display: inline-block; }
.user-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
.user-row.placeholder { height: 36px; background: var(--green-100); border-radius: 10px; }

.forum-footer { padding: 12px 0 40px; }
.tip { background: #fff; border: 1px solid var(--green-100); border-radius: 14px; padding: 14px 18px; text-align: center; box-shadow: var(--shadow-sm); }
.empty { color: var(--gray-700); padding: 24px 0; }

@media (max-width: 960px) {
  .forum-grid { grid-template-columns: 1fr; gap: 20px; }
  .toolbar { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
  .cover { height: 90px; }
}
</style>


