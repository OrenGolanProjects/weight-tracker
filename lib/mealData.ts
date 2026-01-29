// Diet plan data extracted from oren_menu.pdf

export interface FoodItem {
  hebrew: string;
  searchQuery: string; // English query for USDA API
}

export interface MealOption {
  proteins: FoodItem[];
  carbs: FoodItem;
}

export interface MealNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealTypeConfig {
  proteinCount: number; // How many proteins to select
  carbsCount: number; // How many carbs to select (always 1 for now)
  proteins: FoodItem[];
  carbs: FoodItem[];
}

export interface MealData {
  name: string;
  nameHebrew: string;
  estimatedNutrition: MealNutrition;
  options: MealTypeConfig[]; // Multiple options for meals like lunch
}

// ============ BREAKFAST PROTEINS (Light proteins) ============
const lightProteins: FoodItem[] = [
  { hebrew: '2 ביצים (רק חלמון אחד)', searchQuery: 'eggs whole 2 large' },
  { hebrew: '5 פרוסות פסטרמה דלת שומן', searchQuery: 'pastrami beef lean 100g' },
  { hebrew: 'חצי קופסת טונה בשמן', searchQuery: 'tuna canned in oil 85g' },
  { hebrew: 'קופסת טונה במים (סטארקיסט)', searchQuery: 'tuna canned in water 170g' },
  { hebrew: 'חצי קופסה גבינה לבנה/לאבנה/קוטג׳ 5%', searchQuery: 'cottage cheese 125g' },
  { hebrew: '⅔ קופסה גבינה לבנה/קוטג׳ 3%', searchQuery: 'cottage cheese low fat 170g' },
  { hebrew: '2 פרוסות גבינה צהובה 9%', searchQuery: 'cheese low fat slices 40g' },
  { hebrew: 'מעדן/שייק חלבון (~130 קלוריות)', searchQuery: 'protein shake 250ml' },
  { hebrew: 'כוס חלב/סויה (לדגני בוקר)', searchQuery: 'milk whole 240ml' },
];

// ============ BREAKFAST CARBS (Light carbs - smaller portions) ============
const lightCarbsBreakfast: FoodItem[] = [
  { hebrew: '3 פרוסות לחם קל דגנית', searchQuery: 'bread whole wheat light 75g' },
  { hebrew: '2 פרוסות לחם רגיל/מלא', searchQuery: 'bread whole wheat 60g' },
  { hebrew: '1.5 לחמניות קלות (100 קל׳ ליחידה)', searchQuery: 'bread roll whole wheat 75g' },
  { hebrew: '1.5 פיתות קלות (100 קל׳ ליחידה)', searchQuery: 'pita bread whole wheat 75g' },
  { hebrew: '1.5 טורטיות דלות', searchQuery: 'tortilla whole wheat 75g' },
  { hebrew: '5 פרכיות', searchQuery: 'rice cakes 45g' },
  { hebrew: 'חצי כוס שיבולת שועל', searchQuery: 'oatmeal dry 40g' },
  { hebrew: 'כוס פצפוצי אורז', searchQuery: 'puffed rice cereal 30g' },
  { hebrew: '8 קליליות', searchQuery: 'rice crackers 40g' },
  { hebrew: 'כוס קורנפלקס (תלמה/פיטנס/ברנפלקס)', searchQuery: 'corn flakes cereal 30g' },
];

// ============ LUNCH OPTION 2 CARBS (Light carbs - larger portions for lunch) ============
const lightCarbsLunch: FoodItem[] = [
  { hebrew: '4 פרוסות לחם רגיל או מלא', searchQuery: 'bread whole wheat 120g' },
  { hebrew: '5 פרוסות לחם קל דגנית', searchQuery: 'bread whole wheat light 125g' },
  { hebrew: 'לחמניה בינונית וחצי', searchQuery: 'bread roll 90g' },
  { hebrew: 'פיתה בינונית וחצי', searchQuery: 'pita bread 90g' },
  { hebrew: '3 פיתות/לחמניות קלות (100 קל׳ ליחידה)', searchQuery: 'pita bread light 150g' },
  { hebrew: '10 פרכיות', searchQuery: 'rice cakes 90g' },
  { hebrew: 'כוס שיבולת שועל קוואקר', searchQuery: 'oatmeal dry 80g' },
  { hebrew: '2 כוסות פצפוצי אורז', searchQuery: 'puffed rice cereal 60g' },
  { hebrew: '15 קליליות', searchQuery: 'rice crackers 75g' },
  { hebrew: '2 כוסות קורנפלקס (תלמה/פיטנס/ברנפלקס)', searchQuery: 'corn flakes cereal 60g' },
];

