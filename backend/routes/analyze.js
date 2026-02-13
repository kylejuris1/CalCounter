import { analyzeFoodImage } from '../services/openaiVision.js';
import { calculateMultipleFoodNutrition } from '../services/nutritionCalculator.js';

/**
 * Analyze food image endpoint
 * POST /api/analyze
 * Body: { imageUrl: string }
 */
export const analyzeFood = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    // Step 1: Analyze image with OpenAI Vision
    console.log('Analyzing image with OpenAI Vision...');
    const foodItems = await analyzeFoodImage(imageUrl);
    console.log('Food items identified:', foodItems);

    // Step 2: Calculate nutrition data for each food item using ChatGPT
    console.log('Calculating nutrition for food items...');
    const nutritionData = await calculateMultipleFoodNutrition(foodItems);
    console.log('Nutrition calculated:', nutritionData);

    res.json({
      success: true,
      data: {
        foodItems: nutritionData.items,
        totals: nutritionData.totals,
        imageUrl, // Image remains in S3 for user to view
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    next(error);
  }
};

