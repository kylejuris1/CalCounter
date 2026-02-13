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
 * Analyze food image using OpenAI Vision API with depth perception considerations
 * @param {string} imageUrl - URL of the image to analyze
 * @returns {Promise<Object>} Analysis result with food items and quantities
 */
export async function analyzeFoodImage(imageUrl) {
  try {
    const openai = getOpenAIClient();
    
    const prompt = `Analyze this food image and identify all food items visible. For each item, provide:
1. Food name (be specific, e.g., "Grilled Salmon" not just "Salmon")
2. Estimated quantity/portion size (e.g., "200g", "1 cup", "2 pieces")
3. Visual description to help with nutrition lookup

IMPORTANT - Use depth perception and visual cues for accurate size estimation:
- Compare food items to common reference objects if visible (plates, utensils, hands, coins)
- Consider perspective and camera angle
- Estimate volume/weight based on visual appearance and depth cues
- Be conservative with estimates - it's better to underestimate than overestimate
- If you can see reference objects, use them for scale estimation

Return the response as a JSON array of objects with this structure:
[
  {
    "name": "Food item name",
    "quantity": "Estimated quantity with unit (e.g., '200g', '1.5 cups', '3 pieces')",
    "description": "Visual description including any depth cues or reference objects"
  }
]

Be as accurate as possible with portion sizes. If you can see multiple items, list them all.`;

    console.log('=== OPENAI VISION REQUEST ===');
    console.log('Image URL:', imageUrl);
    console.log('Model: gpt-4o');
    console.log('Max tokens: 1000');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    console.log('=== OPENAI RESPONSE RECEIVED ===');
    console.log('Response ID:', response.id);
    console.log('Model used:', response.model);
    console.log('Finish reason:', response.choices[0]?.finish_reason);
    console.log('Usage:', JSON.stringify(response.usage, null, 2));
    
    // Check if response has content
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('ERROR: Invalid response structure from OpenAI');
      console.error('Full response:', JSON.stringify(response, null, 2));
      throw new Error('OpenAI returned invalid response structure');
    }

    const content = response.choices[0].message.content;
    
    if (!content) {
      console.error('ERROR: OpenAI response has no content');
      console.error('Finish reason:', response.choices[0].finish_reason);
      console.error('Full response:', JSON.stringify(response, null, 2));
      throw new Error(`OpenAI response has no content. Finish reason: ${response.choices[0].finish_reason}`);
    }

    console.log('=== RAW OPENAI CONTENT ===');
    console.log('Content length:', content.length);
    console.log('Content preview (first 500 chars):', content.substring(0, 500));
    console.log('Full content:', content);
    
    // Try to parse JSON from the response
    // OpenAI might wrap JSON in markdown code blocks
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }

    console.log('=== PARSING JSON ===');
    console.log('Cleaned JSON content:', jsonContent);

    let foodItems;
    try {
      foodItems = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('=== JSON PARSE ERROR ===');
      console.error('Parse error:', parseError.message);
      console.error('Attempted to parse:', jsonContent);
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}. Raw content: ${content.substring(0, 200)}`);
    }

    console.log('=== VALIDATING RESPONSE FORMAT ===');
    console.log('Parsed foodItems type:', Array.isArray(foodItems) ? 'Array' : typeof foodItems);
    console.log('Food items count:', Array.isArray(foodItems) ? foodItems.length : 'N/A');
    
    // Validate response format
    if (!Array.isArray(foodItems)) {
      console.error('ERROR: OpenAI response is not an array');
      console.error('Received type:', typeof foodItems);
      console.error('Received value:', JSON.stringify(foodItems, null, 2));
      throw new Error(`OpenAI response is not an array. Received: ${typeof foodItems}`);
    }

    if (foodItems.length === 0) {
      console.warn('WARNING: OpenAI returned empty array - no food items identified');
    }

    // Validate each food item has required fields
    const invalidItems = [];
    foodItems.forEach((item, index) => {
      if (!item.name || !item.quantity) {
        invalidItems.push({ index, item, missing: [] });
        if (!item.name) invalidItems[invalidItems.length - 1].missing.push('name');
        if (!item.quantity) invalidItems[invalidItems.length - 1].missing.push('quantity');
      }
    });

    if (invalidItems.length > 0) {
      console.error('ERROR: Some food items are missing required fields');
      console.error('Invalid items:', JSON.stringify(invalidItems, null, 2));
      throw new Error(`Food items missing required fields: ${JSON.stringify(invalidItems)}`);
    }

    console.log('=== VALIDATION SUCCESSFUL ===');
    console.log('Food items:', JSON.stringify(foodItems, null, 2));
    
    return foodItems;
  } catch (error) {
    console.error('=== OPENAI VISION ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    // Re-throw with more context if it's our custom error
    if (error.message && error.message.includes('Failed to parse') || error.message.includes('not an array')) {
      throw error;
    }
    
    throw new Error(`Failed to analyze food image: ${error?.message || 'Unknown error'}`);
  }
}
