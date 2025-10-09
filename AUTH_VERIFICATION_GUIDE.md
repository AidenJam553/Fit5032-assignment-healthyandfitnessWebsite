# Firebase Authentication 用户验证指南

## 概述

使用Firebase Authentication后，您可以通过多种方式验证用户身份和权限。本指南将展示如何在您的应用中实现用户和管理员验证。

## 1. 基础验证函数

### 导入验证函数

```javascript
import { 
  isUserLoggedIn,        // 检查用户是否已登录
  isCurrentUserAdmin,    // 检查当前用户是否为管理员
  getCurrentUserRole,    // 获取当前用户角色
  hasPermission,         // 检查用户是否有特定权限
  isRegularUser,         // 检查用户是否为普通用户
  getCurrentUserId,      // 获取当前用户ID
  getCurrentUserInfo     // 获取当前用户完整信息
} from '@/lib/auth'
```

### 基本使用示例

```javascript
// 检查用户是否已登录
if (isUserLoggedIn()) {
  console.log('用户已登录')
}

// 检查是否为管理员
if (isCurrentUserAdmin()) {
  console.log('当前用户是管理员')
}

// 检查用户角色
const userRole = getCurrentUserRole()
if (userRole === 'admin') {
  console.log('管理员用户')
} else if (userRole === 'user') {
  console.log('普通用户')
}

// 检查特定权限
if (hasPermission('manage_users')) {
  console.log('用户有管理用户的权限')
}

// 获取用户信息
const userInfo = getCurrentUserInfo()
console.log('用户信息:', userInfo)
```

## 2. 在Vue组件中使用

### 使用 useAuth Composable

```vue
<template>
  <div>
    <!-- 根据用户状态显示不同内容 -->
    <div v-if="!isLoggedIn">
      <p>请先登录</p>
      <router-link to="/login">登录</router-link>
    </div>
    
    <div v-else>
      <h1>欢迎, {{ userInfo.username }}!</h1>
      
      <!-- 管理员专用内容 -->
      <div v-if="isAdmin">
        <h2>管理员面板</h2>
        <router-link to="/admin">管理后台</router-link>
      </div>
      
      <!-- 普通用户内容 -->
      <div v-else>
        <p>您是一个普通用户</p>
      </div>
      
      <!-- 权限控制 -->
      <button v-if="checkPermission('manage_courses')" @click="createCourse">
        创建课程
      </button>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '@/lib/composables/useAuth'

const { 
  user, 
  isLoggedIn, 
  isAdmin, 
  userInfo, 
  checkPermission,
  canEdit,
  canDelete 
} = useAuth()

// 检查是否可以编辑特定内容
const canEditPost = (authorId) => {
  return canEdit(authorId)
}

// 检查是否可以删除特定内容
const canDeletePost = (authorId) => {
  return canDelete(authorId)
}
</script>
```

### 使用 AuthGuard 组件

```vue
<template>
  <!-- 需要登录的页面 -->
  <AuthGuard requires-auth>
    <div>
      <h1>受保护的内容</h1>
      <p>只有登录用户才能看到这个内容</p>
    </div>
  </AuthGuard>
  
  <!-- 需要管理员权限的页面 -->
  <AuthGuard requires-admin>
    <div>
      <h1>管理员专用内容</h1>
      <p>只有管理员才能看到这个内容</p>
    </div>
  </AuthGuard>
  
  <!-- 需要特定权限的页面 -->
  <AuthGuard requires-permission="manage_users">
    <div>
      <h1>用户管理</h1>
      <p>只有有用户管理权限的用户才能看到这个内容</p>
    </div>
  </AuthGuard>
</template>

<script setup>
import AuthGuard from '@/components/AuthGuard.vue'
</script>
```

## 3. 路由保护

### 自动路由保护

路由已经配置了自动保护，无需额外代码：

```javascript
// 这些路由会自动检查认证状态
{ path: '/profile', component: Profile, meta: { requiresAuth: true } }
{ path: '/admin', component: Admin, meta: { requiresAuth: true, requiresAdmin: true } }
```

### 手动路由保护

```javascript
import { isUserLoggedIn, isCurrentUserAdmin } from '@/lib/auth'

// 在组件中手动检查
if (!isUserLoggedIn()) {
  router.push('/login')
  return
}

if (!isCurrentUserAdmin()) {
  router.push('/')
  return
}
```

## 4. 权限控制示例

### 内容编辑权限

```vue
<template>
  <div v-for="post in posts" :key="post.id">
    <h3>{{ post.title }}</h3>
    <p>{{ post.content }}</p>
    
    <!-- 只有作者或管理员可以编辑 -->
    <button v-if="canEdit(post.authorId)" @click="editPost(post.id)">
      编辑
    </button>
    
    <!-- 只有作者或管理员可以删除 -->
    <button v-if="canDelete(post.authorId)" @click="deletePost(post.id)">
      删除
    </button>
  </div>
</template>

<script setup>
import { useAuth } from '@/lib/composables/useAuth'

const { canEdit, canDelete } = useAuth()
</script>
```

### 条件渲染

```vue
<template>
  <div>
    <!-- 根据用户角色显示不同导航 -->
    <nav>
      <router-link to="/">首页</router-link>
      <router-link to="/forum">论坛</router-link>
      
      <!-- 只有登录用户才能看到 -->
      <template v-if="isLoggedIn">
        <router-link to="/profile">个人资料</router-link>
        <router-link to="/learn">学习</router-link>
      </template>
      
      <!-- 只有管理员才能看到 -->
      <template v-if="isAdmin">
        <router-link to="/admin">管理后台</router-link>
      </template>
    </nav>
    
    <!-- 根据权限显示功能按钮 -->
    <div v-if="checkPermission('manage_courses')">
      <button @click="createCourse">创建课程</button>
    </div>
    
    <div v-if="checkPermission('manage_users')">
      <button @click="manageUsers">管理用户</button>
    </div>
  </div>
</template>
```

## 5. 服务端验证

### Firestore 安全规则

Firestore 安全规则已经配置好，会自动验证用户权限：

```javascript
// 用户只能访问自己的数据
match /users/{userId} {
  allow read, write: if request.auth != null && 
    (request.auth.uid == userId || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
}

// 只有管理员可以管理课程
match /courses/{courseId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## 6. 常见使用场景

### 场景1：检查用户登录状态

```javascript
// 在组件挂载时检查
onMounted(() => {
  if (!isUserLoggedIn()) {
    router.push('/login')
  }
})
```

### 场景2：管理员功能

```javascript
// 显示管理员专用功能
const showAdminFeatures = computed(() => {
  return isCurrentUserAdmin()
})
```

### 场景3：权限控制

```javascript
// 根据权限显示不同内容
const canManageUsers = computed(() => {
  return hasPermission('manage_users')
})
```

### 场景4：用户信息显示

```javascript
// 显示当前用户信息
const currentUser = computed(() => {
  return getCurrentUserInfo()
})
```

## 7. 最佳实践

1. **始终在客户端和服务端都进行验证**
2. **使用路由守卫保护敏感页面**
3. **在组件中使用条件渲染控制功能显示**
4. **定期检查用户权限状态**
5. **为不同角色提供不同的用户体验**

## 8. 调试技巧

```javascript
// 在控制台中检查用户状态
console.log('用户是否登录:', isUserLoggedIn())
console.log('是否为管理员:', isCurrentUserAdmin())
console.log('用户角色:', getCurrentUserRole())
console.log('用户信息:', getCurrentUserInfo())
```

这样，您就可以在应用的任何地方轻松验证用户身份和权限了！
