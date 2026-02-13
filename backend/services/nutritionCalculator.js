import OpenAI from 'openai';

// Lazy initialization - only create client when needed
let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set. Make sure .env file is loaded.');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Calculate nutrition for a food item using ChatGPT
 * @param {Object} foodItem - Food item from OpenAI analysis
 * @returns {Promise<Object>} Nutrition data for the food item
 */
export async function calculateFoodNutrition(foodItem) {
  console.log('=== CALCULATING FOOD NUTRITION ===');
  console.log('Food item:', foodItem.name, foodItem.quantity);
  
  // Use ChatGPT for nutrition estimation
  return await estimateNutritionWithChatGPT(foodItem);
}

/**
 * Estimate nutrition using ChatGPT
 * @param {Object} foodItem - Food item from OpenAI analysis
 * @returns {Promise<Object>} Estimated nutrition data
 */
async function estimateNutritionWithChatGPT(foodItem) {
  try {
    const openai = getOpenAIClient();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition expert. Provide accurate nutrition estimates based on food names and quantities. Calculate the total nutrition for the specified quantity, not per serving.',
        },
        {
          role: 'user',
          content: `Estimate the total nutrition information for: ${foodItem.name}, quantity: ${foodItem.quantity}. 
          
IMPORTANT: Calculate the TOTAL nutrition for the entire quantity specified (e.g., if quantity is "200g", provide nutrition for 200g, not per 100g).

Return ONLY a JSON object with this exact structure:
{
  "calories": number,
  "protein": number (in grams),
  "carbs": number (in grams),
  "fat": number (in grams)
}

Be as accurate as possible based on standard nutrition data for this food item and quantity.`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 200,
    });

    console.log('=== CHATGPT NUTRITION ESTIMATION RESPONSE ===');
    console.log('Food item:', foodItem.name, foodItem.quantity);
    
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('ERROR: Invalid ChatGPT response structure');
      throw new Error('ChatGPT returned invalid response structure');
    }

    const content = response.choices[0].message.content;
    
    if (!content) {
      console.error('ERROR: ChatGPT response has no content');
      throw new Error('ChatGPT response has no content');
    }

    console.log('Raw ChatGPT content:', content);
    
    // Remove markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }

    console.log('Cleaned JSON content:', jsonContent);
    
    let nutrition;
    try {
      nutrition = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('ERROR: Failed to parse ChatGPT response as JSON');
      console.error('Parse error:', parseError.message);
      console.error('Attempted to parse:', jsonContent);
      throw new Error(`Failed to parse ChatGPT response as JSON: ${parseError.message}`);
    }

    // Validate nutrition object has required fields
    if (!nutrition || typeof nutrition !== 'object') {
      console.error('ERROR: ChatGPT response is not a valid object');
      throw new Error('ChatGPT response is not a valid nutrition object');
    }

    console.log('Parsed nutrition:', JSON.stringify(nutrition, null, 2));

    return {
      name: foodItem.name,
      quantity: foodItem.quantity,
      calories: nutrition.calories || 0,
      protein: nutrition.protein || 0,
      carbs: nutrition.carbs || 0,
      fat: nutrition.fat || 0,
      source: 'ChatGPT Estimation',
    };
  } catch (error) {
    console.error('Error estimating nutrition with ChatGPT:', error);
    // Return zero values if estimation fails
    return {
      name: foodItem.name,
      quantity: foodItem.quantity,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      source: 'Estimation Failed',
      note: 'Could not estimate nutrition values',
    };
  }
}

/**
 * Calculate nutrition for multiple food items
 * @param {Array<Object>} foodItems - Array of food items from OpenAI
 * @returns {Promise<Array<Object>>} Array of nutrition data
 */
export async function calculateMultipleFoodNutrition(foodItems) {
  const results = await Promise.all(
    foodItems.map((item) => calculateFoodNutrition(item))
  );

  // Calculate totals
  const totals = results.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fat: acc.fat + (item.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    items: results,
    totals,
  };
}