// ============ MAIN MEAL PROTEINS (Heavy proteins) ============
const heavyProteins: FoodItem[] = [
  { hebrew: '2.5 חתיכות בינוניות חזה עוף/הודו', searchQuery: 'chicken breast cooked 250g' },
  { hebrew: '1.5 קופסאות טונה בשמן', searchQuery: 'tuna canned in oil 255g' },
  { hebrew: '2 חתיכות בינוניות פרגית', searchQuery: 'chicken thigh boneless 200g' },
  { hebrew: '4 קציצות עוף בינוניות', searchQuery: 'chicken patty 240g' },
  { hebrew: 'חתיכת סלמון גדולה', searchQuery: 'salmon fillet cooked 200g' },
  { hebrew: '2 חתיכות דג אמנון גדולות', searchQuery: 'tilapia fillet cooked 250g' },
  { hebrew: '1.5 צלחות דג טונה', searchQuery: 'tuna steak cooked 225g' },
  { hebrew: '1.5 חתיכות גדולות סינטה', searchQuery: 'beef sirloin cooked 225g' },
  { hebrew: '2 חתיכות בינוניות שייטל', searchQuery: 'beef chuck cooked 200g' },
  { hebrew: '2 חתיכות בינוניות שניצל (לא מטוגן)', searchQuery: 'chicken schnitzel baked 200g' },
  { hebrew: '⅔ צלחת שווארמה הודו', searchQuery: 'turkey shawarma 200g' },
  { hebrew: '2 חתיכות בינוניות כרעיים', searchQuery: 'chicken drumstick cooked 200g' },
  { hebrew: '3 שוקיים עוף ללא עור', searchQuery: 'chicken leg skinless 270g' },
];

// ============ MAIN MEAL CARBS (Heavy carbs) ============
const heavyCarbs: FoodItem[] = [
  { hebrew: '2.5 כוסות אורז', searchQuery: 'rice white cooked 400g' },
  { hebrew: '1.5 כוסות פסטה', searchQuery: 'pasta cooked 240g' },
  { hebrew: '4 תפו״א/בטטה קטנות או 2.5 בינוניות', searchQuery: 'potato boiled 375g' },
  { hebrew: '2.5 כוסות כוסמת', searchQuery: 'buckwheat cooked 420g' },
  { hebrew: '2 כוסות קוסקוס', searchQuery: 'couscous cooked 320g' },
  { hebrew: '2.5 כוסות בורגול', searchQuery: 'bulgur cooked 420g' },
  { hebrew: '2 כוסות קינואה', searchQuery: 'quinoa cooked 340g' },
  { hebrew: '2 כוסות עדשים', searchQuery: 'lentils cooked 400g' },
  { hebrew: '2⅓ כוסות שעועית לבנה', searchQuery: 'white beans cooked 420g' },
  { hebrew: '1.5 כוסות גרגירי חומוס', searchQuery: 'chickpeas cooked 250g' },
  { hebrew: '1.5 כוסות פתיתים', searchQuery: 'israeli couscous cooked 250g' },
];

// ============ MEAL DEFINITIONS ============

export const breakfastData: MealData = {
  name: 'Breakfast',
  nameHebrew: 'ארוחת בוקר',
  estimatedNutrition: { calories: 374, protein: 29, carbs: 30, fat: 14 },
  options: [
    {
      proteinCount: 2,
      carbsCount: 1,
      proteins: lightProteins,
      carbs: lightCarbsBreakfast,
    },
  ],
};

export const lunchData: MealData = {
  name: 'Lunch',
  nameHebrew: 'ארוחת צהריים',
  estimatedNutrition: { calories: 623, protein: 69, carbs: 66, fat: 8 },
  options: [
    {
      // Option 1: Heavy meal - 1 main protein + 1 main carbs
      proteinCount: 1,
      carbsCount: 1,
      proteins: heavyProteins,
      carbs: heavyCarbs,
    },
    {
      // Option 2: Light meal style - 3 light proteins + 1 light carbs (larger portions)
      proteinCount: 3,
      carbsCount: 1,
      proteins: lightProteins,
      carbs: lightCarbsLunch,
    },
  ],
};

export const dinnerData: MealData = {
  name: 'Dinner',
  nameHebrew: 'ארוחת ערב',
  estimatedNutrition: { calories: 613, protein: 51, carbs: 66, fat: 16 },
  options: [
    {
      // Same as lunch option 1
      proteinCount: 1,
      carbsCount: 1,
      proteins: heavyProteins,
      carbs: heavyCarbs,
    },
    {
      // Same as lunch option 2
      proteinCount: 3,
      carbsCount: 1,
      proteins: lightProteins,
      carbs: lightCarbsLunch,
    },
  ],
};

// ============ HELPER FUNCTIONS ============

export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateMeal(config: MealTypeConfig): MealOption {
  return {
    proteins: getRandomItems(config.proteins, config.proteinCount),
    carbs: getRandomItem(config.carbs),
  };
}
