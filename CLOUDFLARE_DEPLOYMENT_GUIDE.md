# Cloudflare Pages 部署指南

## 🚀 快速部署步骤

### 1. 访问 Cloudflare Pages
- 打开浏览器，访问：https://pages.cloudflare.com/
- 使用你的 Cloudflare 账户登录（如果没有账户，请先注册）

### 2. 创建新项目
1. 点击 **"Create a project"** 按钮
2. 选择 **"Upload assets"** 选项
3. 项目名称填写：`healthy-fitness-website`

### 3. 上传文件
1. 选择你的 `dist` 文件夹（整个文件夹）
2. 点击 **"Upload and Deploy"**

### 4. 配置环境变量
部署完成后，进入项目设置：

1. 点击项目名称进入项目详情
2. 点击 **"Settings"** 标签
3. 找到 **"Environment variables"** 部分
4. 添加以下环境变量：

```
VITE_FIREBASE_API_KEY = AIzaSyDZqgFcjZoezN7uTbLfCcpe4XJLfCjidA4
VITE_FIREBASE_AUTH_DOMAIN = fit5032-46960.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = fit5032-46960
VITE_FIREBASE_STORAGE_BUCKET = fit5032-46960.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 932482057735
VITE_FIREBASE_APP_ID = 1:932482057735:web:a6213d43e47a7bbf278ca2
VITE_API_URL = https://your-backend-url.com/api
VITE_GOOGLE_CLIENT_ID = 85238754646-roumsc2u2pghvqd03rb6dck6ht2gnuqi.apps.googleusercontent.com
VITE_GOOGLE_MAPS_API_KEY = AIzaSyDzxWpPNok-Gi6TQZmPnAZw_eqafsslcGw
VITE_GEMINI_API_KEY = AIzaSyCcNlLiZtZyzZQCdIyT9P2I9gl-Fjdl5Rc
```

### 5. 自定义域名（可选）
1. 在项目设置中找到 **"Custom domains"**
2. 添加你的自定义域名
3. 按照指示配置DNS记录

## 🔧 部署后配置

### 检查部署状态
1. 访问你的部署URL（格式：`https://your-project-name.pages.dev`）
2. 确保所有页面都能正常访问
3. 测试用户注册/登录功能
4. 验证Firebase连接
5. 检查Google Maps功能

### 性能优化
1. 在Cloudflare Pages设置中启用：
   - **Auto Minify**: HTML, CSS, JS
   - **Brotli Compression**
   - **HTTP/2 Server Push**

## 🐛 故障排除

### 常见问题及解决方案

#### 1. 页面显示空白
- 检查浏览器控制台是否有JavaScript错误
- 确认环境变量配置正确
- 检查Firebase配置

#### 2. 路由404错误
- 确认 `_redirects` 文件已正确上传
- 检查重定向规则配置

#### 3. API调用失败
- 检查 `VITE_API_URL` 环境变量
- 确认后端API服务正常运行
- 检查CORS配置

#### 4. Firebase认证失败
- 确认Firebase项目配置正确
- 检查域名是否在Firebase授权域名列表中

## 📊 部署验证清单

- [ ] 网站首页正常加载
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] Firebase数据库连接正常
- [ ] Google Maps显示正常
- [ ] 所有页面路由正常
- [ ] 移动端响应式设计正常
- [ ] 管理员功能正常
- [ ] 文件上传功能正常
- [ ] 邮件发送功能正常

## 🔗 有用的链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Vue.js 部署指南](https://vuejs.org/guide/scaling-up/deployment.html)
- [Firebase 配置指南](https://firebase.google.com/docs/web/setup)

## 📞 技术支持

如果遇到部署问题，请检查：
1. 浏览器开发者工具的控制台错误
2. Cloudflare Pages 的构建日志
3. Firebase 控制台的错误日志
