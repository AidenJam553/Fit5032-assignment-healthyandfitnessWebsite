// Test SendGrid configuration
import sgMail from '@sendgrid/mail'
import dotenv from 'dotenv'

dotenv.config()

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL

console.log('=== SendGrid Configuration Test ===')
console.log('API Key:', SENDGRID_API_KEY ? `${SENDGRID_API_KEY.substring(0, 20)}...` : 'NOT SET')
console.log('From Email:', SENDGRID_FROM_EMAIL || 'NOT SET')
console.log('')

if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
  console.error('❌ ERROR: SendGrid is not configured properly')
  console.error('Please set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in .env file')
  process.exit(1)
}

// Initialize SendGrid
sgMail.setApiKey(SENDGRID_API_KEY)

// Test email
const msg = {
  to: 'aidenjam533@gmail.com', // Test recipient
  from: SENDGRID_FROM_EMAIL,
  subject: 'Test Email from FIT5032 Health & Fitness System',
  text: 'Hello! This is a test email from the FIT5032 Health & Fitness website admin system. If you received this, the email system is working correctly!',
  html: '<h2>Hello!</h2><p>This is a <strong>test email</strong> from the FIT5032 Health & Fitness website admin system.</p><p>If you received this, the email system is working correctly! ✅</p>',
}

console.log('Attempting to send test email...')
console.log('To:', msg.to)
console.log('From:', msg.from)
console.log('')

try {
  const result = await sgMail.send(msg)
  console.log('✅ SUCCESS! Email sent successfully')
  console.log('Response status:', result[0].statusCode)
  console.log('Response headers:', result[0].headers)
  console.log('')
  console.log('Check your inbox:', SENDGRID_FROM_EMAIL)
  console.log('Also check spam folder if you don\'t see it.')
} catch (error) {
  console.error('❌ FAILED to send email')
  console.error('')
  console.error('Error message:', error.message)
  
  if (error.response) {
    console.error('Error code:', error.code)
    console.error('Error response:', JSON.stringify(error.response.body, null, 2))
    console.error('')
    
    // Common error explanations
    if (error.code === 401 || error.code === 403) {
      console.error('💡 POSSIBLE CAUSES:')
      console.error('   - API Key is invalid or expired')
      console.error('   - API Key doesn\'t have Mail Send permissions')
      console.error('   - Create a new API Key with Full Access at:')
      console.error('     https://app.sendgrid.com/settings/api_keys')
    } else if (error.response.body?.errors?.[0]?.message?.includes('not verified')) {
      console.error('💡 POSSIBLE CAUSES:')
      console.error('   - Sender email is not verified in SendGrid')
      console.error('   - Verify your sender email at:')
      console.error('     https://app.sendgrid.com/settings/sender_auth')
    }
  }
  
  process.exit(1)
}

