# Healthy & Fitness

## Project setup

```powershell
npm install
```

### Development

Start both front-end (Vite) and back-end (Express with Google auth proxy):

```powershell
$env:GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"
$env:VITE_GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"
npm run dev:full
```

Front-end only:

```powershell
$env:VITE_GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"
npm run dev
```

Back-end only:

```powershell
$env:GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"
npm run server
```

Vite will print the local URL (e.g. `http://localhost:5174`). The API runs at `http://localhost:5175` and is proxied under `/api`.

## Google OAuth setup

### Step-by-step instructions:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project**
3. **Enable APIs**: 
   - Go to "APIs & Services" → "Library"
   - Search for and enable "Google Identity API" or "Google+ API"
4. **Create OAuth 2.0 Client ID**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application" as the application type
5. **Configure authorized origins**:
   - Add these JavaScript origins:
     - `http://localhost:5173` (default Vite dev port)
     - `http://127.0.0.1:5173`
     - Your production domain when deploying
6. **Copy the Client ID** and use it in the environment variables above

### Common issues:

- **"Origin not allowed" error**: Make sure you've added the correct localhost URL to authorized origins
- **No Google button**: Check that VITE_GOOGLE_CLIENT_ID is set correctly
- **"Missing credential" error**: Backend GOOGLE_CLIENT_ID should match the frontend one

### Alternative setup with .env file:

Create a `.env` file in the root directory:
```bash
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id-here
GOOGLE_CLIENT_ID=your-google-oauth-client-id-here
```

## Test accounts (for demo)

- **管理员账号（唯一）**: 
  - 邮箱: `admin@admin.com`
  - 密码: `Admin123`
- 普通用户: 可自由注册任意邮箱（除管理员邮箱外）

**注意**:
- 管理员账号有且只有一个，系统启动时会自动创建
- 禁止注册新的管理员账号
- 管理员只能通过本地登录（邮箱+密码），不支持Google登录
- 管理员登录后自动重定向到 `/admin`
- 普通用户重定向到 `/`
