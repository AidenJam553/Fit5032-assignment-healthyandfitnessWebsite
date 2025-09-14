<script setup>
import { ref, onMounted, computed } from 'vue'
import { logout } from '@/lib/auth'
import { useRouter } from 'vue-router'
import Button from '@/components/Button.vue'
import { userService } from '@/lib/firebaseService'

const router = useRouter()

// 用户管理状态
const users = ref([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedUsers = ref([])
const showDeleteModal = ref(false)
const userToDelete = ref(null)

// 计算属性
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.username?.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query) ||
    user.role?.toLowerCase().includes(query)
  )
})

const totalUsers = computed(() => users.value.length)
const adminUsers = computed(() => users.value.filter(user => user.role === 'admin').length)
const regularUsers = computed(() => users.value.filter(user => user.role === 'user').length)

// 加载所有用户
async function loadUsers() {
  loading.value = true
  error.value = ''
  
  try {
    const allUsers = await userService.getAllUsers()
    users.value = allUsers
    console.log('Loaded users:', allUsers)
  } catch (err) {
    console.error('Error loading users:', err)
    error.value = 'Failed to load users'
  } finally {
    loading.value = false
  }
}

// 删除用户
async function deleteUser(user) {
  if (!confirm(`Are you sure you want to delete user "${user.username || user.email}"?`)) {
    return
  }
  
  try {
    const result = await userService.deleteUser(user.id)
    if (result.ok) {
      // 从列表中移除用户
      users.value = users.value.filter(u => u.id !== user.id)
      showSuccessMessage(`User "${user.username || user.email}" deleted successfully`)
    } else {
      showErrorMessage(`Failed to delete user: ${result.error}`)
    }
  } catch (err) {
    console.error('Error deleting user:', err)
    showErrorMessage('Failed to delete user')
  }
}

// 更新用户角色
async function updateUserRole(user, newRole) {
  try {
    const result = await userService.updateUser(user.id, { role: newRole })
    if (result.ok) {
      // 更新本地用户数据
      const userIndex = users.value.findIndex(u => u.id === user.id)
      if (userIndex !== -1) {
        users.value[userIndex].role = newRole
      }
      showSuccessMessage(`User role updated to ${newRole}`)
    } else {
      showErrorMessage(`Failed to update user role: ${result.error}`)
    }
  } catch (err) {
    console.error('Error updating user role:', err)
    showErrorMessage('Failed to update user role')
  }
}

// 切换用户选择
function toggleUserSelection(userId) {
  const index = selectedUsers.value.indexOf(userId)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(userId)
  }
}

// 全选/取消全选
function toggleSelectAll() {
  if (selectedUsers.value.length === filteredUsers.value.length) {
    selectedUsers.value = []
  } else {
    selectedUsers.value = filteredUsers.value.map(user => user.id)
  }
}

