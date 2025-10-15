// Voice Service for handling voice commands and Gemini API integration
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY'

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(API_KEY)

/**
 * Analyze voice command and return structured command with parameters
 * @param {string} transcript - The transcribed voice input
 * @returns {Object} - Command analysis result
 */
export async function analyzeVoiceCommand(transcript) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const prompt = `You are an intelligent voice assistant for a health and fitness website. You should understand user intent even when they don't use exact command phrases.

User input: ${transcript}

Analyze the user's intent and return a JSON format response. Be smart about understanding what the user wants to do, even with casual or incomplete phrases.

Available command types:
1. navigate - Page navigation
   - Parameters: page (home, forum, learn, record, explore, profile)
   - Examples: "go to home", "open forum", "start learning", "I want to look some courses", "show me my records"

2. search - Search functionality  
   - Parameters: query (search keywords)
   - Examples: "search gym", "find fitness center", "where are gyms nearby"

3. logout - Logout
   - Parameters: none
   - Examples: "logout", "sign out", "log out"

4. help - Help information
   - Parameters: none
   - Examples: "help", "what can you do", "what are my options"

Smart Intent Understanding Examples:
- "I want to look some courses" → navigate to learn page
- "Show me my progress" → navigate to record page  
- "Where can I find gyms?" → navigate to explore page
- "I want to talk to people" → navigate to forum page
- "Show my profile" → navigate to profile page
- "I want to study" → navigate to learn page
- "Where are fitness places?" → navigate to explore page

Please return the following JSON format:

{
  "success": true/false,
  "command": "command_type",
  "params": {
    "param_name": "param_value"
  },
  "response": "friendly_reply_to_user",
  "confidence": 0.0-1.0
}

If unable to understand the command, return:
{
  "success": true,
  "command": "help",
  "params": {},
  "response": "I can help you navigate the website. Try saying 'I want to look at courses', 'show me my records', or 'help' for more options.",
  "confidence": 0.1
}

Please ensure:
1. Understand user intent, not just exact phrases
2. Be helpful and conversational in responses
3. Provide relevant navigation based on what user wants to do
4. Use natural, friendly language`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse JSON from response
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
      const jsonText = jsonMatch ? jsonMatch[1] : text
      
      const analysis = JSON.parse(jsonText)
      
      return {
        success: analysis.success !== false,
        command: analysis.command || 'unknown',
        params: analysis.params || {},
        response: analysis.response || 'Command processed',
        confidence: analysis.confidence || 0.8,
        error: analysis.error
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON from Gemini response:', parseError)
      
      // Fallback: simple keyword matching
      return fallbackCommandAnalysis(transcript)
    }
  } catch (error) {
    console.error('Error analyzing voice command:', error)
    
    // Fallback: simple keyword matching
    return fallbackCommandAnalysis(transcript)
  }
}

/**
 * Fallback command analysis using simple keyword matching
 * @param {string} transcript - The transcribed voice input
 * @returns {Object} - Command analysis result
 */
