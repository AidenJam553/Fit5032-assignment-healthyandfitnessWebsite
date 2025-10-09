// Vue composable for authentication
import { ref, computed, onMounted } from 'vue'
import { 
  getCurrentUser, 
  isCurrentUserAdmin, 
  getCurrentUserRole, 
  hasPermission, 
  isRegularUser, 
  isUserLoggedIn, 
  getCurrentUserId, 
  getCurrentUserInfo 
} from '../auth'

export function useAuth() {
  const user = ref(null)
  const loading = ref(true)

  // 初始化用户状态
  const initAuth = () => {
    const currentUser = getCurrentUser()
    user.value = currentUser
    loading.value = false
  }

  // 更新用户状态
  const updateUser = (newUser) => {
    user.value = newUser
  }

  // 清除用户状态
  const clearUser = () => {
    user.value = null
  }

  // 计算属性
  const isLoggedIn = computed(() => isUserLoggedIn())
  const isAdmin = computed(() => isCurrentUserAdmin())
  const userRole = computed(() => getCurrentUserRole())
  const userId = computed(() => getCurrentUserId())
  const userInfo = computed(() => getCurrentUserInfo())
  const isUser = computed(() => isRegularUser())

  // 权限检查函数
  const checkPermission = (permission) => {
    return hasPermission(permission)
  }

  // 角色检查函数
  const hasRole = (role) => {
    return userRole.value === role
  }

  // 检查是否为特定用户
  const isUser = (targetUserId) => {
    return userId.value === targetUserId
  }

  // 检查是否可以访问管理功能
  const canAccessAdmin = () => {
    return isAdmin.value
  }

  // 检查是否可以编辑内容
  const canEdit = (authorId) => {
    return isAdmin.value || userId.value === authorId
  }

  // 检查是否可以删除内容
  const canDelete = (authorId) => {
    return isAdmin.value || userId.value === authorId
  }

  // 检查是否可以创建内容
  const canCreate = () => {
    return isLoggedIn.value
  }

  // 检查是否可以查看内容
  const canView = () => {
    return isLoggedIn.value
  }

  onMounted(() => {
    initAuth()
  })

  return {
    // 状态
    user,
    loading,
    
    // 计算属性
    isLoggedIn,
    isAdmin,
    userRole,
    userId,
    userInfo,
    isUser,
    
    // 方法
    updateUser,
    clearUser,
    checkPermission,
    hasRole,
    isUser,
    canAccessAdmin,
    canEdit,
    canDelete,
    canCreate,
    canView
  }
}
