<template>
  <div class="accessibility-panel">
    <!-- Floating Button -->
    <button 
      class="accessibility-toggle"
      @click="togglePanel"
      :class="{ 'active': isOpen }"
      aria-label="Accessibility Options"
    >
      <img class="accessibility-icon" src="/icons8-accessibility-50.png" alt="Accessibility" />
    </button>

    <!-- Function Panel -->
    <div class="accessibility-menu" :class="{ 'active': isOpen }">
      <div class="menu-header">
        <h3>Accessibility</h3>
        <button class="close-btn" @click="closePanel" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="menu-content">
        <!-- Large Text Mode -->
        <div class="feature-item">
          <div class="feature-info">
            <div class="feature-icon">🔍</div>
            <div class="feature-text">
              <span class="feature-title">Large Text</span>
              <span class="feature-desc">Increase text size for better readability</span>
            </div>
          </div>
          <button 
            class="ios-toggle"
            @click="toggleLargeText"
            :class="{ 'active': isLargeText }"
            :aria-pressed="isLargeText"
            aria-label="Toggle large text mode"
          >
            <div class="toggle-track">
              <div class="toggle-thumb"></div>
            </div>
          </button>
        </div>

        <!-- Read Aloud Function -->
        <div class="feature-item">
          <div class="feature-info">
            <div class="feature-icon">🔊</div>
            <div class="feature-text">
              <span class="feature-title">Read Aloud</span>
              <span class="feature-desc">Read current page content</span>
            </div>
          </div>
          <button 
            class="ios-toggle"
            @click="toggleReadAloud"
            :class="{ 'active': isReadAloud }"
            :aria-pressed="isReadAloud"
            aria-label="Toggle read aloud mode"
          >
            <div class="toggle-track">
              <div class="toggle-thumb"></div>
            </div>
          </button>
        </div>

        <!-- Read Aloud Controls -->
        <div v-if="isReadAloud" class="read-aloud-controls">
          <button 
            class="control-btn"
            @click="playPause"
            :disabled="!hasContent"
          >
            <svg v-if="isPlaying" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
            {{ isPlaying ? 'Pause' : 'Play' }}
          </button>
          
          <button 
            class="control-btn"
            @click="stopReading"
            :disabled="!isPlaying"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            Stop
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

// Reactive state
const isOpen = ref(false)
const isLargeText = ref(false)
const isReadAloud = ref(false)
const isPlaying = ref(false)
const hasContent = ref(false)

// Speech synthesis related
let speechSynthesis = null
let currentUtterance = null

// Toggle panel
function togglePanel() {
  isOpen.value = !isOpen.value
}

function closePanel() {
  isOpen.value = false
}

// Large text mode
function toggleLargeText() {
  isLargeText.value = !isLargeText.value
  updateLargeTextMode()
}

function updateLargeTextMode() {
  const body = document.body
  if (isLargeText.value) {
    body.classList.add('large-text-mode')
  } else {
    body.classList.remove('large-text-mode')
  }
}

// Read aloud function
function toggleReadAloud() {
  isReadAloud.value = !isReadAloud.value
  if (!isReadAloud.value) {
    stopReading()
  } else {
    checkContentAvailability()
  }
}

function checkContentAvailability() {
  // Check if there is readable content
  const mainContent = document.querySelector('main') || 
                     document.querySelector('.main-content') ||
                     document.querySelector('.page-content') ||
                     document.querySelector('.content') ||
                     document.querySelector('.container') || 
                     document.querySelector('#app > div:not(.site-topbar)')
  
  // If main container is not found, check if body has enough content
  if (!mainContent) {
    const bodyText = document.body.textContent || document.body.innerText || ''
    const cleanedBodyText = bodyText.replace(/\s+/g, ' ').trim()
    hasContent.value = cleanedBodyText.length > 20 // At least 20 characters of content
  } else {
    const mainText = mainContent.textContent || mainContent.innerText || ''
    const cleanedMainText = mainText.replace(/\s+/g, ' ').trim()
    hasContent.value = cleanedMainText.length > 20 // At least 20 characters of content
  }
}

function playPause() {
  if (isPlaying.value) {
    pauseReading()
  } else {
    startReading()
  }
}

