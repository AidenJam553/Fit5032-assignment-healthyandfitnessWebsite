// Gemini API Service for food recognition and nutrition analysis
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY'

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(API_KEY)

/**
 * Analyze food image and get nutrition information
 * @param {File} imageFile - The uploaded image file
 * @returns {Object} - Nutrition analysis and dietary advice
 */
export async function analyzeFoodImage(imageFile) {
  try {
    // Convert image to base64
    const imageData = await fileToGenerativePart(imageFile)
    
    // Use Gemini 2.5 Flash model (supports vision)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const prompt = `You are a professional nutritionist. Analyze this food image and provide:

1. **Food Items Identified**: List all the food items you can identify in the image
2. **Total Calories**: Estimate the total calories (in kcal)
3. **Macronutrients** (in grams):
   - Protein
   - Carbohydrates
   - Fat
4. **Micronutrients**: Key vitamins and minerals present
5. **Health Assessment**: Rate the meal as "Healthy", "Moderate", or "Unhealthy" with explanation
6. **Dietary Advice**: Provide 3-5 specific suggestions to improve this meal or balance the diet

Please format your response in JSON format:
{
  "foodItems": ["item1", "item2", ...],
  "calories": number,
  "macronutrients": {
    "protein": number,
    "carbs": number,
    "fat": number
  },
  "micronutrients": ["nutrient1", "nutrient2", ...],
  "healthRating": "Healthy/Moderate/Unhealthy",
  "healthExplanation": "explanation text",
  "dietaryAdvice": ["advice1", "advice2", ...]
}

Be specific with portion sizes and provide realistic estimates based on what you see in the image.`

    const result = await model.generateContent([prompt, imageData])
    const response = await result.response
    const text = response.text()
    
    // Try to parse JSON from response
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
      const jsonText = jsonMatch ? jsonMatch[1] : text
      
      const analysis = JSON.parse(jsonText)
      
      return {
        success: true,
        data: {
          foodItems: analysis.foodItems || [],
          calories: analysis.calories || 0,
          macronutrients: {
            protein: analysis.macronutrients?.protein || 0,
            carbs: analysis.macronutrients?.carbs || 0,
            fat: analysis.macronutrients?.fat || 0
          },
          micronutrients: analysis.micronutrients || [],
          healthRating: analysis.healthRating || 'Moderate',
          healthExplanation: analysis.healthExplanation || '',
          dietaryAdvice: analysis.dietaryAdvice || []
        },
        rawResponse: text
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON, returning raw text:', parseError)
      
      // Return a structured fallback
      return {
        success: true,
        data: {
          foodItems: ['Unable to parse food items'],
          calories: 0,
          macronutrients: { protein: 0, carbs: 0, fat: 0 },
          micronutrients: [],
          healthRating: 'Unknown',
          healthExplanation: 'Analysis completed but format was unexpected',
          dietaryAdvice: ['Please consult the raw analysis below']
        },
        rawResponse: text
      }
    }
  } catch (error) {
    console.error('Error analyzing food image:', error)
    return {
      success: false,
      error: error.message || 'Failed to analyze image',
      data: null
    }
  }
}

/**
 * Convert file to GenerativePart format for Gemini API
 * @param {File} file - The image file
 * @returns {Object} - GenerativePart object
 */
async function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1]
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      })
    }
    
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Get quick nutrition tips based on user goals
 * @param {string} goal - User's dietary goal (e.g., "lose weight", "gain muscle", "maintain")
 * @returns {Array} - Array of nutrition tips
 */
export async function getNutritionTips(goal = 'maintain') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const prompt = `As a nutritionist, provide 5 specific, actionable nutrition tips for someone who wants to "${goal}". 
    
Format as JSON array of strings:
["tip1", "tip2", "tip3", "tip4", "tip5"]`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    try {
      const jsonMatch = text.match(/\[([\s\S]*?)\]/)
      const jsonText = jsonMatch ? jsonMatch[0] : text
      const tips = JSON.parse(jsonText)
      return { success: true, tips }
    } catch (parseError) {
      // Return default tips if parsing fails
      return {
        success: true,
        tips: [
          'Eat a balanced diet with variety',
          'Stay hydrated throughout the day',
          'Control portion sizes',
          'Include plenty of vegetables',
          'Limit processed foods'
        ]
      }
    }
  } catch (error) {
    console.error('Error getting nutrition tips:', error)
    return {
      success: false,
      error: error.message,
      tips: []
    }
  }
}

