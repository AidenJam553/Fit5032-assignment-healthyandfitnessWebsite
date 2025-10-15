<template>
  <div class="voice-assistant">
    <!-- 主悬浮按钮 -->
    <div 
      class="voice-assistant-button"
      :class="{ 'active': isOpen, 'listening': isListening }"
      @click="toggleAssistant"
    >
      <div class="mic-icon">
        <svg v-if="!isListening" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        <div v-else class="pulse-animation">
          <div class="pulse-ring"></div>
          <div class="pulse-ring"></div>
          <div class="pulse-ring"></div>
        </div>
      </div>
    </div>

    <!-- 助手面板 -->
    <div v-if="isOpen" class="voice-assistant-panel">
      <div class="panel-header">
        <h3>Voice Assistant</h3>
        <button @click="closeAssistant" class="close-btn">&times;</button>
      </div>
      
      <div class="panel-content">
        <!-- 状态显示 -->
        <div class="status-display">
          <div v-if="status" class="status-message" :class="status.type">
            {{ status.message }}
          </div>
        </div>

        <!-- 功能按钮 -->
        <div class="function-buttons">
          <button 
            class="function-btn"
            :class="{ 'active': isListening }"
            @click="toggleListening"
            :disabled="!isSupported"
          >
            <span class="btn-icon">🎤</span>
            {{ isListening ? 'Stop' : 'Record' }}
          </button>
          
          <button 
            class="function-btn"
            @click="speakLastResponse"
            :disabled="!lastResponse"
          >
            <span class="btn-icon">🔊</span>
            Repeat
          </button>
          
          <button class="function-btn" @click="showHelp">
            <span class="btn-icon">❓</span>
            Help
          </button>
          
          <button class="function-btn" @click="clearHistory">
            <span class="btn-icon">🗑️</span>
            Clear
          </button>
          
          <button class="function-btn" @click="toggleVoiceFeedback">
            <span class="btn-icon">{{ voiceFeedbackEnabled ? '🔇' : '🔊' }}</span>
            {{ voiceFeedbackEnabled ? 'Mute' : 'Unmute' }}
          </button>
          
          <button 
            v-if="isSpeakingNow"
            class="function-btn"
            @click="clearSpeechQueue"
          >
            <span class="btn-icon">⏹️</span>
            Stop
          </button>
        </div>

        <!-- 对话历史 -->
        <div class="conversation-history" v-if="conversationHistory.length > 0">
          <h4>Conversation History</h4>
          <div class="history-items">
            <div 
              v-for="(item, index) in conversationHistory" 
              :key="index"
              class="history-item"
              :class="item.type"
            >
              <div class="item-header">
                <span class="item-type">{{ item.type === 'user' ? 'User' : 'Assistant' }}</span>
                <span class="item-time">{{ formatTime(item.timestamp) }}</span>
              </div>
              <div class="item-content">{{ item.content }}</div>
            </div>
          </div>
        </div>

        <!-- 帮助信息 -->
        <div v-if="showHelpPanel" class="help-panel">
          <h4>Available Commands</h4>
          <div class="help-items">
            <div class="help-item">
              <strong>Navigation Commands:</strong>
              <ul>
                <li>"Go to home" / "Home page"</li>
                <li>"Open forum" / "Go to forum"</li>
                <li>"Start learning" / "Go to learn"</li>
                <li>"View records" / "Health records"</li>
                <li>"Explore" / "Discovery page"</li>
                <li>"My profile" / "Profile page"</li>
              </ul>
            </div>
            <div class="help-item">
              <strong>Function Commands:</strong>
              <ul>
                <li>"Search gym" / "Find gym"</li>
                <li>"Create post" / "New post"</li>
                <li>"View courses" / "Course list"</li>
                <li>"Logout" / "Sign out"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { logout, getCurrentUser, isUserLoggedIn } from '@/lib/auth'
import { analyzeVoiceCommand, processVoiceCommandWithContext } from '@/lib/voiceService'

const router = useRouter()

// 响应式状态
const isOpen = ref(false)
const isListening = ref(false)
const isSupported = ref(false)
const showHelpPanel = ref(false)
const status = ref(null)
const lastResponse = ref('')
const conversationHistory = ref([])
const voiceFeedbackEnabled = ref(true)
const isSpeakingNow = ref(false)