// 批量删除用户
async function deleteSelectedUsers() {
  if (selectedUsers.value.length === 0) return
  
  if (!confirm(`Are you sure you want to delete ${selectedUsers.value.length} selected users?`)) {
    return
  }
  
  try {
    for (const userId of selectedUsers.value) {
      await userService.deleteUser(userId)
    }
    
    // 从列表中移除已删除的用户
    users.value = users.value.filter(user => !selectedUsers.value.includes(user.id))
    selectedUsers.value = []
    showSuccessMessage(`${selectedUsers.value.length} users deleted successfully`)
  } catch (err) {
    console.error('Error deleting selected users:', err)
    showErrorMessage('Failed to delete selected users')
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取用户头像
function getUserAvatar(user) {
  if (user.avatarDataUrl) return user.avatarDataUrl
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.email)}&background=10b981&color=fff&size=40`
}

// 显示成功消息
function showSuccessMessage(message) {
  // 这里可以集成一个通知系统
  alert(message)
}

// 显示错误消息
function showErrorMessage(message) {
  // 这里可以集成一个通知系统
  alert(message)
}

function handleLogout() {
  logout()
  router.push('/')
}

// 页面加载时获取用户数据
onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="admin">
    <header class="admin__bar">
      <div class="container admin__bar-inner">
        <router-link to="/admin" class="logo">ADMIN MANAGE SYSTEM</router-link>
        <div class="admin__actions">
          <Button variant="secondary" size="medium" @click="handleLogout">Log out</Button>
          <div class="chip">
            <span class="chip__avatar">A</span>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </header>

    <main class="container admin__content">
      <div class="page-header">
        <h1 class="page-title">User Management</h1>
        <div class="page-actions">
          <Button variant="primary" size="medium" @click="loadUsers" :loading="loading">
            Refresh
          </Button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalUsers }}</div>
            <div class="stat-label">Total Users</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👑</div>
          <div class="stat-content">
            <div class="stat-number">{{ adminUsers }}</div>
            <div class="stat-label">Admins</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-content">
            <div class="stat-number">{{ regularUsers }}</div>
            <div class="stat-label">Regular Users</div>
          </div>
        </div>
      </div>

      <!-- 搜索和操作栏 -->
      <div class="toolbar">
        <div class="search-container">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search users by name, email, or role..."
            class="search-input"
          />
        </div>
        <div class="toolbar-actions">
          <Button 
            v-if="selectedUsers.length > 0"
            variant="danger" 
            size="medium" 
            @click="deleteSelectedUsers"
          >
            Delete Selected ({{ selectedUsers.length }})
          </Button>
        </div>
      </div>

      <!-- 用户列表 -->
      <div class="users-container">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading users...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <Button variant="primary" size="medium" @click="loadUsers">Retry</Button>
        </div>

        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          <p>No users found</p>
        </div>

        <div v-else class="users-table">
          <table>
            <thead>
              <tr>
                <th class="checkbox-column">
                  <input 
                    type="checkbox" 
                    :checked="selectedUsers.length === filteredUsers.length && filteredUsers.length > 0"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Provider</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id" class="user-row">
                <td class="checkbox-column">
                  <input 
                    type="checkbox" 
                    :checked="selectedUsers.includes(user.id)"
                    @change="toggleUserSelection(user.id)"
                  />
                </td>
                <td class="user-info">
                  <img :src="getUserAvatar(user)" :alt="user.username" class="user-avatar" />
                  <div class="user-details">
                    <div class="user-name">{{ user.username || 'N/A' }}</div>
                    <div class="user-id">ID: {{ user.id }}</div>
                  </div>
                </td>
                <td class="user-email">{{ user.email }}</td>
                <td class="user-role">
                  <select 
                    :value="user.role" 
                    @change="updateUserRole(user, $event.target.value)"
                    class="role-select"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td class="user-provider">
                  <span class="provider-badge" :class="user.provider">
                    {{ user.provider || 'local' }}
                  </span>
                </td>
                <td class="user-created">{{ formatDate(user.createdAt) }}</td>
                <td class="user-actions">
                  <Button 
                    variant="danger" 
                    size="small" 
                    @click="deleteUser(user)"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
:root {
  --green-700: #15803d;
  --green-600: #16a34a;
  --green-50: #f0fdf4;
  --border: #e2e8f0;
  --muted: #64748b;
}
.container { max-width: 1200px; margin: 0 auto; padding: 0 16px; }

.admin__bar { background: #fff; border-bottom: 1px solid var(--gray-200); position: sticky; top: 0; z-index: 10; backdrop-filter: blur(6px); }
.admin__bar-inner { height: 64px; display: flex; align-items: center; justify-content: space-between; }
.logo { 
  font-weight: 800; 
  color: var(--green-800); 
  text-decoration: none;
  cursor: pointer;
}
.logo:hover { 
  color: var(--green-600); 
  text-decoration: none;
}
.admin__actions { display: flex; align-items: center; gap: 12px; }

/* Legacy button styles removed - now using Button component */
.chip { display: inline-flex; align-items: center; gap: 8px; background: var(--green-50); color: var(--green-800); border: 1px solid var(--green-200); padding: 6px 10px; border-radius: 999px; box-shadow: var(--shadow-sm); }
.chip__avatar { width: 22px; height: 22px; border-radius: 50%; background: var(--green-600); color: white; display: grid; place-content: center; font-weight: 700; }

.admin__content { padding: 24px 0 40px; }

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title { 
  margin: 0; 
  color: #15803d; 
  font-size: 2rem;
  font-weight: 700;
}

.page-actions {
  display: flex;
  gap: 12px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0fdf4;
  border-radius: 12px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #15803d;
  margin-bottom: 4px;
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.search-container {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

/* 用户容器 */
.users-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 加载状态 */
.loading-state, .error-state, .empty-state {
  padding: 40px;
  text-align: center;
  color: #64748b;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 用户表格 */
.users-table {
  overflow-x: auto;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.users-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.checkbox-column {
  width: 40px;
  text-align: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.user-id {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: monospace;
}

.user-email {
  color: #374151;
  font-family: monospace;
  font-size: 0.875rem;
}

.role-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.role-select:focus {
  outline: none;
  border-color: #10b981;
}

.provider-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.provider-badge.local {
  background: #fef3c7;
  color: #92400e;
}

.provider-badge.google {
  background: #dbeafe;
  color: #1e40af;
}

.user-created {
  color: #6b7280;
  font-size: 0.875rem;
}

.user-actions {
  display: flex;
  gap: 8px;
}

.user-row:hover {
  background: #f8fafc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    max-width: none;
  }
  
  .users-table {
    font-size: 0.875rem;
  }
  
  .users-table th,
  .users-table td {
    padding: 12px 8px;
  }
}
</style>