function fallbackCommandAnalysis(transcript) {
  const lowerTranscript = transcript.toLowerCase()
  
  // Navigation commands - Enhanced with smart context understanding
  if (lowerTranscript.includes('home') || lowerTranscript.includes('homepage') || lowerTranscript.includes('main page') || lowerTranscript.includes('go home') || 
      lowerTranscript.includes('back to home') || lowerTranscript.includes('return home') || lowerTranscript.includes('main menu')) {
    return {
      success: true,
      command: 'navigate',
      params: { page: 'home' },
      response: 'Navigating to home page',
      confidence: 0.9
    }
  }
  
  if (lowerTranscript.includes('forum') || lowerTranscript.includes('discussion') || lowerTranscript.includes('open forum') || lowerTranscript.includes('go to forum') ||
      lowerTranscript.includes('talk') || lowerTranscript.includes('chat') || lowerTranscript.includes('post') || lowerTranscript.includes('discuss') ||
      lowerTranscript.includes('community') || lowerTranscript.includes('share')) {
    return {
      success: true,
      command: 'navigate',
      params: { page: 'forum' },
      response: 'Opening forum page',
      confidence: 0.9
    }
  }
  
  if (lowerTranscript.includes('learn') || lowerTranscript.includes('learning') || lowerTranscript.includes('course') || lowerTranscript.includes('start learning') || lowerTranscript.includes('go to learn') || lowerTranscript.includes('courses') ||
      lowerTranscript.includes('study') || lowerTranscript.includes('training') || lowerTranscript.includes('education') || lowerTranscript.includes('lesson') ||
      lowerTranscript.includes('tutorial') || lowerTranscript.includes('class') || lowerTranscript.includes('program') || lowerTranscript.includes('curriculum') ||
      lowerTranscript.includes('look') && lowerTranscript.includes('course') || lowerTranscript.includes('see') && lowerTranscript.includes('course') ||
      lowerTranscript.includes('check') && lowerTranscript.includes('course') || lowerTranscript.includes('find') && lowerTranscript.includes('course') ||
      lowerTranscript.includes('browse') && lowerTranscript.includes('course') || lowerTranscript.includes('view') && lowerTranscript.includes('course')) {
    return {
      success: true,
      command: 'navigate',
      params: { page: 'learn' },
      response: 'Opening learning page where you can browse all available courses',
      confidence: 0.9
    }
  }
  
  if (lowerTranscript.includes('record') || lowerTranscript.includes('health') || lowerTranscript.includes('records') || lowerTranscript.includes('view records') || lowerTranscript.includes('health records') ||
      lowerTranscript.includes('track') || lowerTranscript.includes('log') || lowerTranscript.includes('history') || lowerTranscript.includes('data') ||
      lowerTranscript.includes('progress') || lowerTranscript.includes('stats') || lowerTranscript.includes('statistics') || lowerTranscript.includes('analytics') ||
      lowerTranscript.includes('my') && (lowerTranscript.includes('record') || lowerTranscript.includes('data') || lowerTranscript.includes('progress'))) {
    return {
      success: true,
      command: 'navigate',
      params: { page: 'record' },
      response: 'Opening your health records and progress tracking page',
      confidence: 0.9
    }
  }
  
  if (lowerTranscript.includes('explore') || lowerTranscript.includes('discover') || lowerTranscript.includes('exploration') || lowerTranscript.includes('discovery page') ||
      lowerTranscript.includes('browse') || lowerTranscript.includes('find') || lowerTranscript.includes('search') || lowerTranscript.includes('look for') ||
      lowerTranscript.includes('gym') || lowerTranscript.includes('fitness') || lowerTranscript.includes('workout') || lowerTranscript.includes('exercise') ||
      lowerTranscript.includes('place') || lowerTranscript.includes('location') || lowerTranscript.includes('nearby') || lowerTranscript.includes('around')) {
    return {
      success: true,
      command: 'navigate',
      params: { page: 'explore' },
      response: 'Opening explore page where you can discover gyms and fitness locations',
      confidence: 0.9
    }
  }
  
  if (lowerTranscript.includes('profile') || lowerTranscript.includes('my profile') || lowerTranscript.includes('personal') || lowerTranscript.includes('profile page') ||
      lowerTranscript.includes('account') || lowerTranscript.includes('settings') || lowerTranscript.includes('preferences') || lowerTranscript.includes('information') ||
      lowerTranscript.includes('details') || lowerTranscript.includes('edit') || lowerTranscript.includes('update') || lowerTranscript.includes('change') ||
      lowerTranscript.includes('my') && (lowerTranscript.includes('info') || lowerTranscript.includes('details') || lowerTranscript.includes('account'))) {
    return {
      success: true,
      command: 'navigate',
      params: { page: 'profile' },
      response: 'Opening your profile page where you can view and edit your information',
      confidence: 0.9
    }
  }
  
  // Search commands - Enhanced with smart search understanding
  if (lowerTranscript.includes('search') || lowerTranscript.includes('find') || lowerTranscript.includes('look for') || lowerTranscript.includes('search gym') || lowerTranscript.includes('find gym') ||
      lowerTranscript.includes('look') && (lowerTranscript.includes('gym') || lowerTranscript.includes('place') || lowerTranscript.includes('location')) ||
      lowerTranscript.includes('where') && (lowerTranscript.includes('gym') || lowerTranscript.includes('fitness') || lowerTranscript.includes('workout')) ||
      lowerTranscript.includes('nearby') || lowerTranscript.includes('around') || lowerTranscript.includes('close to')) {
    return {
      success: true,
      command: 'search',
      params: { query: transcript },
      response: 'Searching for gyms and fitness locations near you',
      confidence: 0.8
    }
  }
  
  // Logout commands
  if (lowerTranscript.includes('logout') || lowerTranscript.includes('sign out') || lowerTranscript.includes('log out')) {
    return {
      success: true,
      command: 'logout',
      params: {},
      response: 'Logging you out',
      confidence: 0.9
    }
  }
  
  // Help commands
  if (lowerTranscript.includes('help') || lowerTranscript.includes('what can you do') || lowerTranscript.includes('assistance')) {
    return {
      success: true,
      command: 'help',
      params: {},
      response: 'I can help you navigate to different pages, search content, or logout. Try saying "go to home", "open forum", etc.',
      confidence: 0.9
    }
  }
  
  // Unknown command - return helpful guidance instead of error
  return {
    success: true,
    command: 'help',
    params: {},
    response: 'I can help you navigate the website. Try saying "go to home", "open forum", "start learning", or "help" for more options.',
    confidence: 0.1
  }
}

