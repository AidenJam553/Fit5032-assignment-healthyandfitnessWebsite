// Security utility functions - XSS protection, input validation, data sanitization

/**
 * XSS Protection - HTML escaping
 * Prevent malicious script injection
 */
export function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#x2F;")
}

/**
 * XSS Protection - Clean HTML content
 * Remove all HTML tags, keep only plain text
 */
export function stripHtml(html) {
  if (typeof html !== 'string') return html
  
  const div = document.createElement('div')
  div.textContent = html
  return div.textContent || div.innerText || ''
}

/**
 * XSS Protection - Safe HTML content
 * Only allow safe HTML tags and attributes
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string') return html
  
  // Create temporary element
  const div = document.createElement('div')
  div.innerHTML = html
  
  // Remove all script tags
  const scripts = div.querySelectorAll('script')
  scripts.forEach(script => script.remove())
  
  // Remove all event handlers
  const allElements = div.querySelectorAll('*')
  allElements.forEach(el => {
    // Remove all on* attributes
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name)
      }
    })
  })
  
  return div.innerHTML
}

/**
 * Input validation - Email format
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email.trim())
}

/**
 * Input validation - Password strength
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' }
  }
  
  const minLength = 8
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  
  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters long` }
  }
  
  if (!hasLower) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  
  if (!hasUpper) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  
  if (!hasDigit) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  
  return { valid: true, message: 'Password is strong' }
}

/**
 * Input validation - Username
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: 'Username is required' }
  }
  
  const trimmed = username.trim()
  
  if (trimmed.length < 2) {
    return { valid: false, message: 'Username must be at least 2 characters long' }
  }
  
  if (trimmed.length > 50) {
    return { valid: false, message: 'Username must be less than 50 characters' }
  }
  
  // Only allow letters, numbers, underscores, hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  if (!usernameRegex.test(trimmed)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' }
  }
  
  return { valid: true, message: 'Username is valid' }
}

/**
 * Input validation - Number range
 */
export function validateNumber(value, min = 0, max = Infinity, fieldName = 'Value') {
  const num = Number(value)
  
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName} must be a valid number` }
  }
  
  if (num < min) {
    return { valid: false, message: `${fieldName} must be at least ${min}` }
  }
  
  if (num > max) {
    return { valid: false, message: `${fieldName} must be less than ${max}` }
  }
  
  return { valid: true, message: `${fieldName} is valid` }
}

/**
 * Input validation - Text length
 */
export function validateTextLength(text, minLength = 0, maxLength = Infinity, fieldName = 'Text') {
  if (!text || typeof text !== 'string') {
    return { valid: false, message: `${fieldName} is required` }
  }
  
  const trimmed = text.trim()
  
  if (trimmed.length < minLength) {
    return { valid: false, message: `${fieldName} must be at least ${minLength} characters long` }
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, message: `${fieldName} must be less than ${maxLength} characters` }
  }
  
  return { valid: true, message: `${fieldName} is valid` }
}

/**
 * Input sanitization - Remove dangerous characters
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script keywords
}

/**
 * Input sanitization - Clean user input
 */
export function cleanUserInput(input) {
  if (typeof input !== 'string') return input
  
  return sanitizeInput(input)
    .replace(/\s+/g, ' ') // Merge multiple spaces
    .substring(0, 1000) // Limit length
}

/**
 * Content Security Policy - Check for dangerous content
 */
export function checkForDangerousContent(content) {
  if (typeof content !== 'string') return { safe: true, warnings: [] }
  
  const warnings = []
  const lowerContent = content.toLowerCase()
  
  // Check for XSS attack patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /<style/i
  ]
  
  xssPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      warnings.push('Potentially dangerous content detected')
    }
  })
  
  return {
    safe: warnings.length === 0,
    warnings
  }
}

/**
 * Data validation - Form data
 */
export function validateFormData(formData, rules) {
  const errors = {}
  
  for (const [field, value] of Object.entries(formData)) {
    const rule = rules[field]
    if (!rule) continue
    
    let result = { valid: true }
    
    // Validate based on rule type
    switch (rule.type) {
      case 'email':
        result = validateEmail(value)
        break
      case 'password':
        result = validatePassword(value)
        break
      case 'username':
        result = validateUsername(value)
        break
      case 'number':
        result = validateNumber(value, rule.min, rule.max, rule.label)
        break
      case 'text':
        result = validateTextLength(value, rule.minLength, rule.maxLength, rule.label)
        break
      case 'required':
        if (!value || value.trim() === '') {
          result = { valid: false, message: `${rule.label} is required` }
        }
        break
    }
    
    if (!result.valid) {
      errors[field] = result.message
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Secure storage - Safe localStorage operations
 */
export const secureStorage = {
  setItem(key, value) {
    try {
      const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value
      localStorage.setItem(key, JSON.stringify(sanitizedValue))
      return true
    } catch (error) {
      console.error('Secure storage error:', error)
      return false
    }
  },
  
  getItem(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Secure storage error:', error)
      return null
    }
  },
  
  removeItem(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Secure storage error:', error)
      return false
    }
  }
}

/**
 * Content Security Policy - Generate CSP headers
 */
export function generateCSP() {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }
}
