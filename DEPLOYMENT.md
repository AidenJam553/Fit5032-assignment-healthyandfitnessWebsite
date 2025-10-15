# 云部署指南 - Healthy & Fitness Website

## 部署选项

### 选项1: Cloudflare Pages (推荐)

#### 步骤1: 准备部署文件
1. 确保项目已构建完成：
   ```bash
   npm run build
   ```

2. 将以下文件复制到 `dist` 目录：
   - `_headers` (已创建)
   - `_redirects` (已创建)

#### 步骤2: 部署到Cloudflare Pages
1. 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
2. 登录你的Cloudflare账户
3. 点击 "Create a project"
4. 选择 "Upload assets"
5. 上传整个 `dist` 文件夹
6. 配置项目设置：
   - Project name: `healthy-fitness-website`
   - Production branch: `main`

#### 步骤3: 配置环境变量
在Cloudflare Pages项目设置中添加以下环境变量：

```
VITE_FIREBASE_API_KEY=AIzaSyDZqgFcjZoezN7uTbLfCcpe4XJLfCjidA4
VITE_FIREBASE_AUTH_DOMAIN=fit5032-46960.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fit5032-46960
VITE_FIREBASE_STORAGE_BUCKET=fit5032-46960.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=932482057735
VITE_FIREBASE_APP_ID=1:932482057735:web:a6213d43e47a7bbf278ca2
VITE_API_URL=https://your-backend-url.com/api
VITE_GOOGLE_CLIENT_ID=85238754646-roumsc2u2pghvqd03rb6dck6ht2gnuqi.apps.googleusercontent.com
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDzxWpPNok-Gi6TQZmPnAZw_eqafsslcGw
VITE_GEMINI_API_KEY=AIzaSyCcNlLiZtZyzZQCdIyT9P2I9gl-Fjdl5Rc
```

### 选项2: Vercel

#### 步骤1: 安装Vercel CLI
```bash
npm install -g vercel
```

#### 步骤2: 创建vercel.json配置
```json
{
  "builds": [
    {
      "src": "dist/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
```

#### 步骤3: 部署
```bash
vercel --prod
```

### 选项3: Netlify

#### 步骤1: 创建netlify.toml
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

#### 步骤2: 部署
1. 访问 [Netlify](https://netlify.com/)
2. 拖拽 `dist` 文件夹到部署区域
3. 配置环境变量

## 部署后检查清单

- [ ] 网站可以正常访问
- [ ] 用户注册/登录功能正常
- [ ] Firebase连接正常
- [ ] Google Maps功能正常
- [ ] 所有页面路由正常
- [ ] 移动端响应式设计正常
- [ ] 性能测试通过

## 故障排除

### 常见问题
1. **路由404错误**: 确保配置了正确的重定向规则
2. **环境变量未生效**: 检查变量名是否以 `VITE_` 开头
3. **API调用失败**: 检查CORS配置和后端API地址

### 性能优化
1. 启用CDN缓存
2. 压缩静态资源
3. 使用HTTP/2
4. 启用Gzip压缩
