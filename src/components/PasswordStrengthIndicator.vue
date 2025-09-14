<template>
  <div class="password-strength-indicator" v-if="password">
    <div class="strength-bar">
      <div 
        class="strength-fill" 
        :class="strength.level"
        :style="{ width: `${(strength.score / 8) * 100}%` }"
      ></div>
    </div>
    <div class="strength-info">
      <span class="strength-level" :class="strength.level">
        {{ strength.level.toUpperCase() }}
      </span>
      <span class="strength-message">{{ strength.message }}</span>
    </div>
  </div>
</template>

<script>
import { getPasswordStrength } from '../lib/auth.js'

export default {
  name: 'PasswordStrengthIndicator',
  props: {
    password: {
      type: String,
      default: ''
    },
    showDetails: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    strength() {
      return getPasswordStrength(this.password)
    },
    checks() {
      return this.strength.checks
    }
  }
}
</script>

<style scoped>
.password-strength-indicator {
  margin-top: 8px;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-fill.weak {
  background-color: #f44336;
}

.strength-fill.fair {
  background-color: #ff9800;
}

.strength-fill.good {
  background-color: #4caf50;
}

.strength-fill.strong {
  background-color: #2e7d32;
}

.strength-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  margin-top: 12px;
}

.strength-level {
  font-weight: bold;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.strength-level.weak {
  color: #f44336;
}

.strength-level.fair {
  color: #ff9800;
}

.strength-level.good {
  color: #4caf50;
}

.strength-level.strong {
  color: #2e7d32;
}

.strength-message {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  max-width: 200px;
  text-align: right;
}

/* 简化的样式，只保留进度条和基本信息 */
</style>
