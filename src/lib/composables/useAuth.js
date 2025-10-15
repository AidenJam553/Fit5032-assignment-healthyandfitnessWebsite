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

  // Initialize user state
  const initAuth = () => {
    const currentUser = getCurrentUser()
    user.value = currentUser
    loading.value = false
  }

  // Update user state
  const updateUser = (newUser) => {
    user.value = newUser
  }

  // Clear user state
  const clearUser = () => {
    user.value = null
  }

  // Computed properties
  const isLoggedIn = computed(() => isUserLoggedIn())
  const isAdmin = computed(() => isCurrentUserAdmin())
  const userRole = computed(() => getCurrentUserRole())
  const userId = computed(() => getCurrentUserId())
  const userInfo = computed(() => getCurrentUserInfo())
  const isUser = computed(() => isRegularUser())

  // Permission check function
  const checkPermission = (permission) => {
    return hasPermission(permission)
  }

  // Role check function
  const hasRole = (role) => {
    return userRole.value === role
  }

  // Check if user is specific user
  const isUser = (targetUserId) => {
    return userId.value === targetUserId
  }

  // Check if can access admin functions
  const canAccessAdmin = () => {
    return isAdmin.value
  }

  // Check if can edit content
  const canEdit = (authorId) => {
    return isAdmin.value || userId.value === authorId
  }

  // Check if can delete content
  const canDelete = (authorId) => {
    return isAdmin.value || userId.value === authorId
  }

  // Check if can create content
  const canCreate = () => {
    return isLoggedIn.value
  }

  // Check if can view content
  const canView = () => {
    return isLoggedIn.value
  }

  onMounted(() => {
    initAuth()
  })

  return {
    // State
    user,
    loading,
    
    // Computed properties
    isLoggedIn,
    isAdmin,
    userRole,
    userId,
    userInfo,
    isUser,
    
    // Methods
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

