# Firebase Authentication 集成说明

## 概述

您的项目现在已经完全集成了Firebase Authentication，支持以下功能：

- ✅ Email/Password 登录和注册
- ✅ Google OAuth 登录
- ✅ 用户状态管理
- ✅ 管理员权限控制
- ✅ Firestore 安全规则

## 主要更改

### 1. 认证函数更新 (`src/lib/auth.js`)
- 使用Firebase Authentication API替代自定义认证
- 支持Email/Password和Google登录
- 自动同步用户状态到localStorage
- 添加认证状态监听器

### 2. 登录页面更新 (`src/pages/AuthLogin.vue`)
- 简化的Google登录按钮
- 直接使用Firebase Auth API
- 改进的错误处理

### 3. 注册页面更新 (`src/pages/AuthRegister.vue`)
- 使用Firebase Auth创建用户
- 自动在Firestore中创建用户文档
- 支持Google注册

### 4. 管理员账户创建 (`src/lib/createAdmin.js`)
- 使用Firebase Auth创建管理员
- 在Firestore中设置管理员权限
- 支持自定义管理员信息

### 5. 安全规则更新 (`firestore-dev.rules`)
- 基于用户角色的访问控制
- 用户只能访问自己的数据
- 管理员可以管理所有内容

## 使用方法

### 创建管理员账户

在浏览器控制台中运行：

```javascript
// 使用默认设置
createAdmin()

// 或自定义设置
createAdmin('admin@yourdomain.com', 'SecurePassword123!', 'YourAdminName')
```

### 用户登录

1. **Email/Password登录**：
   - 访问 `/login` 页面
   - 输入邮箱和密码
   - 系统会自动验证并设置用户状态

2. **Google登录**：
   - 点击"Sign in with Google"按钮
   - 完成Google OAuth流程
   - 自动创建或登录用户账户

### 用户注册

1. **Email/Password注册**：
   - 访问 `/register` 页面
   - 填写用户名、邮箱和密码
   - 系统会创建Firebase Auth用户和Firestore文档

2. **Google注册**：
   - 点击"Sign in with Google"按钮
   - 首次使用会自动创建账户

## 环境变量配置

确保您的 `.env` 文件包含以下配置：

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# Google OAuth (可选)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 安全规则部署

将 `firestore-dev.rules` 部署到Firebase：

```bash
firebase deploy --only firestore:rules
```

## 功能特性

### 用户管理
- 自动用户状态同步
- 基于角色的权限控制
- 安全的密码策略

### 管理员功能
- 创建管理员账户
- 管理用户权限
- 访问管理面板

### 数据安全
- Firestore安全规则保护
- 用户数据隔离
- 管理员权限验证

## 故障排除

### 常见问题

1. **Google登录不工作**：
   - 检查Google OAuth配置
   - 确保域名在授权列表中
   - 验证Client ID设置

2. **用户状态不同步**：
   - 检查Firebase配置
   - 验证网络连接
   - 查看浏览器控制台错误

3. **权限错误**：
   - 检查Firestore安全规则
   - 验证用户角色
   - 确认管理员权限

### 调试技巧

1. 查看浏览器控制台日志
2. 检查Firebase控制台
3. 验证环境变量设置
4. 测试网络连接

## 下一步

1. 部署到生产环境
2. 配置生产环境安全规则
3. 设置用户邮箱验证
4. 添加密码重置功能
5. 实现用户资料管理

## 支持

如有问题，请检查：
- Firebase控制台设置
- 浏览器开发者工具
- 网络连接状态
- 环境变量配置
