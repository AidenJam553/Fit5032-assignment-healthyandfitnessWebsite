// Debug email delivery issues
import sgMail from '@sendgrid/mail'
import dotenv from 'dotenv'

dotenv.config()

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL

sgMail.setApiKey(SENDGRID_API_KEY)

// Send a test email with detailed tracking
const msg = {
  to: 'aidenjam533@gmail.com',
  from: {
    email: SENDGRID_FROM_EMAIL,
    name: 'FIT5032 Health System'  // Add a friendly name
  },
  subject: '🔍 Delivery Test - FIT5032 System',
  text: `
Hello,

This is a delivery test email from the FIT5032 Health & Fitness system.

If you receive this email, please reply with "Received" to confirm delivery.

Technical details:
- Sent from: ${SENDGRID_FROM_EMAIL}
- System: FIT5032 Assignment
- Purpose: Testing email delivery

Best regards,
FIT5032 Team
  `,
  html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #15803d;">🔍 Delivery Test - FIT5032 System</h2>
  
  <p>Hello,</p>
  
  <p>This is a delivery test email from the FIT5032 Health & Fitness system.</p>
  
  <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0;">
    <p><strong>If you receive this email, please reply with "Received" to confirm delivery.</strong></p>
  </div>
  
  <h3>Technical Details:</h3>
  <ul>
    <li><strong>Sent from:</strong> ${SENDGRID_FROM_EMAIL}</li>
    <li><strong>System:</strong> FIT5032 Assignment</li>
    <li><strong>Purpose:</strong> Testing email delivery</li>
  </ul>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
  
  <p style="color: #6b7280; font-size: 14px;">
    Best regards,<br>
    FIT5032 Team
  </p>
</div>
  `,
  // Add tracking settings
  trackingSettings: {
    clickTracking: {
      enable: true,
      enableText: false
    },
    openTracking: {
      enable: true
    }
  },
  // Add categories for tracking
  categories: ['fit5032-test', 'delivery-test']
}

console.log('=== Sending Detailed Test Email ===')
console.log('To:', msg.to)
console.log('From:', msg.from.email, `(${msg.from.name})`)
console.log('Subject:', msg.subject)
console.log('')

try {
  const result = await sgMail.send(msg)
  console.log('✅ Email sent successfully!')
  console.log('Status Code:', result[0].statusCode)
  console.log('Message ID:', result[0].headers['x-message-id'])
  console.log('Response Headers:', result[0].headers)
  console.log('')
  
  console.log('📊 Monitoring Instructions:')
  console.log('1. Check SendGrid Activity Dashboard:')
  console.log('   https://app.sendgrid.com/activity')
  console.log('2. Search for Message ID:', result[0].headers['x-message-id'])
  console.log('3. Check email status (delivered, bounced, etc.)')
  console.log('')
  
  console.log('📧 Email Delivery Checklist:')
  console.log('□ Check aidenjam533@gmail.com inbox')
  console.log('□ Check spam/promotions folder')
  console.log('□ Check Gmail filters')
  console.log('□ Wait 5-10 minutes for delivery')
  console.log('□ Check SendGrid activity for bounce/delivery status')
  
} catch (error) {
  console.error('❌ Failed to send email')
  console.error('Error:', error.message)
  
  if (error.response) {
    console.error('Response:', JSON.stringify(error.response.body, null, 2))
  }
}
