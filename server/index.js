import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { OAuth2Client } from 'google-auth-library'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Load environment variables
dotenv.config()

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
const client = new OAuth2Client(GOOGLE_CLIENT_ID)

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

const PORT = process.env.PORT || 5175
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})


