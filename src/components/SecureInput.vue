<template>
  <div class="secure-input">
    <label v-if="label" class="secure-input__label" :for="inputId">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    
    <div class="secure-input__container">
      <input
        :id="inputId"
        :type="inputType"
        :value="displayValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :maxlength="maxLength"
        class="secure-input__field"
        :class="{ 'error': hasError, 'success': isValid }"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      
      <div v-if="showStrength && type === 'password'" class="password-strength">
        <div class="strength-bar">
          <div 
            class="strength-fill" 
            :class="strengthLevel"
            :style="{ width: strengthPercentage + '%' }"
          ></div>
        </div>
        <span class="strength-text">{{ strengthMessage }}</span>
      </div>
    </div>
    
    <div v-if="hasError" class="secure-input__error">
      {{ errorMessage }}
    </div>
    
    <div v-if="helpText && !hasError" class="secure-input__help">
      {{ helpText }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { 
  escapeHtml, 
  sanitizeInput, 
  validateEmail, 
  validatePassword, 
  validateUsername,
  validateTextLength,
  checkForDangerousContent
} from '@/lib/security'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'email', 'password', 'number', 'tel', 'url'].includes(value)
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  maxLength: {
    type: Number,
    default: 1000
  },
  minLength: {
    type: Number,
    default: 0
  },
  showStrength: {
    type: Boolean,
    default: false
  },
  validationRules: {
    type: Object,
    default: () => ({})
  },
  helpText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'validation-change', 'focus', 'blur'])

// 内部状态
const inputId = ref(`secure-input-${Math.random().toString(36).substr(2, 9)}`)
const isFocused = ref(false)
const hasBeenBlurred = ref(false)
const internalValue = ref(props.modelValue)

// 计算属性
const displayValue = computed(() => {
  // 对于密码类型，不显示实际值
  if (props.type === 'password') {
    return internalValue.value
  }
  // 对于其他类型，进行HTML转义
  return escapeHtml(internalValue.value)
})

const hasError = computed(() => {
  return hasBeenBlurred.value && !isValid.value
})

const errorMessage = computed(() => {
  if (!hasBeenBlurred.value) return ''
  
  const validation = validateInput()
  return validation.message || ''
})

const isValid = computed(() => {
  const validation = validateInput()
  return validation.valid
})

// 密码强度计算
const strengthLevel = computed(() => {
  if (props.type !== 'password' || !props.showStrength) return ''
  
  const validation = validatePassword(internalValue.value)
  if (!validation.valid) return 'weak'
  
  const score = calculatePasswordScore(internalValue.value)
  if (score >= 4) return 'strong'
  if (score >= 2) return 'medium'
  return 'weak'
})

const strengthPercentage = computed(() => {
  if (props.type !== 'password' || !props.showStrength) return 0
  
  const score = calculatePasswordScore(internalValue.value)
  return (score / 5) * 100
})

const strengthMessage = computed(() => {
  if (props.type !== 'password' || !props.showStrength) return ''
  
  const validation = validatePassword(internalValue.value)
  return validation.message
})

// 方法
function validateInput() {
  const value = internalValue.value
  
  // 检查危险内容
  const dangerCheck = checkForDangerousContent(value)
  if (!dangerCheck.safe) {
    return { valid: false, message: 'Potentially dangerous content detected' }
  }
  
  // 根据类型进行验证
  switch (props.type) {
    case 'email':
      return validateEmail(value) ? { valid: true } : { valid: false, message: 'Invalid email format' }
    
    case 'password':
      return validatePassword(value)
    
    case 'text':
      if (props.label?.toLowerCase().includes('username')) {
        return validateUsername(value)
      }
      return validateTextLength(value, props.minLength, props.maxLength, props.label || 'Text')
    
    case 'number':
      const num = Number(value)
      if (isNaN(num)) {
        return { valid: false, message: 'Must be a valid number' }
      }
      return { valid: true }
    
    default:
      if (props.required && (!value || value.trim() === '')) {
        return { valid: false, message: 'This field is required' }
      }
      return { valid: true }
  }
}

function calculatePasswordScore(password) {
  if (!password) return 0
  
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++
  
  return score
}

function handleInput(event) {
  let value = event.target.value
  
  // 清理输入
  value = sanitizeInput(value)
  
  // 限制长度
  if (value.length > props.maxLength) {
    value = value.substring(0, props.maxLength)
  }
  
  internalValue.value = value
  emit('update:modelValue', value)
  emit('validation-change', { valid: isValid.value, message: errorMessage.value })
}

function handleFocus(event) {
  isFocused.value = true
  emit('focus', event)
}

function handleBlur(event) {
  isFocused.value = false
  hasBeenBlurred.value = true
  emit('blur', event)
  emit('validation-change', { valid: isValid.value, message: errorMessage.value })
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue || ''
})

// 监听验证状态变化
watch(isValid, (newValid) => {
  emit('validation-change', { valid: newValid, message: errorMessage.value })
})
</script>

<style scoped>
.secure-input {
  margin-bottom: 16px;
}

.secure-input__label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.secure-input__container {
  position: relative;
}

.secure-input__field {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
  background: white;
}

.secure-input__field:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.secure-input__field.error {
  border-color: #ef4444;
}

.secure-input__field.error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.secure-input__field.success {
  border-color: #10b981;
}

.secure-input__field:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.password-strength {
  margin-top: 8px;
}

.strength-bar {
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-fill.weak {
  background-color: #ef4444;
}

.strength-fill.medium {
  background-color: #f59e0b;
}

.strength-fill.strong {
  background-color: #10b981;
}

.strength-text {
  font-size: 12px;
  color: #6b7280;
}

.secure-input__error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.secure-input__error::before {
  content: '⚠';
  font-size: 14px;
}

.secure-input__help {
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .secure-input__field {
    font-size: 16px; /* 防止iOS缩放 */
  }
}
</style>
