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

// 列搜索状态 - BR (D.3): Individual column search
const columnSearch = ref({
  username: '',
  email: '',
  role: '',
  provider: '',
  createdAt: ''
})

// 排序状态 - BR (D.3): Sort functionality
const sortColumn = ref('createdAt')
const sortOrder = ref('desc') // 'asc' or 'desc'

// 分页状态 - BR (D.3): Pagination with 10 rows per page
const currentPage = ref(1)
const itemsPerPage = 10

// 计算属性 - 过滤
const filteredUsers = computed(() => {
  let result = [...users.value]
  
  // 全局搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user => 
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query) ||
      user.provider?.toLowerCase().includes(query)
    )
  }
  
  // 按列搜索 - BR (D.3): Search by individual column
  if (columnSearch.value.username) {
    const query = columnSearch.value.username.toLowerCase()
    result = result.filter(user => user.username?.toLowerCase().includes(query))
  }
  
  if (columnSearch.value.email) {
    const query = columnSearch.value.email.toLowerCase()
    result = result.filter(user => user.email?.toLowerCase().includes(query))
  }
  
  if (columnSearch.value.role) {
    const query = columnSearch.value.role.toLowerCase()
    result = result.filter(user => user.role?.toLowerCase().includes(query))
  }
  
  if (columnSearch.value.provider) {
    const query = columnSearch.value.provider.toLowerCase()
    result = result.filter(user => user.provider?.toLowerCase().includes(query))
  }
  
  if (columnSearch.value.createdAt) {
    const query = columnSearch.value.createdAt.toLowerCase()
    result = result.filter(user => {
      const dateStr = formatDate(user.createdAt).toLowerCase()
      return dateStr.includes(query)
    })
  }
  
  return result
})

// 计算属性 - 排序 - BR (D.3): Sort functionality
const sortedUsers = computed(() => {
  const result = [...filteredUsers.value]
  
  result.sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    // 处理 undefined/null 值
    if (aVal === undefined || aVal === null) aVal = ''
    if (bVal === undefined || bVal === null) bVal = ''
    
    // 转换为字符串进行比较
    aVal = String(aVal).toLowerCase()
    bVal = String(bVal).toLowerCase()
    
    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })
  
  return result
})

// 计算属性 - 分页 - BR (D.3): Limit to 10 rows per page
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedUsers.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(sortedUsers.value.length / itemsPerPage)
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

