// 管理员账号创建工具
// 在浏览器控制台中运行此脚本来创建管理员账号

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from './firebase.js'
import { userService } from './firebaseService.js'

export async function createAdminAccount(email = 'admin@admin.com', password = 'Admin123!', username = 'Administrator') {
  try {
    console.log('🔐 开始创建管理员账号...')
    
    // 检查管理员账号是否已存在
    const existingUser = await userService.getUserByEmail(email)
    if (existingUser.ok) {
      console.log('❌ 管理员账号已存在！')
      console.log('邮箱:', email)
      console.log('用户名:', existingUser.user.username)
      console.log('角色:', existingUser.user.role)
      return { ok: false, error: 'Admin account already exists' }
    }
    
    // 验证密码强度
    if (password.length < 8) {
      console.log('❌ 密码长度至少8位')
      return { ok: false, error: 'Password must be at least 8 characters' }
    }
    
    // 使用Firebase Auth创建管理员账户
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // 更新用户的显示名称
    await updateProfile(user, {
      displayName: username
    })
    
    // 创建管理员用户数据在Firestore中
    const adminData = {
      id: user.uid,
      username: username,
      email: email,
      role: 'admin',
      provider: 'local',
      createdAt: new Date().toISOString(),
      isActive: true,
      permissions: [
        'manage_users',
        'manage_courses', 
        'manage_ratings',
        'manage_comments',
        'view_analytics',
        'system_settings'
      ]
    }
    
    // 在Firestore中创建用户文档
    const result = await userService.createUser(adminData)
    
    if (result.ok) {
      console.log('✅ 管理员账号创建成功！')
      console.log('邮箱:', email)
      console.log('密码:', password)
      console.log('用户名:', username)
      console.log('角色:', adminData.role)
      console.log('权限:', adminData.permissions)
      console.log('Firebase UID:', user.uid)
      console.log('')
      console.log('⚠️  请立即登录并修改密码！')
      console.log('登录地址: /login')
      
      return { ok: true, user: result.user }
    } else {
      console.log('❌ 创建失败:', result.error)
      return result
    }
    
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error)
    let errorMessage = '创建失败';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = '邮箱已被使用';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = '密码太弱';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '无效的邮箱地址';
    }
    
    return { ok: false, error: errorMessage };
  }
}

// 在浏览器控制台中使用的便捷函数
window.createAdmin = createAdminAccount

// 使用示例：
// createAdmin() // 使用默认值
// createAdmin('admin@example.com', 'MySecurePassword123!', 'MyAdmin') // 自定义值