function startReading() {
  if (!speechSynthesis) return

  const content = extractPageContent()
  if (!content) return

  // Stop current playback
  speechSynthesis.cancel()

  currentUtterance = new SpeechSynthesisUtterance(content)
  currentUtterance.lang = 'en-US'
  currentUtterance.rate = 0.8
  currentUtterance.pitch = 1
  currentUtterance.volume = 0.8

  // Select English voice
  const voices = speechSynthesis.getVoices()
  const englishVoice = voices.find(voice => 
    voice.lang.startsWith('en') && (voice.name.includes('English') || voice.name.includes('US'))
  )
  if (englishVoice) {
    currentUtterance.voice = englishVoice
  }

  currentUtterance.onstart = () => {
    isPlaying.value = true
  }

  currentUtterance.onend = () => {
    isPlaying.value = false
    currentUtterance = null
  }

  currentUtterance.onerror = (event) => {
    console.error('Speech synthesis error:', event.error)
    isPlaying.value = false
    currentUtterance = null
  }

  speechSynthesis.speak(currentUtterance)
}

function pauseReading() {
  if (speechSynthesis) {
    speechSynthesis.pause()
    isPlaying.value = false
  }
}

function stopReading() {
  if (speechSynthesis) {
    speechSynthesis.cancel()
    isPlaying.value = false
    currentUtterance = null
  }
}

function extractPageContent() {
  // Exclude elements that don't need to be read aloud
  const excludedSelectors = [
    '.site-topbar',
    'header',
    'nav',
    '.navigation',
    '.voice-assistant',
    '.accessibility-panel',
    'script',
    'style',
    '.hidden',
    '[aria-hidden="true"]',
    '.sr-only',
    '.visually-hidden',
    'noscript',
    'iframe[src*="ads"]',
    '.advertisement',
    '.ad-banner',
    '.social-share',
    '.share-buttons',
    '.cookie-banner',
    '.popup',
    '.modal',
    '.tooltip'
  ]

  // Get main content area of the page, search by priority
  let mainContent = document.querySelector('main') || 
                   document.querySelector('.main-content') ||
                   document.querySelector('.page-content') ||
                   document.querySelector('.content') ||
                   document.querySelector('.container') || 
                   document.querySelector('#app > div:not(.site-topbar)')

  if (!mainContent) {
    // If main container is not found, exclude unnecessary elements from body
    mainContent = document.body.cloneNode(true)
  } else {
    // Clone the found main content area
    mainContent = mainContent.cloneNode(true)
  }

  // If mainContent is a clone of body, need to remove unnecessary elements
  if (mainContent === document.body.cloneNode(true)) {
    excludedSelectors.forEach(selector => {
      const elements = mainContent.querySelectorAll(selector)
      elements.forEach(el => el.remove())
    })
  }

  // Further clean up content
  const contentClone = mainContent.cloneNode(true)

  // Remove empty elements and elements containing only whitespace
  const allElements = contentClone.querySelectorAll('*')
  allElements.forEach(el => {
    // Remove elements without text content and without child elements
    if (el.children.length === 0 && (!el.textContent || el.textContent.trim() === '')) {
      el.remove()
    }
    // Remove elements containing only whitespace characters
    else if (el.children.length === 0 && el.textContent && el.textContent.trim() === '') {
      el.remove()
    }
  })

  // Handle special elements, add appropriate pauses
  const headings = contentClone.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1))
    const prefix = level <= 2 ? 'Heading' : 'Section'
    heading.textContent = `${prefix}: ${heading.textContent}`
  })

  // Handle list items
  const listItems = contentClone.querySelectorAll('li')
  listItems.forEach(li => {
    if (li.textContent.trim()) {
      li.textContent = `List item: ${li.textContent.trim()}`
    }
  })

  // Handle links
  const links = contentClone.querySelectorAll('a')
  links.forEach(link => {
    if (link.textContent.trim()) {
      const href = link.getAttribute('href')
      if (href && !href.startsWith('#')) {
        link.textContent = `${link.textContent.trim()}, link`
      }
    }
  })

  // Handle buttons
  const buttons = contentClone.querySelectorAll('button')
  buttons.forEach(button => {
    if (button.textContent.trim()) {
      button.textContent = `Button: ${button.textContent.trim()}`
    }
  })

  // Handle image alt text
  const images = contentClone.querySelectorAll('img')
  images.forEach(img => {
    const alt = img.getAttribute('alt')
    if (alt && alt.trim()) {
      img.textContent = `Image: ${alt.trim()}`
    } else {
      img.remove() // Remove images without alt text
    }
  })

  // Extract text content
  const textContent = contentClone.textContent || contentClone.innerText || ''
  
  // Clean and format text
  const cleanedText = textContent
    .replace(/\s+/g, ' ')  // Merge multiple whitespace characters
    .replace(/\n\s*\n/g, '. ')  // Convert line breaks to periods
    .replace(/\s*\.\s*\./g, '.')  // Remove duplicate periods
    .replace(/\s*,\s*,/g, ',')  // Remove duplicate commas
    .replace(/\s+/g, ' ')  // Merge whitespace characters again
    .trim()

  // If content is too short, try to get more content
  if (cleanedText.length < 50) {
    // Try to get content from the entire page (excluding already excluded elements)
    const fullPageContent = document.body.cloneNode(true)
    excludedSelectors.forEach(selector => {
      const elements = fullPageContent.querySelectorAll(selector)
      elements.forEach(el => el.remove())
    })
    
    const fullText = fullPageContent.textContent || fullPageContent.innerText || ''
    const fullCleanedText = fullText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '. ')
      .replace(/\s*\.\s*\./g, '.')
      .replace(/\s*,\s*,/g, ',')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (fullCleanedText.length > cleanedText.length) {
      return fullCleanedText
    }
  }

  return cleanedText || 'No readable content found on this page. Please check if the page has loaded completely.'
}

