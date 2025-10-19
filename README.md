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

## Firebase Cloud Functions Setup

This project uses Firebase Cloud Functions for serverless backend functionality, including email sending.

### Quick Setup

1. **Install Firebase CLI**:
   ```powershell
   npm install -g firebase-tools
   firebase login
   ```

2. **Install Functions Dependencies**:
   ```powershell
   cd functions
   npm install
   cd ..
   ```

3. **Configure SendGrid for Email**:
   ```powershell
   firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
   firebase functions:config:set sendgrid.from="noreply@yourdomain.com"
   ```

4. **Deploy Functions**:
   ```powershell
   firebase deploy --only functions
   ```

📖 **See [QUICKSTART_CLOUD_FUNCTIONS.md](./QUICKSTART_CLOUD_FUNCTIONS.md) for detailed setup guide**

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

# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

📖 **See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) for detailed Google Maps API setup guide**

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

## Features

### Map Integration (BR E.2 - Geo Location)

The application includes an advanced **Explore Gyms** feature with interactive maps:

#### Two Non-Trivial Features:

1. **Interactive Map Display with POI Information**
   - Real-time display of user location and nearby gyms
   - Interactive markers with detailed information popups
   - Automatic distance calculation from user to each gym
   - Click markers to view gym details (name, rating, distance)
   - Animated marker interactions and smooth map controls

2. **Route Navigation and Trip Planning**
   - Turn-by-turn directions from current location to selected gym
   - Visual route display with colored polyline
   - Comprehensive trip information:
     - Total distance (km)
     - Estimated travel time
     - Number of route steps
   - "Open in Google Maps" for native app integration
   - Automatic route optimization and map fitting

#### Additional Features:
- Dual view modes: Interactive map and sortable list view
- Real-time location detection with accuracy indicator
- Search and filter gyms by name
- Distance-based sorting in list view
- Responsive design for all device sizes
- Smooth animations and transitions

**Access**: Navigate to `/explore` or click "Find a gym" on the homepage

📖 **See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) for setup instructions**

## Security Features

- **Secure Password Hashing**: Uses bcrypt with salt rounds for password storage
- **Server-side Authentication**: All authentication is handled on the server
- **No Hardcoded Passwords**: Admin credentials are configurable via environment variables
- **Password Policy**: Enforces strong passwords (6+ chars, upper, lower, number)
- **Input Validation**: Server-side validation for all authentication requests
- **API Key Protection**: Environment variables for sensitive API keys

## Test accounts (for demo)

- **Admin Account (unique)**: 
  - Email: `admin@admin.com` (configurable via ADMIN_EMAIL)
  - Password: `6212515zbhA` (configurable via ADMIN_PASSWORD)
- Regular users: Can freely register with any email (except the admin email)

**Notes**:
- There is only one admin account, automatically created when the system starts
- New admin account registration is prohibited
- Admin can only login locally (email + password), Google login is not supported
- Admin users are automatically redirected to `/admin` after login
- Regular users are redirected to `/`
- **IMPORTANT**: Change the admin credentials in production by setting ADMIN_EMAIL and ADMIN_PASSWORD environment variables

## Voice Assistant Guide

The application features an intelligent voice assistant that helps users navigate and interact with the website using natural language commands.

### Getting Started

1. **Access the Voice Assistant**: Look for the floating voice assistant button in the bottom-left corner of the screen
2. **Enable Microphone**: Grant microphone permissions when prompted
3. **Start Speaking**: Click the "Record" button and speak your command clearly

### Available Voice Commands

#### Navigation Commands
The voice assistant understands natural language and can navigate to different pages:

**Home Page:**
- "Go to home" / "Home page" / "Main page"
- "Go home" / "Back to home" / "Return home"

**Forum Page:**
- "Open forum" / "Go to forum" / "Forum"
- "I want to talk to people" / "Where can I share?"
- "Community" / "Discussion" / "Chat"

**Learning Page:**
- "Start learning" / "Go to learn" / "Courses"
- "I want to look some courses" / "Show me what I can learn"
- "I want to study" / "Where are the tutorials?"
- "Training" / "Education" / "Lessons"

**Records Page:**
- "View records" / "Health records" / "My records"
- "Show me my progress" / "I want to see my data"
- "Where are my stats?" / "Track my health"
- "My progress" / "Analytics"

**Explore Page:**
- "Explore" / "Discovery page" / "Find gyms"
- "Where can I find gyms?" / "Show me nearby locations"
- "I want to discover fitness places" / "Gyms nearby"
- "Search gym" / "Find fitness center"

**Profile Page:**
- "My profile" / "Profile page" / "Show my profile"
- "I want to edit my information" / "Where are my settings?"
- "Account" / "Personal information" / "My details"

#### Function Commands

**Search:**
- "Search gym" / "Find gym" / "Look for gyms"
- "Where are gyms nearby?" / "Find fitness places"

**Help:**
- "Help" / "What can you do?" / "What are my options?"

**Logout:**
- "Logout" / "Sign out" / "Log out"

### Smart Features

#### Natural Language Understanding
The voice assistant uses advanced AI to understand your intent, even with casual or incomplete phrases:

**Examples:**
- "I want to look some courses" → Opens learning page
- "Show me my progress" → Opens records page
- "Where can I find gyms?" → Opens explore page
- "I want to talk to people" → Opens forum page

#### Voice Feedback
- **Enable/Disable**: Toggle voice responses with the "Mute"/"Unmute" button
- **Repeat Response**: Use "Repeat" to replay the last assistant response
- **Stop Speaking**: Use "Stop" to interrupt current speech

#### Conversation History
- View your conversation history with the assistant
- Clear history anytime with the "Clear" button
- Help panel shows available commands

### Tips for Best Results

#### Speaking Tips:
- Speak clearly and at normal pace
- Use a quiet environment
- Hold your device close to your mouth
- Avoid background noise

#### Command Tips:
- Use natural language - don't worry about exact phrases
- Be specific about what you want to do
- The assistant understands context and intent

### Troubleshooting

#### Common Issues:

**"Page not found" Error:**
- Ensure you're logged in
- Try simpler commands like "home", "forum", "learn"
- Check browser console (F12) for detailed error messages

**Voice Recognition Problems:**
- Check microphone permissions
- Speak more clearly and slowly
- Try alternative phrases
- Use a quieter environment

**No Response:**
- Check if voice feedback is enabled
- Ensure Gemini API key is configured
- Verify network connection

#### Debug Mode:
Open browser console (F12) to see detailed logs of:
- Speech recognition results
- Command analysis
- Navigation attempts
- Error messages

### Technical Requirements

- **Browser Support**: Chrome (recommended), Firefox, Safari, Edge
- **Microphone Access**: Required for voice input
- **Internet Connection**: Required for AI processing
- **API Keys**: Gemini API key for intelligent command processing

### Environment Setup

Add to your `.env` file:
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: The voice assistant is only available for logged-in users and appears as a floating button in the bottom-left corner of the screen.