/**
 * Get available voice commands for help display
 * @returns {Array} - Array of available commands
 */
export function getAvailableCommands() {
  return [
    {
      category: 'Navigation Commands',
      commands: [
        { text: 'Go to home', description: 'Navigate to website homepage' },
        { text: 'Open forum', description: 'Go to forum page' },
        { text: 'Start learning', description: 'Open course learning page' },
        { text: 'View records', description: 'Open health records page' },
        { text: 'Explore', description: 'Go to discovery page' },
        { text: 'My profile', description: 'View personal profile' }
      ]
    },
    {
      category: 'Function Commands',
      commands: [
        { text: 'Search gym', description: 'Search for nearby gyms' },
        { text: 'Logout', description: 'Sign out of current account' },
        { text: 'Help', description: 'Show available commands' }
      ]
    }
  ]
}

/**
 * Process voice command with enhanced context awareness
 * @param {string} transcript - The transcribed voice input
 * @param {Object} context - Current application context
 * @returns {Object} - Enhanced command analysis result
 */
export async function processVoiceCommandWithContext(transcript, context = {}) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const contextInfo = {
      currentPage: context.currentPage || 'unknown',
      userRole: context.userRole || 'user',
      isLoggedIn: context.isLoggedIn || false
    }
    
    const prompt = `You are an intelligent voice assistant for a health and fitness website.

Current context:
- Current page: ${contextInfo.currentPage}
- User role: ${contextInfo.userRole}
- Login status: ${contextInfo.isLoggedIn ? 'Logged in' : 'Not logged in'}

User input: ${transcript}

Please return a JSON format response based on the current context and user input. Consider the following factors:

1. If user is not logged in, some features may not be available
2. Based on current page, provide relevant shortcut commands
3. Based on user role (admin/regular user), provide appropriate functions

Available command types:
1. navigate - Page navigation
2. search - Search functionality
3. logout - Logout
4. help - Help information
5. unknown - Unrecognized command

Please return JSON format:
{
  "success": true/false,
  "command": "command_type",
  "params": {"param_name": "param_value"},
  "response": "reply_to_user",
  "confidence": 0.0-1.0,
  "suggestions": ["suggested_next_actions"]
}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
      const jsonText = jsonMatch ? jsonMatch[1] : text
      
      const analysis = JSON.parse(jsonText)
      
      return {
        success: analysis.success !== false,
        command: analysis.command || 'unknown',
        params: analysis.params || {},
        response: analysis.response || 'Command processed',
        confidence: analysis.confidence || 0.8,
        suggestions: analysis.suggestions || [],
        error: analysis.error
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON from context-aware analysis:', parseError)
      return fallbackCommandAnalysis(transcript)
    }
  } catch (error) {
    console.error('Error in context-aware command analysis:', error)
    return fallbackCommandAnalysis(transcript)
  }
}
