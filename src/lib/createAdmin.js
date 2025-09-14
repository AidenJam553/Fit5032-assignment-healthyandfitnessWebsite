// 管理员账号创建工具
// 在浏览器控制台中运行此脚本来创建管理员账号

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
    
    // 创建管理员用户数据
    const adminData = {
      id: email, // 使用邮箱作为ID
      username: username,
      email: email,
      password: password, // 注意：这里应该加密，但为了简化，我们让userService处理
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
    
    // 使用userService创建用户（会自动处理密码加密）
    const result = await userService.createUser(adminData)
    
    if (result.ok) {
      console.log('✅ 管理员账号创建成功！')
      console.log('邮箱:', email)
      console.log('密码:', password)
      console.log('用户名:', username)
      console.log('角色:', adminData.role)
      console.log('权限:', adminData.permissions)
      console.log('')
      console.log('⚠️  请立即登录并修改密码！')
      console.log('登录地址: /auth/login')
      
      return { ok: true, user: result.user }
    } else {
      console.log('❌ 创建失败:', result.error)
      return result
    }
    
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error)
    return { ok: false, error: error.message }
  }
}

// 在浏览器控制台中使用的便捷函数
window.createAdmin = createAdminAccount

// 使用示例：
// createAdmin() // 使用默认值
// createAdmin('admin@example.com', 'MySecurePassword123!', 'MyAdmin') // 自定义值
