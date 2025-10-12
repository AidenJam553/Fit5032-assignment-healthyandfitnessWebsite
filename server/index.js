import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { OAuth2Client } from 'google-auth-library'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import sgMail from '@sendgrid/mail'
import multer from 'multer'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, getDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore'
import admin from 'firebase-admin'

// Load environment variables
dotenv.config()

// Initialize Firebase Client SDK (for Firestore)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}

const firebaseApp = initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp)
console.log('Firebase Client SDK initialized in server')

// Initialize Firebase Admin SDK (for Authentication management)
let adminAuth = null
try {
  // Try to initialize Admin SDK with service account
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID
    })
    adminAuth = admin.auth()
    console.log('✅ Firebase Admin SDK initialized successfully')
  } else {
    // Fallback: Initialize without service account (limited functionality)
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not found. Admin SDK running with limited functionality.')
    console.warn('   To delete Firebase Authentication users, please add service account key to .env')
    // Try default credentials (works in production environments like Cloud Run)
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID
    })
    adminAuth = admin.auth()
    console.log('⚠️ Firebase Admin SDK initialized with default credentials')
  }
} catch (err) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', err.message)
  console.error('   User deletion from Firebase Authentication will not work.')
}

const app = express()

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://firestore.googleapis.com", "https://identitytoolkit.googleapis.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}))

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 100个请求
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // 生产环境域名
    : ['http://localhost:5173', 'http://localhost:5174'], // 开发环境
  credentials: true
}))

app.use(bodyParser.json({ limit: '1mb' }))

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123'
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || ''

const client = new OAuth2Client(GOOGLE_CLIENT_ID)

// Initialize SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
  console.log('SendGrid initialized successfully')
} else {
  console.warn('Warning: SENDGRID_API_KEY not configured')
}

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// In-memory user storage (in production, use a proper database)
let users = []

// Initialize default admin account
function initializeDefaultAdmin() {
  const adminExists = users.some(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  
  if (!adminExists) {
    const saltRounds = 10
    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, saltRounds)
    const adminUser = {
      id: 'admin-001',
      username: 'Admin',
      email: ADMIN_EMAIL,
      provider: 'local',
      passwordHash: passwordHash,
      role: 'admin',
      createdAt: new Date().toISOString(),
    }
    users.push(adminUser)
  }
}

// Initialize admin account
initializeDefaultAdmin()

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// 安全工具函数
function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>]/g, '') // 移除尖括号
    .replace(/javascript:/gi, '') // 移除javascript:协议
    .replace(/on\w+=/gi, '') // 移除事件处理器
    .replace(/script/gi, '') // 移除script关键词
    .substring(0, 1000) // 限制长度
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email.trim())
}

function validateUsername(username) {
  if (!username || typeof username !== 'string') return false
  const trimmed = username.trim()
  if (trimmed.length < 2 || trimmed.length > 50) return false
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  return usernameRegex.test(trimmed)
}

function checkForDangerousContent(content) {
  if (typeof content !== 'string') return { safe: true, warnings: [] }
  
  const warnings = []
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ]
  
  xssPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      warnings.push('Potentially dangerous content detected')
    }
  })
  
  return {
    safe: warnings.length === 0,
    warnings
  }
}

// Password policy validation
function passwordMeetsPolicy(password) {
  if (!password || password.length < 8) return false
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  return hasLower && hasUpper && hasDigit && hasSpecial
}

