import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { OAuth2Client } from 'google-auth-library'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()
app.use(cors())
app.use(bodyParser.json({ limit: '1mb' }))

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const client = new OAuth2Client(GOOGLE_CLIENT_ID)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body || {}
    if (!credential) return res.status(400).json({ ok: false, error: 'Missing credential' })
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ ok: false, error: 'Missing GOOGLE_CLIENT_ID' })

    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID })
    const payload = ticket.getPayload()
    if (!payload) return res.status(401).json({ ok: false, error: 'Invalid token' })

    const { email, name, sub } = payload
    return res.json({ ok: true, profile: { email, name, sub } })
  } catch (err) {
    console.error('Google auth error', err)
    res.status(401).json({ ok: false, error: 'Unauthorized' })
  }
})

const PORT = process.env.PORT || 5175
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})


