# 管理员删除用户功能修复

## 问题

在 Admin Users 页面中删除用户时显示 "Failed to delete user" 错误。

### 原因

`userService` 中缺少 `deleteUser` 方法。

## 修复内容

### 1. 添加了 `deleteUser` 方法

在 `src/lib/firebaseService.js` 中添加：

```javascript
// Delete user (only deletes Firestore document, not Firebase Auth user)
async deleteUser(userId) {
  try {
    console.log('Attempting to delete user with ID:', userId)
    
    // 直接使用文档 ID 删除
    const docRef = doc(db, 'users', userId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      console.error('User document not found:', userId)
      return { ok: false, error: 'User not found' }
    }
    
    await deleteDoc(docRef)
    console.log('User deleted from Firestore successfully:', userId)
    return { ok: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { ok: false, error: error.message }
  }
}
```

### 2. 添加了调试日志

在 `src/pages/admin/AdminUsers.vue` 中添加了详细的日志输出：

```javascript
async function deleteUser(user) {
  console.log('Delete user called with:', user)
  
  // ... 确认对话框 ...
  
  console.log('Calling userService.deleteUser with ID:', user.id)
  const result = await userService.deleteUser(user.id)
  console.log('Delete result:', result)
  
  // ... 处理结果 ...
}
```

## 功能说明

### 删除流程

```
1. 管理员点击删除按钮
   ↓
2. 显示确认对话框
   ↓
3. 用户确认删除
   ↓
4. 调用 userService.deleteUser(userId)
   ↓
5. 检查用户文档是否存在
   ↓
6. 删除 Firestore 文档
   ↓
7. 从列表中移除用户
   ↓
8. 显示成功消息
```

### 重要说明

⚠️ **此方法只删除 Firestore 中的用户文档，不会删除 Firebase Authentication 中的用户账户。**

这意味着：
- ✅ 用户数据从数据库中删除
- ❌ 用户仍然可以使用原密码登录
- ❌ 用户登录后会因为找不到用户数据而出错

### 完整删除用户的建议

如果需要完全删除用户（包括 Firebase Auth 账户），需要：

1. **使用 Firebase Admin SDK**（服务端）：
```javascript
// 需要在服务端使用 Firebase Admin SDK
import { getAuth } from 'firebase-admin/auth'

async function deleteUserCompletely(uid) {
  // 删除 Firebase Auth 用户
  await getAuth().deleteUser(uid)
  
  // 删除 Firestore 文档
  await userService.deleteUser(docId)
}
```

2. **或者使用 Cloud Functions**：
```javascript
// functions/index.js
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // 检查管理员权限
  if (!context.auth || !isAdmin(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorized')
  }
  
  // 删除 Auth 用户
  await admin.auth().deleteUser(data.uid)
  
  // 删除 Firestore 文档
  await admin.firestore().collection('users').doc(data.docId).delete()
  
  return { success: true }
})
```

## 测试步骤

### 1. 打开管理员面板

访问：`http://localhost:5173/admin/users`

### 2. 查看用户列表

应该看到所有注册用户的列表

### 3. 点击删除按钮

- 点击某个用户旁边的删除按钮
- 确认删除对话框

### 4. 观察控制台输出

应该看到以下日志：

```
Delete user called with: { id: 'xxx', email: 'xxx@xxx.com', ... }
Calling userService.deleteUser with ID: xxx
Attempting to delete user with ID: xxx
User deleted from Firestore successfully: xxx
Delete result: { ok: true }
```

### 5. 验证删除成功

- ✅ 用户从列表中消失
- ✅ 显示成功消息："User deleted successfully"
- ✅ Firebase Console 中用户文档被删除

## 可能的错误

### 错误 1：权限不足

**错误消息**：
```
Error deleting user: Missing or insufficient permissions
```

**原因**：Firestore 安全规则不允许删除用户

**解决方案**：
检查 `firestore-dev.rules` 中的规则：
```javascript
match /users/{userId} {
  allow delete: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### 错误 2：用户不存在

**错误消息**：
```
Failed to delete user: User not found
```

**原因**：用户文档已被删除或 ID 不正确

**解决方案**：
- 刷新用户列表
- 检查用户 ID 是否正确

### 错误 3：网络错误

**错误消息**：
```
Error deleting user: Network request failed
```

**原因**：网络连接问题

**解决方案**：
- 检查网络连接
- 确认 Firebase 服务可访问

## 数据一致性

删除用户后，还需要考虑清理相关数据：

### 需要清理的数据

1. **用户创建的内容**：
   - 论坛帖子
   - 课程评分
   - 学习进度
   - 收藏列表

2. **用户关联数据**：
   - 用户记录
   - 用户愿望清单

### 建议的清理策略

```javascript
async function deleteUserAndRelatedData(userId) {
  // 1. 删除用户创建的帖子
  await forumService.deleteUserPosts(userId)
  
  // 2. 删除用户评分
  await courseRatingService.deleteUserRatings(userId)
  
  // 3. 删除用户进度
  await userProgressService.deleteUserProgress(userId)
  
  // 4. 删除用户愿望清单
  await wishlistService.deleteUserWishlist(userId)
  
  // 5. 最后删除用户文档
  await userService.deleteUser(userId)
}
```

## 安全建议

1. **添加二次确认**：对于重要操作，可以要求输入用户名确认
2. **软删除**：考虑使用软删除（标记为已删除）而不是物理删除
3. **审计日志**：记录所有删除操作
4. **备份**：删除前自动备份用户数据

## 现在可以使用了！

修复后，管理员可以：
- ✅ 查看所有用户列表
- ✅ 删除用户（Firestore 文档）
- ✅ 看到成功/失败消息
- ✅ 通过控制台日志调试问题