// Check if email is admin email
function isAdminEmail(email) {
  if (!email) return false
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

// User registration endpoint
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body || {}
    
    // 输入清理和验证
    const cleanUsername = sanitizeInput(username)
    const cleanEmail = sanitizeInput(email)
    
    // Validate input
    if (!cleanUsername || !cleanEmail || !password) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' })
    }
    
    // 验证邮箱格式
    if (!validateEmail(cleanEmail)) {
      return res.status(400).json({ ok: false, error: 'Invalid email format' })
    }
    
    // 验证用户名格式
    if (!validateUsername(cleanUsername)) {
      return res.status(400).json({ ok: false, error: 'Username must be 2-50 characters and contain only letters, numbers, underscores, and hyphens' })
    }
    
    // 检查危险内容
    const usernameCheck = checkForDangerousContent(cleanUsername)
    if (!usernameCheck.safe) {
      return res.status(400).json({ ok: false, error: 'Username contains potentially dangerous content' })
    }
    
    // Prohibit registration of admin accounts
    if (isAdminEmail(cleanEmail)) {
      return res.status(400).json({ ok: false, error: 'Admin account already exists, registration of new admin accounts is prohibited' })
    }
    
    // Check if user already exists
    const existsByUsername = users.some(u => u.username?.toLowerCase() === cleanUsername.toLowerCase())
    if (existsByUsername) {
      return res.status(400).json({ ok: false, error: 'Username already exists' })
    }
    
    const existsByEmail = users.some(u => u.email?.toLowerCase() === cleanEmail.toLowerCase())
    if (existsByEmail) {
      return res.status(400).json({ ok: false, error: 'Email already exists' })
    }
    
    // Validate password policy
    if (!passwordMeetsPolicy(password)) {
      return res.status(400).json({ ok: false, error: 'Password must be 8+ chars with lower, upper, number, and special character' })
    }
    
    // Hash password
    const saltRounds = 10
    const passwordHash = bcrypt.hashSync(password, saltRounds)
    
    // Create user
    const user = {
      id: crypto.randomUUID(),
      username: cleanUsername,
      email: cleanEmail,
      provider: 'local',
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
    }
    
    users.push(user)
    
    // Return user without password hash
    const { passwordHash: _, ...userResponse } = user
    res.json({ ok: true, user: userResponse })
  } catch (err) {
    console.error('Registration error', err)
    res.status(500).json({ ok: false, error: 'Internal server error' })
  }
})

// User login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {}
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Missing email or password' })
    }
    
    // Find user
    const user = users.find(u => u.email?.toLowerCase() === String(email).toLowerCase())
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Account not found' })
    }
    
    if (user.provider === 'google') {
      return res.status(401).json({ ok: false, error: 'This account uses Google sign-in' })
    }
    
    // Verify password
    const match = bcrypt.compareSync(password, user.passwordHash)
    if (!match) {
      return res.status(401).json({ ok: false, error: 'Incorrect password' })
    }
    
    // Return user without password hash
    const { passwordHash: _, ...userResponse } = user
    res.json({ ok: true, user: userResponse })
  } catch (err) {
    console.error('Login error', err)
    res.status(500).json({ ok: false, error: 'Internal server error' })
  }
})

// Get user profile endpoint
app.get('/api/user/profile', (req, res) => {
  try {
    const { userId } = req.query || {}
    
    if (!userId) {
      return res.status(400).json({ ok: false, error: 'Missing user ID' })
    }
    
    const user = users.find(u => u.id === userId)
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' })
    }
    
    // Return user without password hash
    const { passwordHash: _, ...userResponse } = user
    res.json({ ok: true, user: userResponse })
  } catch (err) {
    console.error('Get profile error', err)
    res.status(500).json({ ok: false, error: 'Internal server error' })
  }
})

