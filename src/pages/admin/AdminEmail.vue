<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminHeader from '@/components/AdminHeader.vue'
import Button from '@/components/Button.vue'
import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '@/lib/firebase'

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5175/api'
const functions = getFunctions(app)

// Form state
const recipients = ref('')
const subject = ref('')
const emailContent = ref('')
const useHtml = ref(false)
const attachments = ref([])
const fileInput = ref(null)

// UI state
const users = ref([])
const loading = ref(false)
const sending = ref(false)
const message = ref('')
const messageType = ref('') // 'success' or 'error'
const selectedUsers = ref([])

// Enhanced bulk email features
const searchQuery = ref('')
const filterRole = ref('')
const filterProvider = ref('')
const showEmailPreview = ref(false)
const emailTemplates = ref([
  {
    id: 'welcome',
    name: 'Welcome New Users',
    subject: 'Welcome to Healthy & Fitness Platform!',
    content: 'Dear {{username}},\n\nWelcome to our Healthy & Fitness platform! We\'re excited to have you join our community.\n\nBest regards,\nThe Healthy & Fitness Team'
  },
  {
    id: 'announcement',
    name: 'General Announcement',
    subject: 'Important Announcement',
    content: 'Dear {{username}},\n\nWe have an important announcement to share with you.\n\n{{announcement_content}}\n\nThank you for your attention.\n\nBest regards,\nThe Healthy & Fitness Team'
  },
  {
    id: 'maintenance',
    name: 'System Maintenance',
    subject: 'Scheduled System Maintenance',
    content: 'Dear {{username}},\n\nWe will be performing scheduled system maintenance on {{maintenance_date}} from {{maintenance_time}}.\n\nDuring this time, the platform may be temporarily unavailable. We apologize for any inconvenience.\n\nBest regards,\nThe Healthy & Fitness Team'
  },
  {
    id: 'newsletter',
    name: 'Monthly Newsletter',
    subject: 'Monthly Health & Fitness Newsletter',
    content: 'Dear {{username}},\n\nHere\'s your monthly health and fitness newsletter with the latest updates, tips, and features.\n\n{{newsletter_content}}\n\nStay healthy and active!\n\nBest regards,\nThe Healthy & Fitness Team'
  }
])
const selectedTemplate = ref('')
const customTemplate = ref(false)

// Email scheduling
const scheduleEmail = ref(false)
const scheduledDate = ref('')
const scheduledTime = ref('')
const scheduledEmails = ref([])

// Email analytics
const emailStats = ref({
  totalSent: 0,
  totalScheduled: 0,
  totalFailed: 0,
  lastSent: null
})

const emailHistory = ref([])

// Computed properties for filtering
const filteredUsers = computed(() => {
  let result = [...users.value]
  
  // Filter by provider
  if (filterProvider.value) {
    result = result.filter(user => user.provider === filterProvider.value)
  }
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user => 
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  }
  
  return result
})

const totalUsers = computed(() => users.value.length)
const filteredUsersCount = computed(() => filteredUsers.value.length)
const selectedUsersCount = computed(() => selectedUsers.value.length)


// Load users for recipient selection
async function loadUsers() {
  loading.value = true
  try {
    const response = await fetch(`${API_URL}/admin/users`)
    const data = await response.json()
    
    if (data.ok) {
      users.value = data.users.filter(u => u.role !== 'admin') // Exclude admin
    } else {
      showMessage('Failed to load users: ' + data.error, 'error')
    }
  } catch (err) {
    showMessage('Error loading users: ' + err.message, 'error')
  } finally {
    loading.value = false
  }
}

// Handle file selection
function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  
  // Check file size (5MB limit per file)
  const maxSize = 5 * 1024 * 1024
  const invalidFiles = files.filter(f => f.size > maxSize)
  
  if (invalidFiles.length > 0) {
    showMessage(`Some files exceed 5MB limit: ${invalidFiles.map(f => f.name).join(', ')}`, 'error')
    return
  }
  
  attachments.value = files
}

// Remove attachment
function removeAttachment(index) {
  attachments.value.splice(index, 1)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Toggle user selection
function toggleUser(user) {
  const index = selectedUsers.value.findIndex(u => u.id === user.id)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(user)
  }
  updateRecipientsField()
}

