<template>
  <div 
    :class="[
      'card',
      `card--${variant}`,
      `card--${size}`,
      { 'card--clickable': clickable, 'card--hover': hover }
    ]"
    @click="handleClick"
  >
    <!-- Card Header -->
    <div v-if="$slots.header || title" class="card__header">
      <slot name="header">
        <h3 v-if="title" class="card__title">{{ title }}</h3>
        <p v-if="subtitle" class="card__subtitle">{{ subtitle }}</p>
      </slot>
    </div>

    <!-- Card Content -->
    <div class="card__content">
      <slot></slot>
    </div>

    <!-- Card Footer -->
    <div v-if="$slots.footer" class="card__footer">
      <slot name="footer"></slot>
    </div>

    <!-- Card Actions -->
    <div v-if="$slots.actions" class="card__actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Card variants
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'elevated', 'outlined', 'filled', 'post', 'sidebar', 'stats'].includes(value)
  },
  
  // Card sizes
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'xl'].includes(value)
  },
  
  // Card content
  title: {
    type: String,
    default: ''
  },
  
  subtitle: {
    type: String,
    default: ''
  },
  
  // Interactive properties
  clickable: {
    type: Boolean,
    default: false
  },
  
  hover: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* Base Card Styles */
.card {
  background: white;
  border-radius: 20px;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 8px 20px -5px rgba(0, 0, 0, 0.08), 0 3px 6px -2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Card Variants */
.card--default {
  background: white;
  border: 1px solid var(--border-color, #e2e8f0);
}

.card--elevated {
  background: white;
  border: none;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.card--outlined {
  background: transparent;
  border: 2px solid var(--primary-color, #22c55e);
  box-shadow: none;
}

.card--filled {
  background: var(--secondary-color, #f1f5f9);
  border: 1px solid var(--border-color, #e2e8f0);
}

.card--post {
  background: white;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 8px 20px -5px rgba(0, 0, 0, 0.08), 0 3px 6px -2px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.card--post::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color, #22c55e), #16a34a, #059669);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card--sidebar {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color, #e2e8f0);
}

.card--stats {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color, #e2e8f0);
  text-align: center;
}

/* Card Sizes */
.card--small {
  padding: 16px;
  border-radius: 12px;
}

.card--medium {
  padding: 24px;
  border-radius: 16px;
}

.card--large {
  padding: 32px;
  border-radius: 20px;
}

.card--xl {
  padding: 40px;
  border-radius: 24px;
}

/* Card Structure */
.card__header {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.card__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.card__subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary, #64748b);
  margin: 0;
  line-height: 1.5;
}

.card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card__footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.card__actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* Interactive States */
.card--clickable {
  cursor: pointer;
}

.card--hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color, #22c55e);
}

.card--post:hover::before {
  opacity: 1;
}

.card--sidebar:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -3px rgba(0, 0, 0, 0.1);
}

.card--stats:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  background: linear-gradient(135deg, var(--green-100, #dcfce7), #e8f5e8);
}

/* Responsive Design */
@media (max-width: 768px) {
  .card--small {
    padding: 12px;
    border-radius: 8px;
  }
  
  .card--medium {
    padding: 16px;
    border-radius: 12px;
  }
  
  .card--large {
    padding: 20px;
    border-radius: 16px;
  }
  
  .card--xl {
    padding: 24px;
    border-radius: 20px;
  }
  
  .card--sidebar {
    padding: 20px;
    border-radius: 16px;
  }
  
  .card__title {
    font-size: 1.125rem;
  }
}

@media (max-width: 480px) {
  .card--small {
    padding: 10px;
  }
  
  .card--medium {
    padding: 14px;
  }
  
  .card--large {
    padding: 16px;
  }
  
  .card--xl {
    padding: 20px;
  }
  
  .card--sidebar {
    padding: 16px;
  }
}
</style>

