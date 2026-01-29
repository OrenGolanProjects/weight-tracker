import { onRequest } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';

// Define the USDA API key as a secret/config parameter
const usdaApiKey = defineString('USDA_API_KEY');

interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: USDANutrient[];
}

interface USDASearchResponse {
  foods: USDAFood[];
  totalHits: number;
}

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  found: boolean;
  foodName?: string;
}

// Nutrient IDs in USDA database
const NUTRIENT_IDS = {
  ENERGY: 1008, // kcal
  PROTEIN: 1003,
  CARBS: 1005,
  FAT: 1004,
};

export const getNutrition = onRequest(
  { cors: true, region: 'us-central1' },
  async (request, response) => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const { query } = request.body;

      if (!query) {
        response.status(400).json({ error: 'Query is required' });
        return;
      }

      const apiKey = usdaApiKey.value();

      if (!apiKey) {
        response.status(500).json({ error: 'USDA API key not configured' });
        return;
      }

      const apiResponse = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            pageSize: 1,
            dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
          }),
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`USDA API error: ${apiResponse.status}`);
      }

      const data: USDASearchResponse = await apiResponse.json();

      if (!data.foods || data.foods.length === 0) {
        response.json({
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          found: false,
        } as NutritionData);
        return;
      }

      const food = data.foods[0];
      const nutrients = food.foodNutrients;

      const getNutrientValue = (nutrientId: number): number => {
        const nutrient = nutrients.find((n) => n.nutrientId === nutrientId);
        return nutrient ? Math.round(nutrient.value * 10) / 10 : 0;
      };

      const nutritionData: NutritionData = {
        calories: getNutrientValue(NUTRIENT_IDS.ENERGY),
        protein: getNutrientValue(NUTRIENT_IDS.PROTEIN),
        carbs: getNutrientValue(NUTRIENT_IDS.CARBS),
        fat: getNutrientValue(NUTRIENT_IDS.FAT),
        found: true,
        foodName: food.description,
      };

      response.json(nutritionData);
    } catch (error) {
      console.error('Nutrition API error:', error);
      response.status(500).json({ error: 'Failed to fetch nutrition data' });
    }
  }
);