// Lifecycle
onMounted(() => {
  speechSynthesis = window.speechSynthesis
  checkContentAvailability()
  
  // Listen for page changes
  const observer = new MutationObserver(checkContentAvailability)
  observer.observe(document.body, { childList: true, subtree: true })
  
  onBeforeUnmount(() => {
    observer.disconnect()
    stopReading()
  })
})

// Listen for route changes
watch(() => window.location.pathname, () => {
  stopReading()
  checkContentAvailability()
})
</script>

<style scoped>
.accessibility-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.accessibility-toggle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
  transition: all 0.3s ease;
  color: white;
}

.accessibility-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(16, 185, 129, 0.6);
}

.accessibility-toggle.active {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  transform: scale(1.05);
}

.accessibility-icon {
  width: 44px;
  height: 44px;
  filter: brightness(0) invert(1);
  object-fit: contain;
}

.accessibility-menu {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.accessibility-menu.active {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.menu-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #6b7280;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

.menu-content {
  padding: 20px 24px 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.feature-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: #f3f4f6;
  border-radius: 8px;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.feature-desc {
  font-size: 14px;
  color: #6b7280;
}

/* iOS Style Toggle */
.ios-toggle {
  width: 51px;
  height: 31px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  border-radius: 16px;
  transition: all 0.3s ease;
  position: relative;
}

.toggle-track {
  width: 100%;
  height: 100%;
  background: #e5e7eb;
  border-radius: 16px;
  position: relative;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
}

.ios-toggle.active .toggle-track {
  background: #10b981;
}

.toggle-thumb {
  width: 27px;
  height: 27px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 2px;
  transform: translateY(-50%);
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.ios-toggle.active .toggle-thumb {
  transform: translateY(-50%) translateX(20px);
}

/* Read Aloud Control Buttons */
.read-aloud-controls {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 12px;
}

.control-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  background: #e5e7eb;
  color: #1f2937;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn svg {
  width: 16px;
  height: 16px;
}

/* Responsive Design */
@media (max-width: 480px) {
  .accessibility-panel {
    bottom: 16px;
    right: 16px;
  }
  
  .accessibility-toggle {
    width: 48px;
    height: 48px;
  }
  
  .accessibility-icon {
    width: 40px;
    height: 40px;
  }
  
  .accessibility-menu {
    width: 280px;
    bottom: 64px;
  }
  
  .menu-header,
  .menu-content {
    padding: 16px 20px;
  }
}
</style>

<style>
/* Global Large Text Mode Styles */
.large-text-mode {
  font-size: 1.2em;
  line-height: 1.6;
}

.large-text-mode h1 {
  font-size: 2.4em !important;
}

.large-text-mode h2 {
  font-size: 2em !important;
}

.large-text-mode h3 {
  font-size: 1.8em !important;
}

.large-text-mode h4 {
  font-size: 1.6em !important;
}

.large-text-mode h5 {
  font-size: 1.4em !important;
}

.large-text-mode h6 {
  font-size: 1.2em !important;
}

.large-text-mode p {
  font-size: 1.1em !important;
}

.large-text-mode .btn {
  font-size: 1.1em !important;
  padding: 12px 20px !important;
}

.large-text-mode .card {
  font-size: 1.1em !important;
}

.large-text-mode .form-control {
  font-size: 1.1em !important;
  padding: 12px 16px !important;
}

/* Ensure header is not affected by large text mode */
.large-text-mode .site-topbar,
.large-text-mode .site-topbar * {
  font-size: inherit !important;
}

.large-text-mode .site-topbar .brand__text {
  font-size: 24px !important;
}

.large-text-mode .site-topbar .nav__link {
  font-size: inherit !important;
}

@media (min-width: 576px) {
  .large-text-mode .site-topbar .brand__text {
    font-size: 26px !important;
  }
}

@media (min-width: 992px) {
  .large-text-mode .site-topbar .brand__text {
    font-size: 28px !important;
  }
}

@media (min-width: 1400px) {
  .large-text-mode .site-topbar .brand__text {
    font-size: 30px !important;
  }
}
</style>


