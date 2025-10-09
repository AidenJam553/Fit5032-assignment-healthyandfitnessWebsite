// Check SendGrid account and sender verification status
import sgMail from '@sendgrid/mail'
import dotenv from 'dotenv'

dotenv.config()

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL

console.log('=== SendGrid Account Status Check ===')
console.log('API Key:', SENDGRID_API_KEY ? `${SENDGRID_API_KEY.substring(0, 20)}...` : 'NOT SET')
console.log('From Email:', SENDGRID_FROM_EMAIL || 'NOT SET')
console.log('')

if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
  console.error('❌ ERROR: SendGrid is not configured properly')
  process.exit(1)
}

sgMail.setApiKey(SENDGRID_API_KEY)

// Test with a simple email first
const testMsg = {
  to: SENDGRID_FROM_EMAIL, // Send to yourself first
  from: SENDGRID_FROM_EMAIL,
  subject: 'SendGrid Self-Test',
  text: 'Testing if sender email is properly verified.',
  html: '<p>Testing if sender email is properly verified.</p>',
}

console.log('Step 1: Testing self-email (should work if sender is verified)')
console.log('To:', testMsg.to)
console.log('From:', testMsg.from)
console.log('')

try {
  const result = await sgMail.send(testMsg)
  console.log('✅ Self-email sent successfully')
  console.log('Status:', result[0].statusCode)
  console.log('Message ID:', result[0].headers['x-message-id'])
  console.log('')
  
  // Now test with external email
  console.log('Step 2: Testing external email to aidenjam533@gmail.com')
  const externalMsg = {
    to: 'aidenjam533@gmail.com',
    from: SENDGRID_FROM_EMAIL,
    subject: 'SendGrid External Test - Please Reply',
    text: 'This is a test email to verify external delivery. Please reply to confirm receipt.',
    html: '<p>This is a test email to verify external delivery. <strong>Please reply to confirm receipt.</strong></p>',
  }
  
  const externalResult = await sgMail.send(externalMsg)
  console.log('✅ External email sent successfully')
  console.log('Status:', externalResult[0].statusCode)
  console.log('Message ID:', externalResult[0].headers['x-message-id'])
  console.log('')
  
  console.log('📧 Next steps:')
  console.log('1. Check your inbox:', SENDGRID_FROM_EMAIL)
  console.log('2. Check aidenjam533@gmail.com inbox')
  console.log('3. Check spam folders in both accounts')
  console.log('4. Wait 5-10 minutes and check SendGrid Activity dashboard')
  
} catch (error) {
  console.error('❌ Email sending failed')
  console.error('')
  console.error('Error:', error.message)
  
  if (error.response) {
    console.error('Status:', error.code)
    console.error('Response:', JSON.stringify(error.response.body, null, 2))
    
    // Check for specific errors
    const errorBody = error.response.body
    if (errorBody && errorBody.errors) {
      errorBody.errors.forEach(err => {
        console.error('')
        console.error('🔍 Error Analysis:')
        console.error('Message:', err.message)
        
        if (err.message.includes('not verified') || err.message.includes('sender')) {
          console.error('💡 SOLUTION: Verify your sender email in SendGrid')
          console.error('   Go to: https://app.sendgrid.com/settings/sender_auth')
          console.error('   Click "Single Sender Verification"')
          console.error('   Add and verify:', SENDGRID_FROM_EMAIL)
        }
        
        if (err.message.includes('domain') || err.message.includes('authentication')) {
          console.error('💡 SOLUTION: Consider domain authentication for production')
          console.error('   Go to: https://app.sendgrid.com/settings/sender_auth')
          console.error('   Click "Domain Authentication"')
        }
        
        if (err.message.includes('quota') || err.message.includes('limit')) {
          console.error('💡 SOLUTION: Check your SendGrid account limits')
          console.error('   Free tier: 100 emails/day')
          console.error('   Check usage at: https://app.sendgrid.com/statistics')
        }
      })
    }
  }
  
  process.exit(1)
}
