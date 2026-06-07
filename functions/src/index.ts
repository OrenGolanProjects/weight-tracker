import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// USDA API key stored in Secret Manager (set with:
//   firebase functions:secrets:set USDA_API_KEY)
const usdaApiKey = defineSecret('USDA_API_KEY');

// Reuse the admin app across warm invocations.
if (getApps().length === 0) {
  initializeApp();
}
const db = getFirestore();

// Allowed browser origins (the deployed PWA + local dev). Blocks drive-by
// cross-origin abuse from other sites while keeping the app working.
const ALLOWED_ORIGINS = [
  'https://weight-tracker-7e67f.web.app',
  'https://weight-tracker-7e67f.firebaseapp.com',
  /^http:\/\/localhost:\d+$/,
];

const MAX_QUERY_LEN = 100;
const USDA_TIMEOUT_MS = 8000;

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

// Cache key: nutrition values for a given food are effectively static, so we
// cache permanently and never call USDA again for the same query.
const cacheKey = (query: string): string =>
  query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 120) || 'unknown';

export const getNutrition = onRequest(
  {
    region: 'us-central1',
    memory: '256MiB',
    maxInstances: 2, // tiny app (<=5 users) — cap to avoid runaway cost
    secrets: [usdaApiKey],
    cors: ALLOWED_ORIGINS,
  },
  async (request, response) => {
    try {
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const { query } = request.body ?? {};

      // Validate input: must be a short non-empty string.
      if (typeof query !== 'string' || query.trim().length === 0) {
        response.status(400).json({ error: 'Query is required' });
        return;
      }
      if (query.length > MAX_QUERY_LEN) {
        response.status(400).json({ error: `Query must be <= ${MAX_QUERY_LEN} characters` });
        return;
      }

      const key = cacheKey(query);
      const cacheRef = db.collection('nutritionCache').doc(key);

      // Serve from cache when available (no USDA call, no cost).
      const cached = await cacheRef.get();
      if (cached.exists) {
        response.json(cached.data() as NutritionData);
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            pageSize: 1,
            dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
          }),
          signal: AbortSignal.timeout(USDA_TIMEOUT_MS),
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`USDA API error: ${apiResponse.status}`);
      }

      const data: USDASearchResponse = await apiResponse.json();

      let nutritionData: NutritionData;
      if (!data.foods || data.foods.length === 0) {
        nutritionData = { calories: 0, protein: 0, carbs: 0, fat: 0, found: false };
      } else {
        const food = data.foods[0];
        const nutrients = food.foodNutrients;
        const getNutrientValue = (nutrientId: number): number => {
          const nutrient = nutrients.find((n) => n.nutrientId === nutrientId);
          return nutrient ? Math.round(nutrient.value * 10) / 10 : 0;
        };
        nutritionData = {
          calories: getNutrientValue(NUTRIENT_IDS.ENERGY),
          protein: getNutrientValue(NUTRIENT_IDS.PROTEIN),
          carbs: getNutrientValue(NUTRIENT_IDS.CARBS),
          fat: getNutrientValue(NUTRIENT_IDS.FAT),
          found: true,
          foodName: food.description,
        };
      }

      // Persist to cache (fire-and-forget is fine, but await keeps it simple).
      await cacheRef.set(nutritionData);

      response.json(nutritionData);
    } catch (error) {
      console.error('Nutrition API error:', error);
      response.status(500).json({ error: 'Failed to fetch nutrition data' });
    }
  }
);
