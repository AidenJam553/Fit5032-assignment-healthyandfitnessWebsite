<template>
  <component
    :is="tag"
    :class="buttonClasses"
    :disabled="disabled"
    :type="type"
    :to="to"
    @click="handleClick"
  >
    <svg v-if="icon && iconPosition === 'left'" class="btn-icon" :class="iconClass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path :d="iconPath" />
    </svg>
    <span v-if="$slots.default" class="btn-text">
      <slot></slot>
    </span>
    <svg v-if="icon && iconPosition === 'right'" class="btn-icon" :class="iconClass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path :d="iconPath" />
    </svg>
    <svg v-if="loading" class="btn-icon loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  rounded: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: null
  },
  iconPosition: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  },
  type: {
    type: String,
    default: 'button'
  },
  tag: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'a', 'router-link'].includes(value)
  },
  to: {
    type: [String, Object],
    default: null
  }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
  return [
    'btn',
    `btn-${props.variant}`,
    `btn-${props.size}`,
    {
      'btn-disabled': props.disabled,
      'btn-loading': props.loading,
      'btn-full-width': props.fullWidth,
      'btn-rounded': props.rounded
    }
  ]
})

const iconClass = computed(() => ({
  'btn-icon-left': props.iconPosition === 'left',
  'btn-icon-right': props.iconPosition === 'right'
}))

const iconPath = computed(() => {
  const iconMap = {
    'plus': 'M12 5v14m7-7H5',
    'edit': 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    'delete': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    'save': 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4',
    'cancel': 'M6 18L18 6M6 6l12 12',
    'arrow-left': 'M19 12H5m7-7l-7 7 7 7',
    'arrow-right': 'M5 12h14m-7-7l7 7-7 7',
    'check': 'M5 13l4 4L19 7',
    'x': 'M6 18L18 6M6 6l12 12',
    'heart': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    'star': 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    'search': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    'menu': 'M4 6h16M4 12h16M4 18h16',
    'close': 'M6 18L18 6M6 6l12 12',
    'user': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    'settings': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
  }
  return iconMap[props.icon] || ''
})

const handleClick = (event) => {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<style scoped>
/* 使用最高优先级层 */
@layer button-override {
  /* CSS Variables - 直接使用具体颜色值避免继承问题 */
:root {
  --primary-color: #16a34a;
  --primary-dark: #15803d;
  --text-white: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --shadow-sm: 0 2px 6px rgba(0,0,0,.08);
  --shadow-md: 0 6px 18px rgba(0,0,0,.08);
  --shadow-lg: 0 12px 30px rgba(0,0,0,.12);
}

/* Base Button Styles - 使用最高优先级 */
button.btn,
a.btn,
.btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  border: none !important;
  cursor: pointer !important;
  font-family: inherit !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  transition: all 0.2s ease !important;
  position: relative !important;
  overflow: hidden !important;
  white-space: nowrap !important;
  user-select: none !important;
  box-shadow: var(--shadow-md) !important;
  /* 默认样式 - 确保有背景色 */
  background: #16a34a !important;
  color: #ffffff !important;
  border: 2px solid #16a34a !important;
}

.btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3), var(--shadow-md);
}

/* Active状态 - 使用最高优先级 */
button.btn:active,
a.btn:active,
.btn:active {
  transform: translateY(1px) !important;
  box-shadow: none !important;
}

/* 默认hover状态 - 使用最高优先级 */
button.btn:hover:not(.btn-disabled):not(.btn-loading),
a.btn:hover:not(.btn-disabled):not(.btn-loading),
.btn:hover:not(.btn-disabled):not(.btn-loading) {
  background: #15803d !important;
  border-color: #15803d !important;
  color: #ffffff !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

/* Button Active States - 使用最高优先级选择器 */
button.btn.btn-primary:active,
a.btn.btn-primary:active,
.btn.btn-primary:active {
  background: #16a34a !important;
  color: #ffffff !important;
  border-color: #16a34a !important;
}

button.btn.btn-secondary:active,
a.btn.btn-secondary:active,
.btn.btn-secondary:active {
  background: #ffffff !important;
  color: #0f172a !important;
  border-color: #e2e8f0 !important;
}

/* Button Variants - 使用最高优先级选择器 */
button.btn.btn-primary,
a.btn.btn-primary,
.btn.btn-primary {
  background: #16a34a !important;
  color: #ffffff !important;
  border: 2px solid #16a34a !important;
}

button.btn.btn-primary:hover:not(.btn-disabled):not(.btn-loading),
a.btn.btn-primary:hover:not(.btn-disabled):not(.btn-loading),
.btn.btn-primary:hover:not(.btn-disabled):not(.btn-loading) {
  background: #15803d !important;
  border-color: #15803d !important;
  color: #ffffff !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

button.btn.btn-secondary,
a.btn.btn-secondary,
.btn.btn-secondary {
  background: #ffffff !important;
  color: #0f172a !important;
  border: 2px solid #e2e8f0 !important;
}

button.btn.btn-secondary:hover:not(.btn-disabled):not(.btn-loading),
a.btn.btn-secondary:hover:not(.btn-disabled):not(.btn-loading),
.btn.btn-secondary:hover:not(.btn-disabled):not(.btn-loading) {
  background: #f9fafb !important;
  border-color: #16a34a !important;
  color: #16a34a !important;
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-lg) !important;
}

/* Button Sizes */
.btn-small {
  padding: 8px 16px;
  font-size: var(--font-size-sm);
  border-radius: var(--radius-sm);
  min-height: 32px;
}

.btn-medium {
  padding: 12px 24px;
  font-size: var(--font-size-base);
  border-radius: var(--radius-sm);
  min-height: 44px;
}

.btn-large {
  padding: 16px 32px;
  font-size: var(--font-size-lg);
  border-radius: var(--radius-md);
  min-height: 52px;
}

/* Button States */
.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: var(--shadow-sm) !important;
}

.btn-loading {
  cursor: wait;
}

.btn-full-width {
  width: 100%;
}

.btn-rounded {
  border-radius: 50px;
}

/* Icon Styles */
.btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn-icon-left {
  margin-right: 4px;
}

.btn-icon-right {
  margin-left: 4px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .btn-medium {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
  
  .btn-large {
    padding: 14px 28px;
    font-size: 1rem;
  }
}
} /* 结束 @layer button-override */
</style>