// 删除用户 - 调用后端 API 同时删除 Auth 和 Firestore
async function deleteUser(user) {
  console.log('Delete user called with:', user)
  
  const confirmMessage = `Are you sure you want to delete user "${user.username || user.email}"?\n\nThis action CANNOT be undone!`
  
  if (!confirm(confirmMessage)) {
    return
  }
  
  loading.value = true
  
  try {
    console.log('Calling backend API to delete user:', user.id)
    
    // Call backend API to delete from both Auth and Firestore
    const response = await fetch(`http://localhost:5175/api/admin/user/${user.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    console.log('Delete result:', result)
    
    if (result.ok) {
      // 从列表中移除用户
      users.value = users.value.filter(u => u.id !== user.id)
      
      let message = result.message || 'User deleted successfully'
      if (result.details?.warnings && result.details.warnings.length > 0) {
        message += '\n\nWarnings:\n' + result.details.warnings.join('\n')
      }
      
      showSuccessMessage(`✅ ${message}\n\nUser: "${user.username || user.email}"`)
    } else {
      let errorMessage = result.error || 'Failed to delete user'
      if (result.warnings && result.warnings.length > 0) {
        errorMessage += '\n\nDetails:\n' + result.warnings.join('\n')
      }
      showErrorMessage(`❌ ${errorMessage}`)
    }
  } catch (err) {
    console.error('Error deleting user:', err)
    showErrorMessage(`❌ Failed to delete user: ${err.message || 'Server connection error. Make sure the backend is running on port 5175.'}\n\nTip: Run 'npm run server' to start the backend.`)
  } finally {
    loading.value = false
  }
}

// 排序功能 - BR (D.3): Sort functionality
function sortBy(column) {
  if (sortColumn.value === column) {
    // 同一列，切换排序顺序
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 不同列，默认降序
    sortColumn.value = column
    sortOrder.value = 'desc'
  }
  // 排序后重置到第一页
  currentPage.value = 1
}

// 获取排序图标
function getSortIcon(column) {
  if (sortColumn.value !== column) return '⇅'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

// 分页功能 - BR (D.3): Pagination controls
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// 清除所有搜索
function clearAllSearch() {
  searchQuery.value = ''
  columnSearch.value = {
    username: '',
    email: '',
    role: '',
    provider: '',
    createdAt: ''
  }
  currentPage.value = 1
}

// 清除列搜索
function clearColumnSearch(column) {
  columnSearch.value[column] = ''
  currentPage.value = 1
}

// 用户角色只读 - 不允许修改
// 管理员角色由系统管理，普通用户注册时自动分配

// 切换用户选择
function toggleUserSelection(userId) {
  const index = selectedUsers.value.indexOf(userId)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(userId)
  }
}

// 全选/取消全选（当前页）
function toggleSelectAll() {
  if (selectedUsers.value.length === paginatedUsers.value.length && paginatedUsers.value.length > 0) {
    selectedUsers.value = []
  } else {
    selectedUsers.value = paginatedUsers.value.map(user => user.id)
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
function formatDate(dateInput) {
  if (!dateInput) return 'N/A'
  
  let date
  
  // 处理 Firestore Timestamp 对象
  if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
    date = new Date(dateInput.seconds * 1000)
  }
  // 处理字符串格式
  else if (typeof dateInput === 'string') {
    date = new Date(dateInput)
  }
  // 处理 Date 对象
  else if (dateInput instanceof Date) {
    date = dateInput
  }
  // 其他情况，尝试直接转换
  else {
    date = new Date(dateInput)
  }
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }
  
  return date.toLocaleDateString('en-US', {
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

      <!-- 搜索和操作栏 - BR (D.3): Search functionality -->
      <div class="toolbar">
        <div class="search-container">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Global search (name, email, role, provider)..."
            class="search-input"
          />
          <button 
            v-if="searchQuery || Object.values(columnSearch).some(v => v)"
            @click="clearAllSearch"
            class="clear-search-btn"
            title="Clear all search filters"
          >
            ✕ Clear All
          </button>
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

      <!-- 搜索结果信息 - BR (D.3): Display filtered results -->
      <div class="search-info">
        <span>Showing {{ paginatedUsers.length }} of {{ sortedUsers.length }} users (Total: {{ totalUsers }})</span>
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

        <div v-else-if="sortedUsers.length === 0" class="empty-state">
          <p>No users found</p>
        </div>

        <div v-else class="users-table">
          <table>
            <thead>
              <!-- BR (D.3): Sortable column headers -->
              <tr>
                <th class="checkbox-column">
                  <input 
                    type="checkbox" 
                    :checked="selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0"
                    @change="toggleSelectAll"
                  />
                </th>
                <th class="sortable" @click="sortBy('username')">
                  User {{ getSortIcon('username') }}
                </th>
                <th class="sortable" @click="sortBy('email')">
                  Email {{ getSortIcon('email') }}
                </th>
                <th class="sortable" @click="sortBy('role')">
                  Role {{ getSortIcon('role') }}
                </th>
                <th class="sortable" @click="sortBy('provider')">
                  Provider {{ getSortIcon('provider') }}
                </th>
                <th class="sortable" @click="sortBy('createdAt')">
                  Created {{ getSortIcon('createdAt') }}
                </th>
                <th>Actions</th>
              </tr>
              
              <!-- BR (D.3): Individual column search -->
              <tr class="column-search-row">
                <th class="checkbox-column"></th>
                <th>
                  <div class="column-search">
                    <input 
                      v-model="columnSearch.username"
                      type="text" 
                      placeholder="Search username..."
                      class="column-search-input"
                      @input="currentPage = 1"
                    />
                    <button 
                      v-if="columnSearch.username"
                      @click="clearColumnSearch('username')"
                      class="clear-column-btn"
                      title="Clear"
                    >
                      ✕
                    </button>
                  </div>
                </th>
                <th>
                  <div class="column-search">
                    <input 
                      v-model="columnSearch.email"
                      type="text" 
                      placeholder="Search email..."
                      class="column-search-input"
                      @input="currentPage = 1"
                    />
                    <button 
                      v-if="columnSearch.email"
                      @click="clearColumnSearch('email')"
                      class="clear-column-btn"
                      title="Clear"
                    >
                      ✕
                    </button>
                  </div>
                </th>
                <th>
                  <div class="column-search">
                    <input 
                      v-model="columnSearch.role"
                      type="text" 
                      placeholder="Search role..."
                      class="column-search-input"
                      @input="currentPage = 1"
                    />
                    <button 
                      v-if="columnSearch.role"
                      @click="clearColumnSearch('role')"
                      class="clear-column-btn"
                      title="Clear"
                    >
                      ✕
                    </button>
                  </div>
                </th>
                <th>
                  <div class="column-search">
                    <input 
                      v-model="columnSearch.provider"
                      type="text" 
                      placeholder="Search provider..."
                      class="column-search-input"
                      @input="currentPage = 1"
                    />
                    <button 
                      v-if="columnSearch.provider"
                      @click="clearColumnSearch('provider')"
                      class="clear-column-btn"
                      title="Clear"
                    >
                      ✕
                    </button>
                  </div>
                </th>
                <th>
                  <div class="column-search">
                    <input 
                      v-model="columnSearch.createdAt"
                      type="text" 
                      placeholder="Search date..."
                      class="column-search-input"
                      @input="currentPage = 1"
                    />
                    <button 
                      v-if="columnSearch.createdAt"
                      @click="clearColumnSearch('createdAt')"
                      class="clear-column-btn"
                      title="Clear"
                    >
                      ✕
                    </button>
                  </div>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <!-- BR (D.3): Display paginated results (10 per page) -->
              <tr v-for="user in paginatedUsers" :key="user.id" class="user-row">
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
                  <span class="role-badge" :class="user.role">
                    {{ user.role === 'admin' ? 'Admin' : 'User' }}
                  </span>
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

      <!-- BR (D.3): Pagination controls - 10 rows per page -->
      <div v-if="sortedUsers.length > 0" class="pagination">
        <div class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }} 
          ({{ sortedUsers.length }} total {{ sortedUsers.length === 1 ? 'user' : 'users' }})
        </div>
        <div class="pagination-controls">
          <button 
            @click="goToPage(1)" 
            :disabled="currentPage === 1"
            class="pagination-btn"
            title="First page"
          >
            ⟨⟨
          </button>
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1"
            class="pagination-btn"
            title="Previous page"
          >
            ⟨
          </button>
          
          <!-- 页码按钮 -->
          <template v-for="page in totalPages" :key="page">
            <button 
              v-if="page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)"
              @click="goToPage(page)"
              :class="['pagination-btn', { active: page === currentPage }]"
            >
              {{ page }}
            </button>
            <span v-else-if="page === currentPage - 3 || page === currentPage + 3" class="pagination-ellipsis">
              ...
            </span>
          </template>
          
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="pagination-btn"
            title="Next page"
          >
            ⟩
          </button>
          <button 
            @click="goToPage(totalPages)" 
            :disabled="currentPage === totalPages"
            class="pagination-btn"
            title="Last page"
          >
            ⟩⟩
          </button>
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
  margin-bottom: 16px;
  gap: 16px;
}

.search-container {
  flex: 1;
  max-width: 500px;
  position: relative;
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  flex: 1;
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

.clear-search-btn {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.clear-search-btn:hover {
  background: #dc2626;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

/* 搜索结果信息 */
.search-info {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  color: #166534;
  font-size: 0.875rem;
  font-weight: 500;
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

/* BR (D.3): Sortable column headers */
.users-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.users-table th.sortable:hover {
  background: #e2e8f0;
}

/* BR (D.3): Column search row */
.column-search-row th {
  padding: 8px 12px;
  background: #ffffff;
  border-bottom: 2px solid #10b981;
}

.column-search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
}

.column-search-input {
  width: 100%;
  padding: 6px 28px 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.75rem;
  transition: border-color 0.2s;
  text-transform: none;
  letter-spacing: normal;
}

.column-search-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.clear-column-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 3px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1;
  padding: 0;
  transition: background 0.2s;
}

.clear-column-btn:hover {
  background: #dc2626;
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

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-badge.admin {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.role-badge.user {
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
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

/* BR (D.3): Pagination controls */
.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}

.pagination-btn {
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 40px;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #10b981;
  color: #10b981;
}

.pagination-btn.active {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-ellipsis {
  padding: 8px 4px;
  color: #9ca3af;
  font-size: 0.875rem;
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
    flex-direction: column;
  }
  
  .clear-search-btn {
    width: 100%;
  }
  
  .users-table {
    font-size: 0.875rem;
  }
  
  .users-table th,
  .users-table td {
    padding: 12px 8px;
  }
  
  .column-search-input {
    font-size: 0.7rem;
    padding: 4px 24px 4px 6px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 12px;
  }
  
  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .pagination-btn {
    padding: 6px 10px;
    font-size: 0.75rem;
    min-width: 36px;
  }
}
</style>