// Update user profile endpoint
app.put('/api/user/profile', (req, res) => {
  try {
    const { userId, ...profileData } = req.body || {}
    
    if (!userId) {
      return res.status(400).json({ ok: false, error: 'Missing user ID' })
    }
    
    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      return res.status(404).json({ ok: false, error: 'User not found' })
    }
    
    // Validate profile data
    const { username, email, phone, dob, gender, weightKg, heightCm, bmrKcal, bio, region, avatarDataUrl } = profileData
    
    // Validate username
    if (username && username.trim().length < 2) {
      return res.status(400).json({ ok: false, error: 'Username is too short' })
    }
    
    // Check for duplicate username
    if (username) {
      const duplicateUser = users.find(u => u.id !== userId && u.username?.toLowerCase() === username.toLowerCase())
      if (duplicateUser) {
        return res.status(400).json({ ok: false, error: 'Username already exists' })
      }
    }
    
    // Validate email
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Invalid email' })
    }
    
    // Check for duplicate email
    if (email) {
      const duplicateUser = users.find(u => u.id !== userId && u.email?.toLowerCase() === email.toLowerCase())
      if (duplicateUser) {
        return res.status(400).json({ ok: false, error: 'Email already exists' })
      }
    }
    
    // Validate numeric fields
    if (weightKg !== undefined && Number(weightKg) < 0) {
      return res.status(400).json({ ok: false, error: 'Weight cannot be negative' })
    }
    if (heightCm !== undefined && Number(heightCm) < 0) {
      return res.status(400).json({ ok: false, error: 'Height cannot be negative' })
    }
    if (bmrKcal !== undefined && Number(bmrKcal) < 0) {
      return res.status(400).json({ ok: false, error: 'BMR cannot be negative' })
    }
    
    // Update user profile
    const updatedUser = {
      ...users[userIndex],
      ...(username && { username: username.trim() }),
      ...(email && { email: email.trim() }),
      ...(phone !== undefined && { phone }),
      ...(dob !== undefined && { dob }),
      ...(gender !== undefined && { gender }),
      ...(weightKg !== undefined && { weightKg: Number(weightKg) || 0 }),
      ...(heightCm !== undefined && { heightCm: Number(heightCm) || 0 }),
      ...(bmrKcal !== undefined && { bmrKcal: Number(bmrKcal) || 0 }),
      ...(bio !== undefined && { bio }),
      ...(region !== undefined && { region }),
      ...(avatarDataUrl !== undefined && { avatarDataUrl }),
      updatedAt: new Date().toISOString()
    }
    
    users[userIndex] = updatedUser
    
    // Return updated user without password hash
    const { passwordHash: _, ...userResponse } = updatedUser
    res.json({ ok: true, user: userResponse })
  } catch (err) {
    console.error('Update profile error', err)
    res.status(500).json({ ok: false, error: 'Internal server error' })
  }
})

app.post('/api/auth/google', async (req, res) => {
  try {
    const { code } = req.body || {}
    console.log('Google OAuth request received, code:', code ? 'present' : 'missing')
    console.log('Environment variables check:')
    console.log('- GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? 'Set' : 'Not set')
    console.log('- NODE_ENV:', process.env.NODE_ENV)
    
    if (!code) return res.status(400).json({ ok: false, error: 'Missing authorization code' })
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ ok: false, error: 'Missing GOOGLE_CLIENT_ID' })

    console.log('Processing Google OAuth code with client ID:', GOOGLE_CLIENT_ID)

    // 使用授权码获取访问令牌
    console.log('Attempting to get tokens from Google...')
    const { tokens } = await client.getToken({
      code: code,
      redirect_uri: 'http://localhost:5173/login'
    })

    console.log('Google OAuth tokens received:', !!tokens)
    console.log('Token details:', tokens ? Object.keys(tokens) : 'No tokens')

    if (!tokens) {
      return res.status(401).json({ ok: false, error: 'Failed to get tokens from Google' })
    }

    // 设置访问令牌
    client.setCredentials(tokens)

    // 获取用户信息
    console.log('Verifying ID token...')
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    })
    
    const payload = ticket.getPayload()
    console.log('Token payload:', payload ? 'Valid' : 'Invalid')
    
    if (!payload) {
      console.error('Invalid token payload')
      return res.status(401).json({ ok: false, error: 'Invalid token payload' })
    }

    const { email, name, sub } = payload
    console.log('Google OAuth user info:', { email, name, sub })
    
    // Prohibit creating admin accounts through Google login
    if (isAdminEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Admin account can only login locally, please use password login' })
    }
    
    // Find or create user
    let user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) {
      const username = name ? name.trim() : email.split('@')[0]
      user = {
        id: crypto.randomUUID(),
        username,
        email,
        provider: 'google',
        role: 'user',
        createdAt: new Date().toISOString(),
      }
      users.push(user)
      console.log('New Google user created:', user.email)
    } else {
      console.log('Existing Google user logged in:', user.email)
    }
    
    // Return user
    console.log('Google OAuth success, returning user:', user.email)
    res.json({ ok: true, user })
  } catch (err) {
    console.error('Google auth error', err)
    res.status(401).json({ ok: false, error: `Google authentication failed: ${err.message}` })
  }
})

