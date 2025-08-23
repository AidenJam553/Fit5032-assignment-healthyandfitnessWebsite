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

1. Create a Google Cloud project and configure OAuth 2.0 Client ID (Web)
2. Authorized JavaScript origins: `http://localhost:5174` (or the port shown by Vite)
3. Redirect URIs are not required for the Identity Services button
4. Use the environment variables shown above

## Test accounts (for demo)

- Admin emails: `admin@admin.com`, or any address ending with `@admin.com`
- User email: `user@example.com`

Behavior:
- Admin emails redirect to `/admin`
- Others redirect to `/`
