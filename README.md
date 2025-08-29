# Healthy & Fitness

## Project setup

```powershell
npm install
```

### Development

Start both front-end (Vite) and back-end (Express with Google auth proxy):

```powershell
$env:GOOGLE_CLIENT_ID = 85238754646-roumsc2u2pghvqd03rb6dck6ht2gnuqi.apps.googleusercontent.com
$env:VITE_GOOGLE_CLIENT_ID = 85238754646-roumsc2u2pghvqd03rb6dck6ht2gnuqi.apps.googleusercontent.com
npm run dev:full
```

Front-end only:

```powershell
$env:VITE_GOOGLE_CLIENT_ID = 85238754646-roumsc2u2pghvqd03rb6dck6ht2gnuqi.apps.googleusercontent.com
npm run dev
```

Back-end only:

```powershell
$env:GOOGLE_CLIENT_ID = 85238754646-roumsc2u2pghvqd03rb6dck6ht2gnuqi.apps.googleusercontent.com
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
VITE_GOOGLE_CLIENT_ID=85238754646-roumsc2u2pghvqd03rb6dck6ht2gnuqi.apps.googleusercontent.com
GOOGLE_CLIENT_ID=85238754646-roumsc2u2pghvqd03rb6dck6ht2gnuqi.apps.googleusercontent.com
```

## Test accounts (for demo)

- **Admin Account (unique)**: 
  - Email: `admin@admin.com`
  - Password: `Admin123`
- Regular users: Can freely register with any email (except the admin email)

**Notes**:
- There is only one admin account, automatically created when the system starts
- New admin account registration is prohibited
- Admin can only login locally (email + password), Google login is not supported
- Admin users are automatically redirected to `/admin` after login
- Regular users are redirected to `/`
