import axios from 'axios';

const FOOD_DATA_CENTRAL_API_URL = process.env.FOOD_DATA_CENTRAL_API_URL || 'https://api.nal.usda.gov/fdc/v1';
const API_KEY = process.env.FOOD_DATA_CENTRAL_API_KEY || ''; // Optional, public access available

/**
 * Search for food in FoodData Central (USDA)
 * @param {string} foodName - Name of the food to search for
 * @returns {Promise<Object>} Food nutrition data
 */
export async function searchFoodDataCentral(foodName) {
  try {
    console.log('=== FOODDATA CENTRAL SEARCH ===');
    console.log('Searching for:', foodName);
    console.log('API URL:', FOOD_DATA_CENTRAL_API_URL);
    console.log('API Key present:', !!API_KEY);
    
    // Build query string manually to avoid array serialization issues
    const params = new URLSearchParams();
    params.append('query', foodName);
    params.append('pageSize', '5');
    params.append('dataType', 'Foundation'); // Use single value instead of array
    params.append('sortBy', 'dataType.keyword');
    params.append('sortOrder', 'asc');
    
    if (API_KEY) {
      params.append('api_key', API_KEY);
    }

    console.log('Request params:', params.toString());
    
    const response = await axios.get(`${FOOD_DATA_CENTRAL_API_URL}/foods/search?${params.toString()}`, {
      timeout: 10000, // 10 second timeout
    });

    console.log('Response status:', response.status);
    console.log('Response data keys:', Object.keys(response.data || {}));
    console.log('Number of foods found:', response.data?.foods?.length || 0);

    if (response.data.foods && response.data.foods.length > 0) {
      const firstResult = response.data.foods[0];
      console.log('First result:', {
        fdcId: firstResult.fdcId,
        description: firstResult.description,
        dataType: firstResult.dataType,
      });
      // Return the first (most relevant) result
      return firstResult;
    }

    console.log('No foods found in FoodData Central');
    return null;
  } catch (error) {
    console.error('=== FOODDATA CENTRAL SEARCH ERROR ===');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Request details:', {
        url: error.config?.url,
        method: error.config?.method,
      });
    }
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to search food database: ${error.message}`);
  }
}

/**
 * Get detailed nutrition information for a specific food ID
 * @param {number} fdcId - FoodData Central ID
 * @returns {Promise<Object>} Detailed nutrition data
 */
export async function getFoodDetails(fdcId) {
  try {
    console.log('=== GETTING FOOD DETAILS ===');
    console.log('FDC ID:', fdcId);
    
    // Build query string manually
    const params = new URLSearchParams();
    if (API_KEY) {
      params.append('api_key', API_KEY);
    }

    const url = params.toString() 
      ? `${FOOD_DATA_CENTRAL_API_URL}/food/${fdcId}?${params.toString()}`
      : `${FOOD_DATA_CENTRAL_API_URL}/food/${fdcId}`;

    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
    });

    console.log('Food details retrieved successfully');
    console.log('Food name:', response.data?.description);
    console.log('Number of nutrients:', response.data?.foodNutrients?.length || 0);
    
    return response.data;
  } catch (error) {
    console.error('=== FOOD DETAILS ERROR ===');
    console.error('FDC ID:', fdcId);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received');
    }
    throw new Error(`Failed to get food details: ${error.message}`);
  }
}

/**
 * Extract nutrition values from FoodData Central food object
 * @param {Object} foodData - Food data from FoodData Central
 * @param {number} quantity - Quantity multiplier (e.g., 200g / 100g = 2)
 * @returns {Object} Nutrition values per item
 */
export function extractNutritionValues(foodData, quantity = 1) {
  const nutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  if (!foodData || !foodData.foodNutrients) {
    return nutrition;
  }

  // FoodData Central nutrient structure:
  // - nutrient ID is in nutrient.id (not nutrientId)
  // - value is in 'amount' field
  // - nutrient names are in nutrient.name
  
  // Nutrient matching strategy:
  // - Match by name first (most flexible, handles ID changes)
  // - Fall back to specific IDs if name matching doesn't work
  // - Prioritize kcal units over kJ
  
  // Known nutrient IDs (for fallback):
  // Energy: 1008, 2047, 2048 (various calculation methods)
  // Protein: 1003
  // Carbohydrate: 1005
  // Total lipid (fat): 1004

  foodData.foodNutrients.forEach((nutrient) => {
    const nutrientId = nutrient.nutrient?.id;
    const nutrientName = nutrient.nutrient?.name?.toLowerCase() || '';
    const value = nutrient.amount; // Value is in 'amount' field
    const unit = nutrient.nutrient?.unitName?.toLowerCase() || '';
    
    if (value === null || value === undefined) {
      return; // Skip nutrients without values
    }

    // ENERGY: Match by name first (handles ID changes), then by ID as fallback
    if (nutrientName.includes('energy') && unit === 'kcal') {
      // Prefer simple "Energy" over "Energy (Atwater...)" variants
      if (nutrientName === 'energy') {
        // Standard "Energy" - highest priority
        nutrition.calories = value * quantity;
      } else if (!nutrition.calories) {
        // Any other energy variant (Atwater, etc.) as fallback
        nutrition.calories = value * quantity;
      }
    } else if ((nutrientId === 1008 || nutrientId === 2047 || nutrientId === 2048) && unit === 'kcal') {
      // Fallback: match by known energy IDs if name matching didn't work
      if (!nutrition.calories) {
        nutrition.calories = value * quantity;
      }
    }
    
    // PROTEIN: Match by name first, then by ID
    if (nutrientName === 'protein') {
      // Standard "Protein" - highest priority
      nutrition.protein = value * quantity;
    } else if (nutrientName.includes('protein') && !nutrientName.includes('nitrogen') && !nutrition.protein) {
      // Other protein variants as fallback
      nutrition.protein = value * quantity;
    } else if (nutrientId === 1003 && !nutrition.protein) {
      // Fallback: match by ID if name matching didn't work
      nutrition.protein = value * quantity;
    }
    
    // CARBOHYDRATES: Match by name first, then by ID
    if (nutrientName === 'carbohydrate, by difference' || nutrientName === 'carbohydrate by difference') {
      // Standard "Carbohydrate, by difference" - highest priority (most accurate)
      nutrition.carbs = value * quantity;
    } else if (nutrientName.includes('carbohydrate') && nutrientName.includes('difference') && !nutrition.carbs) {
      // Other "by difference" variants
      nutrition.carbs = value * quantity;
    } else if (nutrientName === 'carbohydrate, by summation' || nutrientName === 'carbohydrate by summation') {
      // "By summation" as fallback if "by difference" not available
      if (!nutrition.carbs) {
        nutrition.carbs = value * quantity;
      }
    } else if (nutrientId === 1005 && !nutrition.carbs) {
      // Fallback: match by ID if name matching didn't work
      nutrition.carbs = value * quantity;
    }
    
    // FAT: Match by name first, then by ID
    if (nutrientName === 'total lipid (fat)' || nutrientName === 'total lipid' || nutrientName === 'total fat') {
      // Standard "Total lipid (fat)" - highest priority
      nutrition.fat = value * quantity;
    } else if ((nutrientName.includes('lipid') || nutrientName === 'fat') && 
               !nutrientName.includes('saturated') && 
               !nutrientName.includes('monounsaturated') && 
               !nutrientName.includes('polyunsaturated') && 
               !nutrientName.includes('trans') &&
               !nutrientName.includes('fatty acid') &&
               !nutrition.fat) {
      // Other total fat/lipid variants (excluding specific fatty acids)
      nutrition.fat = value * quantity;
    } else if (nutrientId === 1004 && !nutrition.fat) {
      // Fallback: match by ID if name matching didn't work
      nutrition.fat = value * quantity;
    }
  });

  // Ensure no negative values (safety check)
  return {
    calories: Math.max(0, nutrition.calories),
    protein: Math.max(0, nutrition.protein),
    carbs: Math.max(0, nutrition.carbs),
    fat: Math.max(0, nutrition.fat),
  };
}

/**
 * Calculate quantity multiplier based on portion size
 * @param {string} quantityString - Quantity string from AI (e.g., "200g", "1 cup")
 * @param {Object} foodData - Food data with serving size info
 * @returns {number} Multiplier for nutrition values
 */
export function calculateQuantityMultiplier(quantityString, foodData) {
  // Extract number and unit from quantity string
  const match = quantityString.match(/(\d+\.?\d*)\s*(g|kg|oz|lb|cup|cups|piece|pieces|serving|servings|ml|l|tbsp|tsp)?/i);
  
  if (!match) {
    return 1; // Default to 1 serving
  }

  const amount = parseFloat(match[1]);
  const unit = (match[2] || 'g').toLowerCase();

  // FoodData Central nutrition values are typically per 100g
  // So we'll convert everything to grams and divide by 100
  const baseServingSizeGrams = 100;

  // Convert quantity to grams
  let quantityGrams = amount;
  if (unit === 'kg') {
    quantityGrams = amount * 1000;
  } else if (unit === 'oz') {
    quantityGrams = amount * 28.35;
  } else if (unit === 'lb') {
    quantityGrams = amount * 453.592;
  } else if (unit === 'cup' || unit === 'cups') {
    // Approximate conversion - 1 cup ≈ 240g for most foods
    quantityGrams = amount * 240;
  } else if (unit === 'ml' || unit === 'l') {
    // For liquids, assume 1ml ≈ 1g (water-based)
    quantityGrams = unit === 'l' ? amount * 1000 : amount;
  } else if (unit === 'tbsp') {
    quantityGrams = amount * 15; // 1 tbsp ≈ 15g
  } else if (unit === 'tsp') {
    quantityGrams = amount * 5; // 1 tsp ≈ 5g
  } else if (unit === 'piece' || unit === 'pieces') {
    // For pieces, we'd need food-specific data
    // Default to estimating based on common sizes
    // This is a rough estimate - could be improved with food-specific data
    quantityGrams = amount * 50; // Assume ~50g per piece
  }

  // Calculate multiplier: quantity in grams / base serving size (100g)
  return quantityGrams / baseServingSizeGrams;
}