// Get all users (admin only) for email recipient selection from Firebase
app.get('/api/admin/users', async (req, res) => {
  try {
    console.log('Fetching users from Firestore...')
    
    // Get all users from Firestore
    const usersCollection = collection(db, 'users')
    const querySnapshot = await getDocs(usersCollection)
    
    const usersList = []
    querySnapshot.forEach((doc) => {
      const userData = doc.data()
      usersList.push({
        id: doc.id,
        username: userData.username || userData.displayName || 'Unknown',
        email: userData.email,
        role: userData.role || 'user',
        provider: userData.provider || 'firebase',
        createdAt: userData.createdAt
      })
    })
    
    console.log(`Found ${usersList.length} users in Firestore`)
    res.json({ ok: true, users: usersList })
  } catch (err) {
    console.error('Get users error', err)
    res.status(500).json({ ok: false, error: 'Internal server error: ' + err.message })
  }
})

// Send email endpoint with attachment support
app.post('/api/admin/send-email', upload.array('attachments', 5), async (req, res) => {
  try {
    // Check SendGrid configuration
    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      return res.status(500).json({ 
        ok: false, 
        error: 'SendGrid is not configured. Please set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in environment variables.' 
      })
    }

    const { to, subject, text, html } = req.body
    
    // Validate required fields
    if (!to || !subject) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields: to and subject are required' 
      })
    }
    
    if (!text && !html) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Email must have either text or html content' 
      })
    }
    
    // Parse recipients (can be comma-separated)
    const recipients = to.split(',').map(email => email.trim()).filter(email => email)
    
    // Validate email addresses
    const invalidEmails = recipients.filter(email => !validateEmail(email))
    if (invalidEmails.length > 0) {
      return res.status(400).json({ 
        ok: false, 
        error: `Invalid email addresses: ${invalidEmails.join(', ')}` 
      })
    }
    
    // Prepare email message
    const msg = {
      to: recipients,
      from: SENDGRID_FROM_EMAIL,
      subject: sanitizeInput(subject),
      text: text || undefined,
      html: html || undefined,
    }
    
    // Add attachments if any
    if (req.files && req.files.length > 0) {
      msg.attachments = req.files.map(file => ({
        content: file.buffer.toString('base64'),
        filename: file.originalname,
        type: file.mimetype,
        disposition: 'attachment'
      }))
    }
    
    // Send email
    console.log('Sending email to:', recipients)
    console.log('SendGrid message:', JSON.stringify(msg, null, 2))
    
    try {
      const result = await sgMail.send(msg)
      console.log('SendGrid API response:', result)
      console.log('Email sent successfully to:', recipients)
      
      res.json({ 
        ok: true, 
        message: `Email sent successfully to ${recipients.length} recipient(s)`,
        recipients: recipients.length
      })
    } catch (sendError) {
      console.error('SendGrid send error:', sendError)
      console.error('SendGrid error details:', JSON.stringify(sendError.response?.body, null, 2))
      throw sendError
    }
  } catch (err) {
    console.error('Send email error', err)
    
    // SendGrid specific error handling
    if (err.response) {
      console.error('SendGrid error response:', err.response.body)
      return res.status(err.code || 500).json({ 
        ok: false, 
        error: `SendGrid error: ${err.message}`,
        details: err.response.body?.errors || []
      })
    }
    
    res.status(500).json({ 
      ok: false, 
      error: `Failed to send email: ${err.message}` 
    })
  }
})