// Select all users
function selectAllUsers() {
  selectedUsers.value = [...users.value.filter(u => u.role !== 'admin')]
  updateRecipientsField()
}

// Select all filtered users
function selectAllFilteredUsers() {
  const filteredNonAdminUsers = filteredUsers.value.filter(u => u.role !== 'admin')
  selectedUsers.value = [...filteredNonAdminUsers]
  updateRecipientsField()
}


// Clear all selections
function clearSelection() {
  selectedUsers.value = []
  updateRecipientsField()
}

// Update recipients field based on selected users
function updateRecipientsField() {
  recipients.value = selectedUsers.value.map(u => u.email).join(', ')
}

// Template handling functions
function loadTemplate(templateId) {
  const template = emailTemplates.value.find(t => t.id === templateId)
  if (template) {
    subject.value = template.subject
    emailContent.value = template.content
    selectedTemplate.value = templateId
    customTemplate.value = false
  }
}

function useCustomTemplate() {
  selectedTemplate.value = ''
  customTemplate.value = true
  subject.value = ''
  emailContent.value = ''
}

function personalizeContent(content, user) {
  return content
    .replace(/\{\{username\}\}/g, user.username || user.email)
    .replace(/\{\{email\}\}/g, user.email)
    .replace(/\{\{announcement_content\}\}/g, '[Your announcement content here]')
    .replace(/\{\{maintenance_date\}\}/g, '[Date]')
    .replace(/\{\{maintenance_time\}\}/g, '[Time]')
    .replace(/\{\{newsletter_content\}\}/g, '[Your newsletter content here]')
}

// Clear filters
function clearFilters() {
  searchQuery.value = ''
  filterProvider.value = ''
}

// Email scheduling functions
function initializeScheduling() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  scheduledDate.value = tomorrow.toISOString().split('T')[0]
  scheduledTime.value = '09:00'
}

function toggleScheduling() {
  scheduleEmail.value = !scheduleEmail.value
  if (scheduleEmail.value && !scheduledDate.value) {
    initializeScheduling()
  }
}

async function scheduleBulkEmail() {
  if (!scheduledDate.value || !scheduledTime.value) {
    showMessage('Please select a date and time for scheduling', 'error')
    return
  }
  
  const scheduledDateTime = new Date(`${scheduledDate.value}T${scheduledTime.value}`)
  const now = new Date()
  
  if (scheduledDateTime <= now) {
    showMessage('Scheduled time must be in the future', 'error')
    return
  }
  
  try {
    // Store scheduled email in Firestore
    const scheduledEmailData = {
      recipients: selectedUsers.value.map(u => u.email),
      subject: subject.value,
      content: emailContent.value,
      useHtml: useHtml.value,
      attachments: attachments.value.length > 0 ? await Promise.all(
        attachments.value.map(async (file) => ({
          content: await fileToBase64(file),
          filename: file.name,
          type: file.type
        }))
      ) : [],
      scheduledFor: scheduledDateTime,
      createdBy: 'admin', // You can get this from auth context
      createdAt: new Date(),
      status: 'scheduled',
      templateId: selectedTemplate.value
    }
    
    // Here you would save to Firestore or call a Cloud Function
    // For now, we'll store locally and show success message
    scheduledEmails.value.push({
      id: Date.now().toString(),
      ...scheduledEmailData
    })
    
    showMessage(`Email scheduled for ${scheduledDateTime.toLocaleString()}`, 'success')
    addToEmailHistory({
      subject: subject.value,
      recipients: selectedUsers.value.map(u => u.email),
      templateId: selectedTemplate.value,
      scheduled: true
    }, 'scheduled')
    resetForm()
  } catch (err) {
    console.error('Error scheduling email:', err)
    showMessage('Error scheduling email: ' + err.message, 'error')
  }
}

// Show message
function showMessage(msg, type) {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
    messageType.value = ''
  }, 5000)
}

// Convert file to base64
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = error => reject(error)
  })
}