// 语音识别相关
let recognition = null
let speechSynthesis = null
let speechQueue = []
let isSpeaking = false

// 初始化
onMounted(() => {
  initializeSpeechServices()
})

onBeforeUnmount(() => {
  if (recognition) {
    recognition.stop()
  }
})

// 初始化语音服务
function initializeSpeechServices() {
  // 检查语音识别支持
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 3
    
    recognition.onstart = () => {
      isListening.value = true
      setStatus('info', 'Listening...')
    }
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      const confidence = event.results[0][0].confidence
      console.log('Speech recognition result:', { transcript, confidence })
      
      // 尝试使用替代结果如果主要结果置信度低
      let finalTranscript = transcript
      if (confidence < 0.8 && event.results[0].length > 1) {
        finalTranscript = event.results[0][1].transcript
        console.log('Using alternative transcript:', finalTranscript)
      }
      
      handleVoiceInput(finalTranscript)
    }
    
    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error)
      isListening.value = false
      setStatus('error', `Recognition error: ${event.error}`)
    }
    
    recognition.onend = () => {
      isListening.value = false
    }
    
    isSupported.value = true
  } else {
    setStatus('warning', 'Your browser does not support speech recognition')
  }
  
  // 检查语音合成支持
  speechSynthesis = window.speechSynthesis
  if (!speechSynthesis) {
    console.warn('浏览器不支持语音合成')
  }
}

// 切换助手面板
function toggleAssistant() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    showHelpPanel.value = false
  }
}

// 关闭助手面板
function closeAssistant() {
  isOpen.value = false
  if (isListening.value) {
    stopListening()
  }
  // 清空语音队列
  clearSpeechQueue()
}

// 切换录音状态
function toggleListening() {
  if (isListening.value) {
    stopListening()
  } else {
    startListening()
  }
}

// 开始录音
function startListening() {
  if (!recognition || !isSupported.value) {
    setStatus('error', 'Speech recognition not available')
    return
  }
  
  try {
    recognition.start()
  } catch (error) {
    console.error('启动语音识别失败:', error)
    setStatus('error', 'Failed to start recording')
  }
}

// 停止录音
function stopListening() {
  if (recognition && isListening.value) {
    recognition.stop()
  }
}

// 处理语音输入
async function handleVoiceInput(transcript) {
  console.log('语音输入:', transcript)
  
  // 添加到对话历史
  addToHistory('user', transcript)
  
  setStatus('info', 'Processing command...')
  
  try {
    // 获取当前上下文信息
    const context = {
      currentPage: getCurrentPageName(),
      userRole: getCurrentUserRole(),
      isLoggedIn: isUserLoggedIn()
    }
    
    console.log('处理上下文:', context)
    
    // 使用增强的上下文感知指令分析
    const result = await processVoiceCommandWithContext(transcript, context)
    
    console.log('指令分析结果:', result)
    
    if (result.success) {
      await executeCommand(result.command, result.params)
      lastResponse.value = result.response
      addToHistory('assistant', result.response)
      
      // 语音播报回答
      if (speechSynthesis && result.response && voiceFeedbackEnabled.value) {
        speak(result.response)
      }
      
      // 显示建议的后续操作
      if (result.suggestions && result.suggestions.length > 0) {
        setTimeout(() => {
          const suggestionsText = 'You can try: ' + result.suggestions.join(', ')
          addToHistory('assistant', suggestionsText)
          if (voiceFeedbackEnabled.value) {
            // 将建议添加到语音队列，确保完整播放
            speak(suggestionsText)
          }
        }, 2000)
      }
    } else {
      // 不显示错误消息，直接给出帮助提示
      const helpMsg = 'I can help you navigate the website. Try saying "go to home", "open forum", or "help" for more options.'
      addToHistory('assistant', helpMsg)
      if (voiceFeedbackEnabled.value) {
        speak(helpMsg)
      }
    }
  } catch (error) {
    console.error('处理语音指令失败:', error)
    const errorMsg = 'An error occurred while processing the command'
    setStatus('error', errorMsg)
    addToHistory('assistant', errorMsg)
    if (voiceFeedbackEnabled.value) {
      speak(errorMsg)
    }
  }
}

