<template>
  <div v-if="loading" class="loading">
    <div class="spinner"></div>
    <p>验证用户权限中...</p>
  </div>
  
  <div v-else-if="!isLoggedIn" class="auth-required">
    <div class="auth-message">
      <h3>需要登录</h3>
      <p>请先登录以访问此页面</p>
      <router-link to="/login" class="btn btn-primary">登录</router-link>
    </div>
  </div>
  
  <div v-else-if="requiresAdmin && !isAdmin" class="admin-required">
    <div class="admin-message">
      <h3>权限不足</h3>
      <p>您需要管理员权限才能访问此页面</p>
      <router-link to="/" class="btn btn-secondary">返回首页</router-link>
    </div>
  </div>
  
  <div v-else-if="requiresPermission && !hasRequiredPermission" class="permission-required">
    <div class="permission-message">
      <h3>权限不足</h3>
      <p>您没有执行此操作的权限</p>
      <router-link to="/" class="btn btn-secondary">返回首页</router-link>
    </div>
  </div>
  
  <slot v-else />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '@/lib/composables/useAuth'

const props = defineProps({
  requiresAuth: {
    type: Boolean,
    default: false
  },
  requiresAdmin: {
    type: Boolean,
    default: false
  },
  requiresPermission: {
    type: String,
    default: null
  }
})

const { isLoggedIn, isAdmin, checkPermission, loading } = useAuth()

const hasRequiredPermission = computed(() => {
  if (!props.requiresPermission) return true
  return checkPermission(props.requiresPermission)
})
</script>

<style scoped>
.loading, .auth-required, .admin-required, .permission-required {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
}

.auth-message, .admin-message, .permission-message {
  text-align: center;
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.auth-message h3, .admin-message h3, .permission-message h3 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}
</style>