// Send email using Cloud Function
async function sendEmail() {
  if (!recipients.value.trim() || !subject.value.trim() || !emailContent.value.trim()) {
    showMessage('Please fill in all required fields', 'error')
    return
  }
  
  if (selectedUsers.value.length === 0) {
    showMessage('Please select at least one recipient', 'error')
    return
  }
  
  sending.value = true
  
  try {
    // Check if email should be scheduled
    if (scheduleEmail.value) {
      await scheduleBulkEmail()
    } else {
      // For bulk emails with personalization, send individual emails
      if (selectedTemplate.value && selectedUsers.value.length > 1) {
        await sendBulkPersonalizedEmails()
      } else {
        // Send single email to all recipients
        await sendSingleBulkEmail()
      }
    }
  } catch (err) {
    console.error('Send email error:', err)
    showMessage('Error sending email: ' + (err.message || 'Unknown error'), 'error')
  } finally {
    sending.value = false
  }
}

// Send single bulk email (same content to all)
async function sendSingleBulkEmail() {
  const emailData = {
    to: recipients.value,
    subject: subject.value,
  }
  
  // Add content (text or html)
  if (useHtml.value) {
    emailData.html = emailContent.value
  } else {
    emailData.text = emailContent.value
  }
  
  // Process attachments if any
  if (attachments.value.length > 0) {
    emailData.attachments = await Promise.all(
      attachments.value.map(async (file) => ({
        content: await fileToBase64(file),
        filename: file.name,
        type: file.type
      }))
    )
  }
  
  // Call Cloud Function
  const sendEmailFunction = httpsCallable(functions, 'sendEmail')
  const result = await sendEmailFunction(emailData)
  
  if (result.data.success) {
    showMessage(result.data.message || 'Email sent successfully!', 'success')
    addToEmailHistory({
      subject: subject.value,
      recipients: recipients.value.split(',').map(email => email.trim()),
      templateId: selectedTemplate.value
    }, 'sent')
    resetForm()
  } else {
    showMessage('Failed to send email', 'error')
    addToEmailHistory({
      subject: subject.value,
      recipients: recipients.value.split(',').map(email => email.trim()),
      templateId: selectedTemplate.value
    }, 'failed')
  }
}

// Send personalized bulk emails (individual emails with personalization)
async function sendBulkPersonalizedEmails() {
  const sendEmailFunction = httpsCallable(functions, 'sendEmail')
  let successCount = 0
  let errorCount = 0
  
  for (const user of selectedUsers.value) {
    try {
      const personalizedContent = personalizeContent(emailContent.value, user)
      const personalizedSubject = subject.value.replace(/\{\{username\}\}/g, user.username || user.email)
      
      const emailData = {
        to: user.email,
        subject: personalizedSubject,
      }
      
      // Add content (text or html)
      if (useHtml.value) {
        emailData.html = personalizedContent
      } else {
        emailData.text = personalizedContent
      }
      
      // Process attachments if any
      if (attachments.value.length > 0) {
        emailData.attachments = await Promise.all(
          attachments.value.map(async (file) => ({
            content: await fileToBase64(file),
            filename: file.name,
            type: file.type
          }))
        )
      }
      
      const result = await sendEmailFunction(emailData)
      if (result.data.success) {
        successCount++
      } else {
        errorCount++
      }
    } catch (err) {
      console.error(`Error sending email to ${user.email}:`, err)
      errorCount++
    }
  }
  
  if (errorCount === 0) {
    showMessage(`Successfully sent ${successCount} personalized emails!`, 'success')
    addToEmailHistory({
      subject: subject.value,
      recipients: selectedUsers.value.map(u => u.email),
      templateId: selectedTemplate.value
    }, 'sent')
    resetForm()
  } else {
    showMessage(`Sent ${successCount} emails successfully, ${errorCount} failed`, 'error')
    addToEmailHistory({
      subject: subject.value,
      recipients: selectedUsers.value.map(u => u.email),
      templateId: selectedTemplate.value
    }, 'failed')
  }
}

