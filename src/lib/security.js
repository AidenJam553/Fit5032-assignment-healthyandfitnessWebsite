// 安全工具函数 - XSS防护、输入验证、数据清理

/**
 * XSS防护 - HTML转义
 * 防止恶意脚本注入
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
 * XSS防护 - 清理HTML内容
 * 移除所有HTML标签，只保留纯文本
 */
export function stripHtml(html) {
  if (typeof html !== 'string') return html
  
  const div = document.createElement('div')
  div.textContent = html
  return div.textContent || div.innerText || ''
}

/**
 * XSS防护 - 安全的HTML内容
 * 只允许安全的HTML标签和属性
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string') return html
  
  // 创建临时元素
  const div = document.createElement('div')
  div.innerHTML = html
  
  // 移除所有script标签
  const scripts = div.querySelectorAll('script')
  scripts.forEach(script => script.remove())
  
  // 移除所有事件处理器
  const allElements = div.querySelectorAll('*')
  allElements.forEach(el => {
    // 移除所有on*属性
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name)
      }
    })
  })
  
  return div.innerHTML
}

/**
 * 输入验证 - 邮箱格式
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email.trim())
}

/**
 * 输入验证 - 密码强度
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
 * 输入验证 - 用户名
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
  
  // 只允许字母、数字、下划线、连字符
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  if (!usernameRegex.test(trimmed)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' }
  }
  
  return { valid: true, message: 'Username is valid' }
}

/**
 * 输入验证 - 数字范围
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
 * 输入验证 - 文本长度
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
 * 输入清理 - 移除危险字符
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>]/g, '') // 移除尖括号
    .replace(/javascript:/gi, '') // 移除javascript:协议
    .replace(/on\w+=/gi, '') // 移除事件处理器
    .replace(/script/gi, '') // 移除script关键词
}

/**
 * 输入清理 - 清理用户输入
 */
export function cleanUserInput(input) {
  if (typeof input !== 'string') return input
  
  return sanitizeInput(input)
    .replace(/\s+/g, ' ') // 合并多个空格
    .substring(0, 1000) // 限制长度
}

/**
 * 内容安全策略 - 检查危险内容
 */
export function checkForDangerousContent(content) {
  if (typeof content !== 'string') return { safe: true, warnings: [] }
  
  const warnings = []
  const lowerContent = content.toLowerCase()
  
  // 检查XSS攻击模式
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
 * 数据验证 - 表单数据
 */
export function validateFormData(formData, rules) {
  const errors = {}
  
  for (const [field, value] of Object.entries(formData)) {
    const rule = rules[field]
    if (!rule) continue
    
    let result = { valid: true }
    
    // 根据规则类型进行验证
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
 * 安全存储 - 安全的localStorage操作
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
 * 内容安全策略 - 生成CSP头
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
