<script setup>
import { ref, onMounted } from 'vue'
import { logout } from '@/lib/auth'
import { useRouter } from 'vue-router'
import Button from '@/components/Button.vue'

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5175/api'

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

// Clear all selections
function clearSelection() {
  selectedUsers.value = []
  updateRecipientsField()
}

// Update recipients field based on selected users
function updateRecipientsField() {
  recipients.value = selectedUsers.value.map(u => u.email).join(', ')
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

// Send email
async function sendEmail() {
  if (!recipients.value.trim() || !subject.value.trim() || !emailContent.value.trim()) {
    showMessage('Please fill in all required fields', 'error')
    return
  }
  
  sending.value = true
  
  try {
    const formData = new FormData()
    formData.append('to', recipients.value)
    formData.append('subject', subject.value)
    
    if (useHtml.value) {
      formData.append('html', emailContent.value)
    } else {
      formData.append('text', emailContent.value)
    }
    
    // Add attachments
    attachments.value.forEach(file => {
      formData.append('attachments', file)
    })
    
    const response = await fetch(`${API_URL}/admin/send-email`, {
      method: 'POST',
      body: formData,
    })
    
    const data = await response.json()
    
    if (data.ok) {
      showMessage(data.message || 'Email sent successfully!', 'success')
      // Reset form
      recipients.value = ''
      subject.value = ''
      emailContent.value = ''
      attachments.value = []
      selectedUsers.value = []
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    } else {
      showMessage(data.error || 'Failed to send email', 'error')
    }
  } catch (err) {
    showMessage('Error sending email: ' + err.message, 'error')
  } finally {
    sending.value = false
  }
}

function handleLogout() {
  logout()
  router.push('/')
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="admin">
    <header class="admin__bar">
      <div class="container admin__bar-inner">
        <router-link to="/admin" class="logo">ADMIN MANAGE SYSTEM</router-link>
        <div class="admin__actions">
          <Button variant="secondary" size="medium" @click="handleLogout">Log out</Button>
          <div class="chip">
            <span class="chip__avatar">A</span>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </header>

    <main class="container admin__content">
      <h1 class="page-title">Email Centre</h1>
      
      <!-- Message alert -->
      <div v-if="message" :class="['alert', `alert-${messageType}`]">
        {{ message }}
      </div>
      
      <div class="email-container">
        <!-- User Selection Panel -->
        <div class="users-panel card">
          <div class="panel-header">
            <h2>Select Recipients</h2>
            <div class="panel-actions">
              <button @click="selectAllUsers" class="btn-link">Select All</button>
              <button @click="clearSelection" class="btn-link">Clear</button>
            </div>
          </div>
          
          <div v-if="loading" class="loading">Loading users...</div>
          
          <div v-else class="users-list">
            <div
              v-for="user in users"
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
            
            <div v-if="users.length === 0" class="no-users">
              No users available
            </div>
          </div>
          
          <div class="selection-summary">
            <strong>{{ selectedUsers.length }}</strong> user(s) selected
          </div>
        </div>

        <!-- Email Form -->
        <div class="email-form card">
          <h2>Compose Email</h2>
          
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

          <div class="form-actions">
            <Button
              variant="primary"
              size="large"
              @click="sendEmail"
              :disabled="sending"
            >
              {{ sending ? 'Sending...' : 'Send Email' }}
            </Button>
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

/* Email Container */
.email-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
  margin-top: 16px;
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
  max-height: 700px;
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
}

/* Email Form */
.email-form {
  height: fit-content;
}

.form-group {
  margin-bottom: 20px;
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
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
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
  padding: 10px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: border-color 0.2s;
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

.form-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>