// 执行指令
async function executeCommand(command, params = {}) {
  switch (command) {
    case 'navigate':
      await navigateToPage(params.page)
      break
    case 'search':
      await performSearch(params.query)
      break
    case 'logout':
      await performLogout()
      break
    default:
      setStatus('info', 'Command processed')
  }
}

// 页面导航
async function navigateToPage(page) {
  console.log('尝试导航到页面:', page)
  
  const routes = {
    'home': '/',
    'forum': '/forum',
    'learn': '/learn',
    'record': '/record',
    'explore': '/explore',
    'profile': '/profile'
  }
  
  console.log('可用路由:', routes)
  console.log('目标路由:', routes[page])
  
  const route = routes[page]
  if (route) {
    console.log('执行导航到:', route)
    router.push(route)
    setStatus('success', `Navigated to ${getPageName(page)}`)
  } else {
    console.error('页面未找到:', page)
    setStatus('error', `Page "${page}" not found. Available pages: ${Object.keys(routes).join(', ')}`)
  }
}

// 搜索功能
async function performSearch(query) {
  if (query.includes('gym') || query.includes('fitness') || query.includes('workout')) {
    router.push('/explore')
    setStatus('success', 'Searching for gym information')
  } else {
    setStatus('warning', 'Search feature not yet implemented')
  }
}

// 登出
async function performLogout() {
  try {
    await logout()
    router.push('/')
    setStatus('success', 'Successfully logged out')
  } catch (error) {
    setStatus('error', 'Failed to logout')
  }
}

// 语音合成
function speak(text) {
  if (!speechSynthesis || !voiceFeedbackEnabled.value) return
  
  // 将文本添加到队列
  speechQueue.push(text)
  
  // 如果当前没有在播放，开始播放
  if (!isSpeaking) {
    processSpeechQueue()
  }
}

// 处理语音队列
function processSpeechQueue() {
  if (speechQueue.length === 0) {
    isSpeaking = false
    isSpeakingNow.value = false
    return
  }
  
  isSpeaking = true
  isSpeakingNow.value = true
  const text = speechQueue.shift()
  
  // 停止当前播放
  speechSynthesis.cancel()
  
  // 等待一小段时间确保取消完成
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.8  // 稍微慢一点
    utterance.pitch = 1
    utterance.volume = 0.8
    
    // 选择合适的声音
    const voices = speechSynthesis.getVoices()
    const englishVoice = voices.find(voice => 
      voice.lang.startsWith('en') && (voice.name.includes('English') || voice.name.includes('US'))
    )
    
    if (englishVoice) {
      utterance.voice = englishVoice
    }
    
    utterance.onstart = () => {
      console.log('Starting speech synthesis:', text)
    }
    
    utterance.onend = () => {
      console.log('Speech synthesis ended')
      // 播放完成后处理队列中的下一个
      setTimeout(() => {
        processSpeechQueue()
      }, 200)
    }
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      isSpeaking = false
      isSpeakingNow.value = false
      
      // 如果出错，尝试重试一次
      if (event.error === 'interrupted' || event.error === 'synthesis-failed') {
        console.log('Retrying speech synthesis...')
        setTimeout(() => {
          speechSynthesis.speak(utterance)
        }, 500)
      } else {
        // 其他错误，继续处理队列
        processSpeechQueue()
      }
    }
    
    utterance.onpause = () => {
      console.log('Speech synthesis paused')
    }
    
    utterance.onresume = () => {
      console.log('Speech synthesis resumed')
    }
    
    speechSynthesis.speak(utterance)
  }, 100)
}

// 重复上次回答
function speakLastResponse() {
  if (lastResponse.value) {
    speak(lastResponse.value)
  }
}

// 显示帮助
function showHelp() {
  showHelpPanel.value = !showHelpPanel.value
}

// 清空对话历史
function clearHistory() {
  conversationHistory.value = []
  lastResponse.value = ''
  setStatus('success', 'Conversation history cleared')
}

// 切换语音反馈
function toggleVoiceFeedback() {
  voiceFeedbackEnabled.value = !voiceFeedbackEnabled.value
  const message = voiceFeedbackEnabled.value ? 'Voice feedback enabled' : 'Voice feedback disabled'
  setStatus('info', message)
  
  // 如果禁用语音反馈，清空队列
  if (!voiceFeedbackEnabled.value) {
    speechQueue = []
    if (speechSynthesis) {
      speechSynthesis.cancel()
    }
    isSpeaking = false
  } else {
    speak(message)
  }
}

