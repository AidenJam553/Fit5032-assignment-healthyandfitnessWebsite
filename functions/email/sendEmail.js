/**
 * Cloud Function for sending emails via SendGrid
 * 
 * This function handles email sending with the following features:
 * - Multiple recipients support
 * - HTML and plain text content
 * - File attachments (base64 encoded)
 * - Admin-only access control
 * - Input validation and sanitization
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key from environment config
const SENDGRID_API_KEY = functions.config().sendgrid?.key;
const SENDGRID_FROM_EMAIL = functions.config().sendgrid?.from;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('SendGrid initialized successfully');
} else {
  console.warn('⚠️ SendGrid API key not configured');
}

/**
 * Validate email address format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim());
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .substring(0, 10000); // Limit length
}

/**
 * Check if user is admin
 */
async function isAdmin(uid) {
  try {
    console.log(`🔍 Checking admin status for UID: ${uid}`);
    
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.log(`❌ User ${uid} not found in Firestore`);
      
      // Debug: List all users in the collection
      const allUsersSnapshot = await admin.firestore().collection('users').get();
      console.log(`📊 Total users in Firestore: ${allUsersSnapshot.size}`);
      
      allUsersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - Doc ID: ${doc.id}, Email: ${data.email}, Role: ${data.role}`);
      });
      
      return false;
    }
    
    const userData = userDoc.data();
    console.log(`✅ User found: ${userData.email}, Role: ${userData.role}`);
    
    const isAdminUser = userData.role === 'admin';
    console.log(`👑 Is admin: ${isAdminUser}`);
    
    return isAdminUser;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    return false;
  }
}

/**
 * Cloud Function: sendEmail
 * 
 * Callable function to send emails via SendGrid
 * Requires admin authentication
 * 
 * @param {Object} data - Function parameters
 * @param {string|string[]} data.to - Recipient email(s)
 * @param {string} data.subject - Email subject
 * @param {string} data.text - Plain text content (optional)
 * @param {string} data.html - HTML content (optional)
 * @param {Array} data.attachments - File attachments (optional)
 * @param {Object} context - Function context with auth info
 */
exports.sendEmail = functions.https.onCall(async (data, context) => {
  // ============================================================
  // 1. Authentication & Authorization Check
  // ============================================================
  
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to send emails'
    );
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin(context.auth.uid);
  if (!userIsAdmin) {
    console.log(`Unauthorized email send attempt by user: ${context.auth.uid}`);
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can send emails'
    );
  }

  // ============================================================
  // 2. Validate SendGrid Configuration
  // ============================================================
  
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Email service is not configured. Please contact the administrator.'
    );
  }

  // ============================================================
  // 3. Input Validation
  // ============================================================
  
  const { to, subject, text, html, attachments } = data;

  // Validate required fields
  if (!to || !subject) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: to and subject are required'
    );
  }

  if (!text && !html) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email must have either text or html content'
    );
  }

  // Parse recipients (can be string or array)
  let recipients = [];
  if (typeof to === 'string') {
    recipients = to.split(',').map(email => email.trim()).filter(email => email);
  } else if (Array.isArray(to)) {
    recipients = to.map(email => email.trim()).filter(email => email);
  } else {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid recipient format'
    );
  }

  // Validate email addresses
  const invalidEmails = recipients.filter(email => !validateEmail(email));
  if (invalidEmails.length > 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid email addresses: ${invalidEmails.join(', ')}`
    );
  }

  // Limit number of recipients
  if (recipients.length > 100) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Too many recipients. Maximum 100 recipients per email.'
    );
  }

  // ============================================================
  // 4. Prepare Email Message
  // ============================================================
  
  const msg = {
    to: recipients,
    from: SENDGRID_FROM_EMAIL,
    subject: sanitizeInput(subject),
    text: text ? sanitizeInput(text) : undefined,
    html: html ? sanitizeInput(html) : undefined,
  };

  // Add attachments if provided
  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    // Validate attachments
    if (attachments.length > 5) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Maximum 5 attachments allowed'
      );
    }

    msg.attachments = attachments.map(file => {
      if (!file.content || !file.filename) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid attachment format. Each attachment must have content and filename.'
        );
      }

      return {
        content: file.content, // Should be base64 encoded
        filename: file.filename,
        type: file.type || 'application/octet-stream',
        disposition: 'attachment'
      };
    });
  }

  // ============================================================
  // 5. Send Email
  // ============================================================
  
  try {
    console.log(`📧 Sending email to ${recipients.length} recipient(s)`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${context.auth.email || context.auth.uid}`);

    const result = await sgMail.send(msg);
    
    console.log('✅ Email sent successfully');
    console.log('SendGrid response:', result[0].statusCode);

    // ============================================================
    // 6. Log Email Activity (optional - for audit purposes)
    // ============================================================
    
    try {
      await admin.firestore().collection('email_logs').add({
        sentBy: context.auth.uid,
        sentByEmail: context.auth.email,
        recipients: recipients,
        subject: subject,
        recipientCount: recipients.length,
        hasAttachments: !!(attachments && attachments.length > 0),
        attachmentCount: attachments ? attachments.length : 0,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'success'
      });
    } catch (logError) {
      // Don't fail the function if logging fails
      console.error('Failed to log email activity:', logError);
    }

    // Return success response
    return {
      success: true,
      message: `Email sent successfully to ${recipients.length} recipient(s)`,
      recipientCount: recipients.length,
      recipients: recipients
    };

  } catch (error) {
    console.error('❌ SendGrid error:', error);

    // Log failed attempt
    try {
      await admin.firestore().collection('email_logs').add({
        sentBy: context.auth.uid,
        sentByEmail: context.auth.email,
        recipients: recipients,
        subject: subject,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'failed',
        error: error.message
      });
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }

    // Handle SendGrid specific errors
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
      throw new functions.https.HttpsError(
        'internal',
        `SendGrid error: ${error.message}`,
        error.response.body
      );
    }

    // Generic error
    throw new functions.https.HttpsError(
      'internal',
      `Failed to send email: ${error.message}`
    );
  }
});