// Cleanup orphan users (users in Firestore but not in Authentication)
app.post('/api/admin/cleanup-orphan-users', async (req, res) => {
  try {
    console.log('🧹 Starting orphan user cleanup...')
    
    if (!adminAuth) {
      return res.status(500).json({
        ok: false,
        error: 'Firebase Admin SDK not initialized'
      })
    }
    
    // Get all users from Firebase Authentication
    const listUsersResult = await adminAuth.listUsers()
    const authUsers = listUsersResult.users
    const authEmails = new Set(authUsers.map(u => u.email))
    
    console.log(`Found ${authUsers.length} users in Authentication`)
    
    // Get all users from Firestore
    const firestoreSnapshot = await getDocs(collection(db, 'users'))
    
    console.log(`Found ${firestoreSnapshot.size} users in Firestore`)
    
    const deletedUsers = []
    const keptUsers = []
    
    // Check each Firestore user
    for (const docSnap of firestoreSnapshot.docs) {
      const docId = docSnap.id
      const userData = docSnap.data()
      const email = userData.email
      
      if (!email || !authEmails.has(email)) {
        // User doesn't exist in Authentication - delete from Firestore
        console.log(`🗑️  Deleting orphan user: ${email || docId}`)
        
        try {
          await deleteDoc(doc(db, 'users', docId))
          deletedUsers.push({ docId, email: email || 'N/A' })
          console.log(`   ✅ Deleted`)
        } catch (err) {
          console.error(`   ❌ Failed to delete: ${err.message}`)
        }
      } else {
        // User exists in Authentication - keep
        const authUser = authUsers.find(u => u.email === email)
        keptUsers.push({ email, authUid: authUser.uid })
        console.log(`✓ Keeping ${email}`)
      }
    }
    
    console.log(`\n✅ Cleanup complete: deleted ${deletedUsers.length}, kept ${keptUsers.length}`)
    
    res.json({
      ok: true,
      message: `Cleaned up ${deletedUsers.length} orphan users`,
      details: {
        authUsers: authUsers.length,
        firestoreUsers: firestoreSnapshot.size,
        deleted: deletedUsers.length,
        kept: keptUsers.length,
        deletedUsers,
        keptUsers
      }
    })
  } catch (err) {
    console.error('❌ Cleanup error:', err)
    res.status(500).json({
      ok: false,
      error: err.message
    })
  }
})

// Sync Authentication UIDs to Firestore
app.post('/api/admin/sync-auth-uids', async (req, res) => {
  try {
    console.log('🔄 Starting UID synchronization...')
    
    if (!adminAuth) {
      return res.status(500).json({
        ok: false,
        error: 'Firebase Admin SDK not initialized'
      })
    }
    
    // Get all users from Firebase Authentication
    const listUsersResult = await adminAuth.listUsers()
    const authUsers = listUsersResult.users
    
    console.log(`Found ${authUsers.length} users in Authentication`)
    
    // Get all users from Firestore
    const firestoreSnapshot = await getDocs(collection(db, 'users'))
    const firestoreUsers = {}
    firestoreSnapshot.forEach(doc => {
      const data = doc.data()
      firestoreUsers[data.email] = { docId: doc.id, data }
    })
    
    console.log(`Found ${firestoreSnapshot.size} users in Firestore`)
    
    const updates = []
    const errors = []
    
    // Match and update
    for (const authUser of authUsers) {
      const email = authUser.email
      const authUid = authUser.uid
      
      if (firestoreUsers[email]) {
        const fsUser = firestoreUsers[email]
        const needsUpdate = fsUser.data.id !== authUid || fsUser.data.uid !== authUid
        
        if (needsUpdate) {
          try {
            await updateDoc(doc(db, 'users', fsUser.docId), {
              id: authUid,
              uid: authUid
            })
            console.log(`✅ Updated ${email}: id & uid = ${authUid}`)
            updates.push({ email, authUid, docId: fsUser.docId })
          } catch (err) {
            console.error(`❌ Failed to update ${email}:`, err.message)
            errors.push({ email, error: err.message })
          }
        } else {
          console.log(`✓ ${email} already correct`)
        }
      } else {
        console.warn(`⚠️ ${email} exists in Auth but not in Firestore`)
        errors.push({ email, error: 'Not found in Firestore' })
      }
    }
    
    res.json({
      ok: true,
      message: `Synchronized ${updates.length} users`,
      details: {
        authUsers: authUsers.length,
        firestoreUsers: firestoreSnapshot.size,
        updated: updates.length,
        errors: errors.length,
        updates,
        errors
      }
    })
  } catch (err) {
    console.error('❌ Sync error:', err)
    res.status(500).json({
      ok: false,
      error: err.message
    })
  }
})