// 清空语音队列
function clearSpeechQueue() {
  speechQueue = []
  if (speechSynthesis) {
    speechSynthesis.cancel()
  }
  isSpeaking = false
  isSpeakingNow.value = false
}

// 设置状态消息
function setStatus(type, message) {
  status.value = { type, message }
  setTimeout(() => {
    status.value = null
  }, 3000)
}

// 添加到对话历史
function addToHistory(type, content) {
  conversationHistory.value.unshift({
    type,
    content,
    timestamp: new Date()
  })
  
  // 限制历史记录数量
  if (conversationHistory.value.length > 10) {
    conversationHistory.value = conversationHistory.value.slice(0, 10)
  }
}

// 格式化时间
function formatTime(timestamp) {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取页面名称
function getPageName(page) {
  const names = {
    'home': 'Home',
    'forum': 'Forum',
    'learn': 'Learn',
    'record': 'Health Records',
    'explore': 'Explore',
    'profile': 'Profile'
  }
  return names[page] || page
}

// 获取当前页面名称
function getCurrentPageName() {
  const route = router.currentRoute.value
  const pathToName = {
    '/': 'home',
    '/forum': 'forum',
    '/learn': 'learn',
    '/record': 'record',
    '/explore': 'explore',
    '/profile': 'profile'
  }
  return pathToName[route.path] || 'unknown'
}

// 获取当前用户角色
function getCurrentUserRole() {
  const user = getCurrentUser()
  return user ? user.role : 'guest'
}
</script>

<style scoped>
.voice-assistant {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
}

.voice-assistant-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.voice-assistant-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
}

.voice-assistant-button.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.voice-assistant-button.listening {
  animation: pulse 1.5s infinite;
}

.mic-icon {
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-animation {
  position: relative;
  width: 24px;
  height: 24px;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid white;
  border-radius: 50%;
  animation: pulse-ring 1.5s infinite;
}

.pulse-ring:nth-child(2) {
  animation-delay: 0.5s;
}

.pulse-ring:nth-child(3) {
  animation-delay: 1s;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

.voice-assistant-panel {
  position: absolute;
  bottom: 80px;
  left: 0;
  width: 350px;
  max-height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.panel-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.status-display {
  margin-bottom: 16px;
}

.status-message {
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.status-message.info {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-message.success {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.status-message.warning {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-message.error {
  background-color: #ffebee;
  color: #d32f2f;
}

.function-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.function-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 6px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  min-height: 48px;
  letter-spacing: 0.5px;
}

.function-btn:hover {
  border-color: #667eea;
  background-color: #f8f9ff;
}

.function-btn.active {
  border-color: #667eea;
  background-color: #667eea;
  color: white;
}

.function-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.conversation-history {
  margin-bottom: 20px;
}

.conversation-history h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.history-items {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #e0e0e0;
}

.history-item.user {
  background-color: #f5f5f5;
  border-left-color: #667eea;
}

.history-item.assistant {
  background-color: #e8f5e8;
  border-left-color: #4caf50;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.item-type {
  font-weight: 600;
}

.item-content {
  font-size: 14px;
  line-height: 1.4;
}

.help-panel {
  margin-top: 20px;
}

.help-panel h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.help-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.help-item {
  font-size: 14px;
}

.help-item strong {
  color: #667eea;
  display: block;
  margin-bottom: 8px;
}

.help-item ul {
  margin: 0;
  padding-left: 20px;
}

.help-item li {
  margin-bottom: 4px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .voice-assistant {
    bottom: 15px;
    left: 15px;
  }
  
  .voice-assistant-button {
    width: 50px;
    height: 50px;
  }
  
  .voice-assistant-panel {
    width: 300px;
    bottom: 70px;
  }
  
  .panel-content {
    padding: 16px;
  }
  
  .function-buttons {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .function-btn {
    padding: 10px 4px;
    font-size: 11px;
    min-height: 44px;
  }
  
  .btn-icon {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .voice-assistant-panel {
    width: 280px;
  }
  
  .function-buttons {
    gap: 6px;
  }
  
  .function-btn {
    padding: 8px 2px;
    font-size: 10px;
    min-height: 40px;
  }
  
  .btn-icon {
    font-size: 12px;
  }
}
</style>