// Reset form after successful send
function resetForm() {
  recipients.value = ''
  subject.value = ''
  emailContent.value = ''
  attachments.value = []
  selectedUsers.value = []
  selectedTemplate.value = ''
  customTemplate.value = false
  scheduleEmail.value = false
  scheduledDate.value = ''
  scheduledTime.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function cancelScheduledEmail(emailId) {
  if (confirm('Are you sure you want to cancel this scheduled email?')) {
    scheduledEmails.value = scheduledEmails.value.filter(email => email.id !== emailId)
    updateEmailStats()
    showMessage('Scheduled email cancelled', 'success')
  }
}

// Email analytics functions
function updateEmailStats() {
  emailStats.value.totalScheduled = scheduledEmails.value.length
  emailStats.value.lastSent = emailHistory.value.length > 0 ? emailHistory.value[0].timestamp : null
}

function addToEmailHistory(emailData, status = 'sent') {
  const historyEntry = {
    id: Date.now().toString(),
    timestamp: new Date(),
    subject: emailData.subject,
    recipientCount: emailData.recipients ? emailData.recipients.length : 0,
    templateId: emailData.templateId,
    status: status,
    scheduled: emailData.scheduled || false
  }
  
  emailHistory.value.unshift(historyEntry)
  
  // Keep only last 50 entries
  if (emailHistory.value.length > 50) {
    emailHistory.value = emailHistory.value.slice(0, 50)
  }
  
  if (status === 'sent') {
    emailStats.value.totalSent++
  } else if (status === 'failed') {
    emailStats.value.totalFailed++
  }
  
  updateEmailStats()
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="admin">
    <AdminHeader />

    <main class="container admin__content">
      <h1 class="page-title">Email Centre</h1>
      
      <!-- Message alert -->
      <div v-if="message" :class="['alert', `alert-${messageType}`]">
        {{ message }}
      </div>
      
      <!-- Email Analytics -->
      <div class="email-analytics">
        <div class="analytics-cards">
          <div class="analytics-card">
            <div class="analytics-icon">📧</div>
            <div class="analytics-content">
              <div class="analytics-number">{{ emailStats.totalSent }}</div>
              <div class="analytics-label">Emails Sent</div>
            </div>
          </div>
          <div class="analytics-card">
            <div class="analytics-icon">⏰</div>
            <div class="analytics-content">
              <div class="analytics-number">{{ emailStats.totalScheduled }}</div>
              <div class="analytics-label">Scheduled</div>
            </div>
          </div>
          <div class="analytics-card">
            <div class="analytics-icon">❌</div>
            <div class="analytics-content">
              <div class="analytics-number">{{ emailStats.totalFailed }}</div>
              <div class="analytics-label">Failed</div>
            </div>
          </div>
        </div>
        
        <!-- Recent Email History -->
        <div v-if="emailHistory.length > 0" class="email-history">
          <h3>Recent Email Activity</h3>
          <div class="history-list">
            <div
              v-for="email in emailHistory.slice(0, 5)"
              :key="email.id"
              class="history-item"
            >
              <div class="history-info">
                <div class="history-subject">{{ email.subject }}</div>
                <div class="history-details">
                  <span class="history-recipients">{{ email.recipientCount }} recipients</span>
                  <span class="history-time">{{ new Date(email.timestamp).toLocaleString() }}</span>
                  <span v-if="email.templateId" class="history-template">{{ email.templateId }}</span>
                </div>
              </div>
              <div class="history-status">
                <span :class="['status-badge', email.status]">
                  {{ email.status === 'sent' ? '✓ Sent' : 
                     email.status === 'scheduled' ? '⏰ Scheduled' : 
                     email.status === 'failed' ? '❌ Failed' : email.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="email-container">
        <!-- User Selection Panel -->
        <div class="users-panel card">
          <div class="panel-header">
            <h2>Select Recipients</h2>
            <div class="panel-actions">
              <button @click="selectAllUsers" class="btn-link">Select All</button>
              <button @click="selectAllFilteredUsers" class="btn-link">Select Filtered</button>
            </div>
          </div>
          
          <!-- User Statistics -->
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-label">Total Users:</span>
              <span class="stat-value">{{ totalUsers }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Filtered:</span>
              <span class="stat-value">{{ filteredUsersCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Selected:</span>
              <span class="stat-value">{{ selectedUsersCount }}</span>
            </div>
          </div>
          
          <!-- Search and Filters -->
          <div class="filters-section">
            <div class="filter-group">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search users..."
                class="filter-input"
              />
            </div>
            <div class="filter-group">
              <select v-model="filterProvider" class="filter-select">
                <option value="">All Providers</option>
                <option value="local">Local</option>
                <option value="google">Google</option>
              </select>
            </div>
            <button @click="clearFilters" class="clear-filters-btn">Clear Filters</button>
          </div>
          
          
          <div v-if="loading" class="loading">Loading users...</div>
          
          <div v-else class="users-list">
            <div
              v-for="user in filteredUsers"
              :key="user.id"
              :class="['user-item', { selected: selectedUsers.some(u => u.id === user.id) }]"
              @click="toggleUser(user)"
            >
              <div class="user-info">
                <div class="user-avatar">{{ user.username?.[0]?.toUpperCase() || 'U' }}</div>
                <div class="user-details">
                  <div class="user-name">{{ user.username }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </div>
              </div>
              <div v-if="selectedUsers.some(u => u.id === user.id)" class="checkmark">✓</div>
            </div>
            
            <div v-if="filteredUsers.length === 0" class="no-users">
              {{ users.length === 0 ? 'No users available' : 'No users match your filters' }}
            </div>
          </div>
          
          <div class="selection-summary">
            <strong>{{ selectedUsers.length }}</strong> user(s) selected
            <button 
              v-if="selectedUsers.length > 0"
              @click="clearSelection" 
              class="clear-selection-btn"
            >
              Clear Selection
            </button>
          </div>
        </div>

        <!-- Email Form -->
        <div class="email-form card">
          <h2>Compose Email</h2>
          
          <!-- Email Templates -->
          <div class="form-group">
            <label>Email Template</label>
            <div class="template-section">
              <div class="template-options">
                <button
                  v-for="template in emailTemplates"
                  :key="template.id"
                  @click="loadTemplate(template.id)"
                  :class="['template-btn', { active: selectedTemplate === template.id }]"
                >
                  {{ template.name }}
                </button>
                <button
                  @click="useCustomTemplate"
                  :class="['template-btn', { active: customTemplate }]"
                >
                  Custom Email
                </button>
              </div>
              <div v-if="selectedTemplate" class="template-info">
                <small>Using template: {{ emailTemplates.find(t => t.id === selectedTemplate)?.name }}</small>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="recipients">To: <span class="required">*</span></label>
            <input
              id="recipients"
              v-model="recipients"
              type="text"
              placeholder="Enter email addresses (comma separated)"
              class="form-control"
            />
            <small class="form-text">You can manually enter emails or select users from the left panel</small>
          </div>

          <div class="form-group">
            <label for="subject">Subject: <span class="required">*</span></label>
            <input
              id="subject"
              v-model="subject"
              type="text"
              placeholder="Email subject"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="content">Message: <span class="required">*</span></label>
            <div class="content-type-switch">
              <label>
                <input type="radio" :value="false" v-model="useHtml" /> Plain Text
              </label>
              <label>
                <input type="radio" :value="true" v-model="useHtml" /> HTML
              </label>
            </div>
            <textarea
              id="content"
              v-model="emailContent"
              :placeholder="useHtml ? 'Enter HTML content' : 'Enter plain text content'"
              class="form-control"
              rows="10"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="attachments">Attachments (Optional)</label>
            <input
              ref="fileInput"
              id="attachments"
              type="file"
              multiple
              @change="handleFileSelect"
              class="form-control-file"
            />
            <small class="form-text">Maximum 5 files, 5MB per file</small>
            
            <div v-if="attachments.length > 0" class="attachments-list">
              <div
                v-for="(file, index) in attachments"
                :key="index"
                class="attachment-item"
              >
                <span class="attachment-name">{{ file.name }}</span>
                <span class="attachment-size">({{ (file.size / 1024).toFixed(1) }} KB)</span>
                <button @click="removeAttachment(index)" class="btn-remove">×</button>
              </div>
            </div>
          </div>

          <!-- Email Scheduling -->
          <div class="form-group">
            <label>
              <input
                type="checkbox"
                v-model="scheduleEmail"
                @change="toggleScheduling"
              />
              Schedule Email
            </label>
            <div v-if="scheduleEmail" class="scheduling-section">
              <div class="scheduling-inputs">
                <div class="scheduling-input">
                  <label for="scheduledDate">Date:</label>
                  <input
                    id="scheduledDate"
                    v-model="scheduledDate"
                    type="date"
                    :min="new Date().toISOString().split('T')[0]"
                    class="form-control"
                  />
                </div>
                <div class="scheduling-input">
                  <label for="scheduledTime">Time:</label>
                  <input
                    id="scheduledTime"
                    v-model="scheduledTime"
                    type="time"
                    class="form-control"
                  />
                </div>
              </div>
              <div v-if="scheduledDate && scheduledTime" class="scheduling-preview">
                <small>
                  Email will be sent on {{ new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString() }}
                </small>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <Button
              variant="secondary"
              size="medium"
              @click="showEmailPreview = !showEmailPreview"
            >
              {{ showEmailPreview ? 'Hide Preview' : 'Preview Email' }}
            </Button>
            <Button
              variant="primary"
              size="large"
              @click="sendEmail"
              :disabled="sending || selectedUsers.length === 0"
            >
              {{ sending ? (scheduleEmail ? 'Scheduling...' : 'Sending...') : 
                 (scheduleEmail ? `Schedule for ${selectedUsers.length} Recipient${selectedUsers.length !== 1 ? 's' : ''}` : 
                  `Send to ${selectedUsers.length} Recipient${selectedUsers.length !== 1 ? 's' : ''}`) }}
            </Button>
          </div>
          
          <!-- Email Preview -->
          <div v-if="showEmailPreview" class="email-preview card">
            <h3>Email Preview</h3>
            <div class="preview-content">
              <div class="preview-field">
                <strong>To:</strong> {{ recipients || 'No recipients selected' }}
              </div>
              <div class="preview-field">
                <strong>Subject:</strong> {{ subject || 'No subject' }}
              </div>
              <div class="preview-field">
                <strong>Content:</strong>
                <div class="preview-text" v-if="!useHtml">{{ emailContent || 'No content' }}</div>
                <div class="preview-html" v-else v-html="emailContent || 'No content'"></div>
              </div>
              <div v-if="attachments.length > 0" class="preview-field">
                <strong>Attachments:</strong>
                <ul>
                  <li v-for="file in attachments" :key="file.name">{{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Scheduled Emails Section -->
        <div v-if="scheduledEmails.length > 0" class="scheduled-emails card">
          <h2>Scheduled Emails</h2>
          <div class="scheduled-list">
            <div
              v-for="email in scheduledEmails"
              :key="email.id"
              class="scheduled-item"
            >
              <div class="scheduled-info">
                <div class="scheduled-subject">{{ email.subject }}</div>
                <div class="scheduled-details">
                  <span class="scheduled-recipients">{{ email.recipients.length }} recipients</span>
                  <span class="scheduled-time">{{ new Date(email.scheduledFor).toLocaleString() }}</span>
                </div>
              </div>
              <div class="scheduled-actions">
                <button class="btn-cancel" @click="cancelScheduledEmail(email.id)">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
:root {
  --green-700: #15803d;
  --green-600: #16a34a;
  --green-50: #f0fdf4;
  --border: #e2e8f0;
  --muted: #64748b;
}

/* Ensure all elements use border-box */
* {
  box-sizing: border-box;
}
.container { max-width: 1400px; margin: 0 auto; padding: 0 16px; }

.admin__bar { background: #fff; border-bottom: 1px solid var(--gray-200); position: sticky; top: 0; z-index: 10; backdrop-filter: blur(6px); }
.admin__bar-inner { height: 64px; display: flex; align-items: center; justify-content: space-between; }
.logo { 
  font-weight: 800; 
  color: var(--green-800); 
  text-decoration: none;
  cursor: pointer;
}
.logo:hover { 
  color: var(--green-600); 
  text-decoration: none;
}
.admin__actions { display: flex; align-items: center; gap: 12px; }

.chip { display: inline-flex; align-items: center; gap: 8px; background: var(--green-50); color: var(--green-800); border: 1px solid var(--green-200); padding: 6px 10px; border-radius: 999px; box-shadow: var(--shadow-sm); }
.chip__avatar { width: 22px; height: 22px; border-radius: 50%; background: var(--green-600); color: white; display: grid; place-content: center; font-weight: 700; }

.admin__content { padding: 24px 0 40px; }
.page-title { margin: 0 0 24px 0; color: #15803d; }

/* Alert Messages */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}

.alert-success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.alert-error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

/* Email Analytics */
.email-analytics {
  margin-bottom: 24px;
}

.analytics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.analytics-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.analytics-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0fdf4;
  border-radius: 12px;
}

.analytics-content {
  flex: 1;
}

.analytics-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #15803d;
  margin-bottom: 4px;
}

.analytics-label {
  color: #64748b;
  font-size: 0.875rem;
}

/* Email History */
.email-history {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.email-history h3 {
  margin: 0 0 16px 0;
  color: #15803d;
  font-size: 18px;
  font-weight: 600;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.history-info {
  flex: 1;
}

.history-subject {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.history-details {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #6b7280;
}

.history-recipients {
  font-weight: 500;
}

.history-time {
  color: #9ca3af;
}

.history-template {
  background-color: #e0f2fe;
  color: #0369a1;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.sent {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.scheduled {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.failed {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Email Container */
.email-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
  margin-top: 16px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

@media (max-width: 1024px) {
  .email-container {
    grid-template-columns: 1fr;
  }
}

/* Card */
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.card h2 {
  margin: 0 0 20px 0;
  color: #15803d;
  font-size: 18px;
  font-weight: 600;
}

/* Users Panel */
.users-panel {
  height: fit-content;
  max-height: 800px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-actions {
  display: flex;
  gap: 12px;
}

.btn-link {
  background: none;
  border: none;
  color: #16a34a;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-link:hover {
  background-color: #f0fdf4;
}

/* User Statistics */
.user-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #15803d;
}

/* Filters Section */
.filters-section {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.filter-group {
  margin-bottom: 12px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-input, .filter-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.filter-input:focus, .filter-select:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.clear-filters-btn {
  width: 100%;
  padding: 8px 12px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-filters-btn:hover {
  background-color: #dc2626;
}


.loading {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.users-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 500px;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:hover {
  background-color: #f9fafb;
}

.user-item.selected {
  background-color: #f0fdf4;
  border-left: 3px solid #16a34a;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
}

.user-email {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.checkmark {
  color: #16a34a;
  font-size: 20px;
  font-weight: bold;
}

.no-users {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.selection-summary {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
  color: #4b5563;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-selection-btn {
  padding: 4px 8px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-selection-btn:hover {
  background-color: #dc2626;
}

/* Email Form */
.email-form {
  height: fit-content;
  overflow: hidden;
}

.form-group {
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.required {
  color: #dc2626;
}

.form-control {
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
  font-family: monospace;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.form-text {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.content-type-switch {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.content-type-switch label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: normal;
  cursor: pointer;
}

.content-type-switch input[type="radio"] {
  cursor: pointer;
}

.form-control-file {
  display: block;
  width: 100%;
  max-width: 100%;
  padding: 10px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-control-file:hover {
  border-color: #16a34a;
}

.attachments-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
}

.attachment-name {
  flex: 1;
  color: #374151;
  font-weight: 500;
}

.attachment-size {
  color: #6b7280;
  font-size: 12px;
}

.btn-remove {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  padding: 0 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
  line-height: 1;
}

.btn-remove:hover {
  background-color: #fee2e2;
}

/* Email Templates */
.template-section {
  margin-bottom: 16px;
}

.template-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.template-btn {
  padding: 8px 16px;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.template-btn:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

.template-btn.active {
  background-color: #16a34a;
  color: white;
  border-color: #16a34a;
}

.template-info {
  padding: 8px 12px;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  color: #166534;
  font-size: 13px;
}

/* Email Preview */
.email-preview {
  margin-top: 24px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
}

.email-preview h3 {
  margin: 0 0 16px 0;
  color: #15803d;
  font-size: 16px;
  font-weight: 600;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-field strong {
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.preview-text {
  padding: 12px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.preview-html {
  padding: 12px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  max-height: 200px;
  overflow-y: auto;
}

.preview-field ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.preview-field li {
  margin-bottom: 4px;
  font-size: 13px;
  color: #6b7280;
}

/* Email Scheduling */
.scheduling-section {
  margin-top: 12px;
  padding: 16px;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.scheduling-inputs {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.scheduling-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scheduling-input label {
  font-size: 14px;
  font-weight: 500;
  color: #166534;
}

.scheduling-preview {
  padding: 8px 12px;
  background-color: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  color: #166534;
  font-size: 13px;
}

/* Scheduled Emails */
.scheduled-emails {
  margin-top: 24px;
}

.scheduled-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scheduled-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.scheduled-item:hover {
  background-color: #f1f5f9;
}

.scheduled-info {
  flex: 1;
}

.scheduled-subject {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.scheduled-details {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6b7280;
}

.scheduled-recipients {
  font-weight: 500;
}

.scheduled-time {
  color: #9ca3af;
}

.scheduled-actions {
  display: flex;
  gap: 8px;
}

.btn-cancel {
  padding: 6px 12px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background-color: #dc2626;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
</style>