// Delete user endpoint - deletes from both Firebase Authentication and Firestore
app.delete('/api/admin/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    if (!userId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing user ID' 
      })
    }
    
    console.log('🗑️ Deleting user:', userId)
    
    let authDeleted = false
    let firestoreDeleted = false
    const warnings = []
    
    // Step 1: Delete from Firebase Authentication
    if (adminAuth) {
      try {
        await adminAuth.deleteUser(userId)
        authDeleted = true
        console.log('✅ User deleted from Firebase Authentication:', userId)
      } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
          warnings.push('User not found in Firebase Authentication')
          console.warn('⚠️ User not in Authentication:', userId)
        } else {
          console.error('❌ Failed to delete from Authentication:', authError.message)
          warnings.push(`Authentication deletion failed: ${authError.message}`)
        }
      }
    } else {
      warnings.push('Firebase Admin SDK not initialized - cannot delete from Authentication')
      console.warn('⚠️ Cannot delete from Authentication - Admin SDK not initialized')
    }
    
    // Step 2: Delete from Firestore
    try {
      // Try to delete by document ID first
      const docRef = doc(db, 'users', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        await deleteDoc(docRef)
        firestoreDeleted = true
        console.log('✅ User deleted from Firestore (by doc ID):', userId)
      } else {
        // Try to find by UID field
        console.log('🔍 Document not found by ID, searching by UID field...')
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('uid', '==', userId))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]
          await deleteDoc(userDoc.ref)
          firestoreDeleted = true
          console.log('✅ User deleted from Firestore (by UID lookup):', userId)
        } else {
          warnings.push('User document not found in Firestore')
          console.warn('⚠️ User not found in Firestore:', userId)
        }
      }
    } catch (firestoreError) {
      console.error('❌ Failed to delete from Firestore:', firestoreError.message)
      warnings.push(`Firestore deletion failed: ${firestoreError.message}`)
    }
    
    // Determine response
    if (authDeleted || firestoreDeleted) {
      const message = []
      if (authDeleted) message.push('Firebase Authentication')
      if (firestoreDeleted) message.push('Firestore database')
      
      return res.json({ 
        ok: true, 
        message: `User deleted from: ${message.join(' and ')}`,
        details: {
          authDeleted,
          firestoreDeleted,
          warnings: warnings.length > 0 ? warnings : undefined
        }
      })
    } else {
      return res.status(404).json({ 
        ok: false, 
        error: 'User not found in either Firebase Authentication or Firestore',
        warnings
      })
    }
  } catch (err) {
    console.error('❌ Delete user error:', err)
    res.status(500).json({ 
      ok: false, 
      error: `Failed to delete user: ${err.message}` 
    })
  }
})

const PORT = process.env.PORT || 5175
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})


