<script setup>
import { ref } from 'vue'
import { analyzeFoodImage } from '@/lib/geminiService'
import Button from './Button.vue'

const emit = defineEmits(['analysis-complete'])

const selectedImage = ref(null)
const imagePreview = ref(null)
const analyzing = ref(false)
const analysisResult = ref(null)
const error = ref(null)
const fileInput = ref(null)

// Handle file selection
function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    if (!file.type.startsWith('image/')) {
      error.value = 'Please select an image file'
      return
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      error.value = 'Image size must be less than 10MB'
      return
    }
    
    selectedImage.value = file
    error.value = null
    analysisResult.value = null
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Trigger file input click
function selectImage() {
  fileInput.value.click()
}

// Analyze the selected image
async function analyzeImage() {
  if (!selectedImage.value) {
    error.value = 'Please select an image first'
    return
  }
  
  analyzing.value = true
  error.value = null
  
  try {
    const result = await analyzeFoodImage(selectedImage.value)
    
    if (result.success) {
      analysisResult.value = result.data
      emit('analysis-complete', result.data)
    } else {
      error.value = result.error || 'Failed to analyze image'
    }
  } catch (err) {
    console.error('Analysis error:', err)
    error.value = 'An error occurred during analysis'
  } finally {
    analyzing.value = false
  }
}

// Reset to initial state
function reset() {
  selectedImage.value = null
  imagePreview.value = null
  analysisResult.value = null
  error.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Get health rating color
function getHealthRatingColor(rating) {
  const colors = {
    'Healthy': '#10b981',
    'Moderate': '#f59e0b',
    'Unhealthy': '#ef4444'
  }
  return colors[rating] || '#6b7280'
}
</script>

<template>
  <div class="food-analyzer">
    <div class="analyzer-header">
      <h3 class="analyzer-title">
        <span class="title-icon">🍽️</span>
        AI Food Analyzer
      </h3>
      <p class="analyzer-subtitle">Upload a photo of your meal to get instant nutrition analysis</p>
    </div>

    <!-- File Input (Hidden) -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      @change="handleFileSelect"
      style="display: none"
    />

    <!-- Upload Section -->
    <div v-if="!imagePreview" class="upload-area" @click="selectImage">
      <div class="upload-icon">📸</div>
      <div class="upload-text">Take Photo or Upload Image</div>
      <div class="upload-hint">Tap to select an image from your device</div>
    </div>

    <!-- Image Preview & Analysis -->
    <div v-else class="analysis-container">
      <!-- Image Preview -->
      <div class="image-preview">
        <img :src="imagePreview" alt="Food image" />
        <button @click="reset" class="remove-btn" title="Remove image">×</button>
      </div>

      <!-- Analyze Button -->
      <Button
        v-if="!analysisResult"
        variant="primary"
        size="large"
        @click="analyzeImage"
        :disabled="analyzing"
        class="analyze-btn"
      >
        <span v-if="analyzing">
          <span class="spinner"></span>
          Analyzing...
        </span>
        <span v-else>🔍 Analyze Food</span>
      </Button>

      <!-- Analysis Results -->
      <div v-if="analysisResult" class="results">
        <!-- Food Items -->
        <div class="result-section">
          <h4 class="section-title">📋 Identified Foods</h4>
          <div class="food-items">
            <span v-for="(item, index) in analysisResult.foodItems" :key="index" class="food-tag">
              {{ item }}
            </span>
          </div>
        </div>

        <!-- Calories -->
        <div class="result-section calories-section">
          <div class="calories-display">
            <div class="calories-number">{{ analysisResult.calories }}</div>
            <div class="calories-label">kcal</div>
          </div>
        </div>

        <!-- Macronutrients -->
        <div class="result-section">
          <h4 class="section-title">⚡ Macronutrients</h4>
          <div class="macros-grid">
            <div class="macro-item">
              <div class="macro-label">Protein</div>
              <div class="macro-value">{{ analysisResult.macronutrients.protein }}g</div>
            </div>
            <div class="macro-item">
              <div class="macro-label">Carbs</div>
              <div class="macro-value">{{ analysisResult.macronutrients.carbs }}g</div>
            </div>
            <div class="macro-item">
              <div class="macro-label">Fat</div>
              <div class="macro-value">{{ analysisResult.macronutrients.fat }}g</div>
            </div>
          </div>
        </div>

        <!-- Micronutrients -->
        <div v-if="analysisResult.micronutrients.length > 0" class="result-section">
          <h4 class="section-title">💊 Key Nutrients</h4>
          <div class="nutrients-list">
            <span v-for="(nutrient, index) in analysisResult.micronutrients" :key="index" class="nutrient-tag">
              {{ nutrient }}
            </span>
          </div>
        </div>

        <!-- Health Assessment -->
        <div class="result-section">
          <h4 class="section-title">🎯 Health Assessment</h4>
          <div class="health-rating" :style="{ borderColor: getHealthRatingColor(analysisResult.healthRating) }">
            <div class="rating-badge" :style="{ backgroundColor: getHealthRatingColor(analysisResult.healthRating) }">
              {{ analysisResult.healthRating }}
            </div>
            <div class="rating-explanation">{{ analysisResult.healthExplanation }}</div>
          </div>
        </div>

        <!-- Dietary Advice -->
        <div class="result-section">
          <h4 class="section-title">💡 Dietary Advice</h4>
          <ul class="advice-list">
            <li v-for="(advice, index) in analysisResult.dietaryAdvice" :key="index">
              {{ advice }}
            </li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="result-actions">
          <Button variant="secondary" size="medium" @click="reset">
            📸 Analyze Another Meal
          </Button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      <span class="error-icon">⚠️</span>
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.food-analyzer {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.analyzer-header {
  margin-bottom: 20px;
  text-align: center;
}

.analyzer-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.title-icon {
  font-size: 1.8rem;
}

.analyzer-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* Upload Area */
.upload-area {
  border: 3px dashed #d1d5db;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9fafb;
}

.upload-area:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Analysis Container */
.analysis-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.image-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  max-height: 400px;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: scale(1.1);
}

.analyze-btn {
  width: 100%;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Results */
.results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

/* Food Items */
.food-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.food-tag {
  background: #10b981;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Calories */
.calories-section {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  text-align: center;
}

.calories-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.calories-number {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
}

.calories-label {
  font-size: 1.2rem;
  font-weight: 600;
  opacity: 0.9;
}

/* Macronutrients */
.macros-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.macro-item {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.macro-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.macro-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

/* Nutrients */
.nutrients-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.nutrient-tag {
  background: white;
  border: 1px solid #d1d5db;
  color: #1f2937;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Health Rating */
.health-rating {
  border: 2px solid;
  border-radius: 8px;
  padding: 16px;
  background: white;
}

.rating-badge {
  display: inline-block;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.rating-explanation {
  color: #4b5563;
  line-height: 1.6;
  font-size: 0.95rem;
}

/* Advice List */
.advice-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.advice-list li {
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #10b981;
  font-size: 0.9rem;
  line-height: 1.5;
}

.advice-list li:last-child {
  margin-bottom: 0;
}

/* Action Buttons */
.result-actions {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

/* Error Message */
.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  margin-top: 12px;
}

.error-icon {
  font-size: 1.2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .food-analyzer {
    padding: 20px 16px;
  }
  
  .macros-grid {
    grid-template-columns: 1fr;
  }
  
  .calories-number {
    font-size: 2.5rem;
  }
}
</style>




