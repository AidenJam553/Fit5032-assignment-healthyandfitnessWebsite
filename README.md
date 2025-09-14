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

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_ID=your_google_client_id_here

# API Configuration
VITE_API_URL=http://localhost:5175/api
```

## Firebase Setup

### Step-by-step instructions:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Create a new project** or select existing project
3. **Enable Firestore Database**:
   - Go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select a location for your database
4. **Get your configuration**:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click "Add app" and select Web app
   - Copy the configuration object
   - Replace the values in your `.env` file
5. **Set up security rules** (for production):
   - Go to "Firestore Database" → "Rules"
   - Update rules to secure your data

### Firebase Collections Structure

The app uses the following Firestore collections:
- `users` - User profiles and authentication data
- `posts` - Forum posts and discussions
- `comments` - Post comments and replies
- `lessons` - Course content and metadata
- `progress` - User learning progress
- `records` - User health and fitness records
- `wishlist` - User course wishlists

## Security Features

- **Secure Password Hashing**: Uses bcrypt with salt rounds for password storage
- **Server-side Authentication**: All authentication is handled on the server
- **No Hardcoded Passwords**: Admin credentials are configurable via environment variables
- **Password Policy**: Enforces strong passwords (6+ chars, upper, lower, number)
- **Input Validation**: Server-side validation for all authentication requests

## Test accounts (for demo)

- **Admin Account (unique)**: 
  - Email: `admin1@admin.com` (configurable via ADMIN_EMAIL)
  - Password: `admin1234A` (configurable via ADMIN_PASSWORD)
- Regular users: Can freely register with any email (except the admin email)

**Notes**:
- There is only one admin account, automatically created when the system starts
- New admin account registration is prohibited
- Admin can only login locally (email + password), Google login is not supported
- Admin users are automatically redirected to `/admin` after login
- Regular users are redirected to `/`
- **IMPORTANT**: Change the admin credentials in production by setting ADMIN_EMAIL and ADMIN_PASSWORD environment variables
