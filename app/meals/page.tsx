'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CasinoIcon from '@mui/icons-material/Casino';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import {
  breakfastData,
  lunchData,
  dinnerData,
  getRandomItem,
  MealData,
  MealOption,
  MealNutrition,
  FoodItem,
  MealTypeConfig,
} from '@/lib/mealData';

type MealType = 'breakfast' | 'lunch' | 'dinner';

interface GeneratedMeal {
  type: MealType;
  data: MealData;
  optionIndex: number;
  option: MealOption;
  nutrition: MealNutrition | null;
  isLoading: boolean;
  error?: string;
}

interface LockState {
  proteins: boolean[]; // Lock state for each protein slot
  carbs: boolean;
}

// Firebase Function URL for nutrition data
const NUTRITION_API_URL =
  process.env.NEXT_PUBLIC_NUTRITION_API_URL ||
  'https://us-central1-weight-tracker-7e67f.cloudfunctions.net/getNutrition';

async function fetchNutrition(query: string): Promise<MealNutrition | null> {
  try {
    const response = await fetch(NUTRITION_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch nutrition');
    }

    const data = await response.json();
    if (data.found) {
      return {
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function MealsPage() {
  const router = useRouter();
  const [generatedMeal, setGeneratedMeal] = useState<GeneratedMeal | null>(null);
  const [locks, setLocks] = useState<LockState>({ proteins: [], carbs: false });
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);

  const getMealData = (type: MealType): MealData => {
    switch (type) {
      case 'breakfast':
        return breakfastData;
      case 'lunch':
        return lunchData;
      case 'dinner':
        return dinnerData;
    }
  };

  const getCurrentConfig = (): MealTypeConfig | null => {
    if (!selectedMealType) return null;
    const mealData = getMealData(selectedMealType);
    return mealData.options[selectedOptionIndex] || mealData.options[0];
  };

  const handleGenerateMeal = async (type: MealType, optionIdx?: number) => {
    const mealData = getMealData(type);
    const optionIndex = optionIdx ?? selectedOptionIndex;
    const config = mealData.options[optionIndex] || mealData.options[0];

    // If changing meal type or option, reset locks
    if (selectedMealType !== type || selectedOptionIndex !== optionIndex) {
      setLocks({ proteins: new Array(config.proteinCount).fill(false), carbs: false });
    }
    setSelectedMealType(type);
    setSelectedOptionIndex(optionIndex);

    // Generate new options, respecting locks
    const newProteins: FoodItem[] = [];
    for (let i = 0; i < config.proteinCount; i++) {
      if (
        generatedMeal &&
        selectedMealType === type &&
        selectedOptionIndex === optionIndex &&
        locks.proteins[i] &&
        generatedMeal.option.proteins[i]
      ) {
        newProteins.push(generatedMeal.option.proteins[i]);
      } else {
        // Get a random protein that's not already selected
        const availableProteins = config.proteins.filter(
          (p) => !newProteins.some((np) => np.hebrew === p.hebrew)
        );
        newProteins.push(
          getRandomItem(availableProteins.length > 0 ? availableProteins : config.proteins)
        );
      }
    }

    let newCarbs: FoodItem;
    if (
      generatedMeal &&
      selectedMealType === type &&
      selectedOptionIndex === optionIndex &&
      locks.carbs
    ) {
      newCarbs = generatedMeal.option.carbs;
    } else {
      newCarbs = getRandomItem(config.carbs);
    }

    const option: MealOption = {
      proteins: newProteins,
      carbs: newCarbs,
    };

    // Set initial state with loading
    setGeneratedMeal({
      type,
      data: mealData,
      optionIndex,
      option,
      nutrition: null,
      isLoading: true,
    });

    // Fetch nutrition data for all proteins and carbs
    try {
      const proteinPromises = option.proteins.map((p) => fetchNutrition(p.searchQuery));
      const carbsPromise = fetchNutrition(option.carbs.searchQuery);

      const [proteinResults, carbsNutrition] = await Promise.all([
        Promise.all(proteinPromises),
        carbsPromise,
      ]);

      let totalNutrition: MealNutrition | null = null;

      const validProteinResults = proteinResults.filter((r) => r !== null) as MealNutrition[];
      if (validProteinResults.length > 0 && carbsNutrition) {
        const proteinTotals = validProteinResults.reduce(
          (acc, curr) => ({
            calories: acc.calories + curr.calories,
            protein: acc.protein + curr.protein,
            carbs: acc.carbs + curr.carbs,
            fat: acc.fat + curr.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        totalNutrition = {
          calories: Math.round(proteinTotals.calories + carbsNutrition.calories),
          protein: Math.round(proteinTotals.protein + carbsNutrition.protein),
          carbs: Math.round(proteinTotals.carbs + carbsNutrition.carbs),
          fat: Math.round(proteinTotals.fat + carbsNutrition.fat),
        };
      }

      setGeneratedMeal((prev) =>
        prev
          ? {
              ...prev,
              nutrition: totalNutrition,
              isLoading: false,
              error: totalNutrition ? undefined : 'Could not fetch nutrition data',
            }
          : null
      );
    } catch {
      setGeneratedMeal((prev) =>
        prev
          ? {
              ...prev,
              isLoading: false,
              error: 'Failed to fetch nutrition data',
            }
          : null
      );
    }
  };

  const toggleProteinLock = (index: number) => {
    setLocks((prev) => {
      const newProteins = [...prev.proteins];
      newProteins[index] = !newProteins[index];
      return { ...prev, proteins: newProteins };
    });
  };

  const toggleCarbsLock = () => {
    setLocks((prev) => ({ ...prev, carbs: !prev.carbs }));
  };

  const selectProtein = async (index: number, item: FoodItem) => {
    if (!generatedMeal || !selectedMealType) return;

    const newProteins = [...generatedMeal.option.proteins];
    newProteins[index] = item;

    const newOption: MealOption = {
      proteins: newProteins,
      carbs: generatedMeal.option.carbs,
    };

    await updateMealWithOption(newOption);
  };

  const selectCarbs = async (item: FoodItem) => {
    if (!generatedMeal || !selectedMealType) return;

    const newOption: MealOption = {
      proteins: generatedMeal.option.proteins,
      carbs: item,
    };

    await updateMealWithOption(newOption);
  };

  const updateMealWithOption = async (newOption: MealOption) => {
    if (!generatedMeal) return;

    setGeneratedMeal({
      ...generatedMeal,
      option: newOption,
      nutrition: null,
      isLoading: true,
    });

    try {
      const proteinPromises = newOption.proteins.map((p) => fetchNutrition(p.searchQuery));
      const carbsPromise = fetchNutrition(newOption.carbs.searchQuery);

      const [proteinResults, carbsNutrition] = await Promise.all([
        Promise.all(proteinPromises),
        carbsPromise,
      ]);

      let totalNutrition: MealNutrition | null = null;

      const validProteinResults = proteinResults.filter((r) => r !== null) as MealNutrition[];
      if (validProteinResults.length > 0 && carbsNutrition) {
        const proteinTotals = validProteinResults.reduce(
          (acc, curr) => ({
            calories: acc.calories + curr.calories,
            protein: acc.protein + curr.protein,
            carbs: acc.carbs + curr.carbs,
            fat: acc.fat + curr.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        totalNutrition = {
          calories: Math.round(proteinTotals.calories + carbsNutrition.calories),
          protein: Math.round(proteinTotals.protein + carbsNutrition.protein),
          carbs: Math.round(proteinTotals.carbs + carbsNutrition.carbs),
          fat: Math.round(proteinTotals.fat + carbsNutrition.fat),
        };
      }

      setGeneratedMeal((prev) =>
        prev
          ? {
              ...prev,
              nutrition: totalNutrition,
              isLoading: false,
              error: totalNutrition ? undefined : 'Could not fetch nutrition data',
            }
          : null
      );
    } catch {
      setGeneratedMeal((prev) =>
        prev
          ? {
              ...prev,
              isLoading: false,
              error: 'Failed to fetch nutrition data',
            }
          : null
      );
    }
  };

  const handleOptionChange = (_: React.MouseEvent<HTMLElement>, newOption: number | null) => {
    if (newOption !== null && selectedMealType) {
      setSelectedOptionIndex(newOption);
      handleGenerateMeal(selectedMealType, newOption);
    }
  };

  const getMealIcon = (type: MealType) => {
    switch (type) {
      case 'breakfast':
        return <FreeBreakfastIcon sx={{ fontSize: 40 }} />;
      case 'lunch':
        return <LunchDiningIcon sx={{ fontSize: 40 }} />;
      case 'dinner':
        return <DinnerDiningIcon sx={{ fontSize: 40 }} />;
    }
  };

  const getMealColor = (type: MealType): 'warning' | 'success' | 'info' => {
    switch (type) {
      case 'breakfast':
        return 'warning';
      case 'lunch':
        return 'success';
      case 'dinner':
        return 'info';
    }
  };

  const getNutritionToDisplay = (): MealNutrition => {
    if (generatedMeal?.nutrition) {
      return generatedMeal.nutrition;
    }
    return generatedMeal?.data.estimatedNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  };

  const currentConfig = getCurrentConfig();
  const hasMultipleOptions = selectedMealType && getMealData(selectedMealType).options.length > 1;

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <RestaurantIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meal Generator
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Generate Your Meal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Click a button to randomly generate a meal. Use locks to keep items you like.
          </Typography>
        </Box>

        {/* Generate Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 4 }}
          justifyContent="center"
        >
          <Button
            variant={selectedMealType === 'breakfast' ? 'contained' : 'outlined'}
            color="warning"
            size="large"
            startIcon={<FreeBreakfastIcon />}
            endIcon={<CasinoIcon />}
            onClick={() => handleGenerateMeal('breakfast', 0)}
            disabled={generatedMeal?.isLoading}
            sx={{ py: 2, px: 4, fontSize: '1.1rem', minWidth: 200 }}
          >
            Breakfast
          </Button>
          <Button
            variant={selectedMealType === 'lunch' ? 'contained' : 'outlined'}
            color="success"
            size="large"
            startIcon={<LunchDiningIcon />}
            endIcon={<CasinoIcon />}
            onClick={() =>
              handleGenerateMeal('lunch', selectedMealType === 'lunch' ? selectedOptionIndex : 0)
            }
            disabled={generatedMeal?.isLoading}
            sx={{ py: 2, px: 4, fontSize: '1.1rem', minWidth: 200 }}
          >
            Lunch
          </Button>
          <Button
            variant={selectedMealType === 'dinner' ? 'contained' : 'outlined'}
            color="info"
            size="large"
            startIcon={<DinnerDiningIcon />}
            endIcon={<CasinoIcon />}
            onClick={() =>
              handleGenerateMeal('dinner', selectedMealType === 'dinner' ? selectedOptionIndex : 0)
            }
            disabled={generatedMeal?.isLoading}
            sx={{ py: 2, px: 4, fontSize: '1.1rem', minWidth: 200 }}
          >
            Dinner
          </Button>
        </Stack>

        {/* Option Toggle for Lunch/Dinner */}
        {hasMultipleOptions && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <ToggleButtonGroup
              value={selectedOptionIndex}
              exclusive
              onChange={handleOptionChange}
              aria-label="meal option"
              disabled={generatedMeal?.isLoading}
            >
              <ToggleButton value={0} sx={{ px: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">
                    Option 1
                  </Typography>
                  <Typography variant="caption" display="block">
                    1 Heavy Protein + Carbs
                  </Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value={1} sx={{ px: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">
                    Option 2
                  </Typography>
                  <Typography variant="caption" display="block">
                    3 Light Proteins + Carbs
                  </Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Side - Available Options */}
          {currentConfig && generatedMeal && (
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  color="primary.main"
                  sx={{ direction: 'rtl' }}
                >
                  אפשרויות חלבון ({currentConfig.proteinCount} לבחירה)
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {currentConfig.proteins.map((item, index) => {
                    const isSelected = generatedMeal.option.proteins.some(
                      (p) => p.hebrew === item.hebrew
                    );
                    return (
                      <ListItem
                        key={index}
                        onClick={() => {
                          // Find first unlocked protein slot to replace
                          const unlockedIndex = locks.proteins.findIndex(
                            (locked, i) => !locked && i < generatedMeal.option.proteins.length
                          );
                          if (unlockedIndex !== -1) {
                            selectProtein(unlockedIndex, item);
                          }
                        }}
                        sx={{
                          bgcolor: isSelected ? 'primary.light' : 'transparent',
                          borderRadius: 1,
                          mb: 0.5,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: isSelected ? 'primary.light' : 'action.hover' },
                        }}
                      >
                        <ListItemText
                          primary={item.hebrew}
                          sx={{ textAlign: 'right', direction: 'rtl' }}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: isSelected ? 'bold' : 'normal',
                          }}
                        />
                      </ListItem>
                    );
                  })}
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography
                  variant="h6"
                  gutterBottom
                  color="warning.main"
                  sx={{ direction: 'rtl' }}
                >
                  אפשרויות פחמימות
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {currentConfig.carbs.map((item, index) => {
                    const isSelected = generatedMeal.option.carbs.hebrew === item.hebrew;
                    return (
                      <ListItem
                        key={index}
                        onClick={() => selectCarbs(item)}
                        sx={{
                          bgcolor: isSelected ? 'warning.light' : 'transparent',
                          borderRadius: 1,
                          mb: 0.5,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: isSelected ? 'warning.light' : 'action.hover' },
                        }}
                      >
                        <ListItemText
                          primary={item.hebrew}
                          sx={{ textAlign: 'right', direction: 'rtl' }}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: isSelected ? 'bold' : 'normal',
                          }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            </Grid>
          )}

          {/* Center - Generated Meal */}
          <Grid size={{ xs: 12, md: currentConfig && generatedMeal ? 6 : 12 }}>
            {generatedMeal ? (
              <Card
                sx={{
                  maxWidth: 600,
                  mx: 'auto',
                  boxShadow: 4,
                  border: 2,
                  borderColor: `${getMealColor(generatedMeal.type)}.main`,
                }}
              >
                <CardContent>
                  {/* Meal Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Box sx={{ color: `${getMealColor(generatedMeal.type)}.main` }}>
                      {getMealIcon(generatedMeal.type)}
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold">
                        {generatedMeal.data.name}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        sx={{ direction: 'rtl' }}
                      >
                        {generatedMeal.data.nameHebrew}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Nutrition Info */}
                  <Box sx={{ mb: 3 }}>
                    {generatedMeal.isLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                          Fetching nutrition data...
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        {generatedMeal.error && !generatedMeal.nutrition && (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            Using estimated values from diet plan
                          </Alert>
                        )}
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                          flexWrap="wrap"
                          sx={{ gap: 1 }}
                        >
                          <Chip
                            icon={<LocalFireDepartmentIcon />}
                            label={`${getNutritionToDisplay().calories} cal`}
                            color="error"
                            variant={generatedMeal.nutrition ? 'filled' : 'outlined'}
                          />
                          <Chip
                            label={`${getNutritionToDisplay().protein}g protein`}
                            color="primary"
                            variant={generatedMeal.nutrition ? 'filled' : 'outlined'}
                          />
                          <Chip
                            label={`${getNutritionToDisplay().carbs}g carbs`}
                            color="warning"
                            variant={generatedMeal.nutrition ? 'filled' : 'outlined'}
                          />
                          <Chip
                            label={`${getNutritionToDisplay().fat}g fat`}
                            color="secondary"
                            variant={generatedMeal.nutrition ? 'filled' : 'outlined'}
                          />
                        </Stack>
                        {generatedMeal.nutrition && (
                          <Typography
                            variant="caption"
                            color="success.main"
                            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
                          >
                            * Nutrition from USDA database
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>

                  {/* Meal Components with Lock buttons */}
                  <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 3 }}>
                    {/* Proteins */}
                    <Typography
                      variant="subtitle2"
                      color="primary.main"
                      fontWeight="bold"
                      sx={{ direction: 'rtl', mb: 2 }}
                    >
                      חלבון ({generatedMeal.option.proteins.length})
                    </Typography>
                    {generatedMeal.option.proteins.map((protein, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: 2,
                          p: 2,
                          borderRadius: 1,
                          border: locks.proteins[index] ? 2 : 1,
                          borderColor: locks.proteins[index] ? 'primary.main' : 'grey.300',
                          bgcolor: locks.proteins[index] ? 'primary.50' : 'white',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Tooltip title={locks.proteins[index] ? 'Unlock' : 'Lock'}>
                            <IconButton
                              size="small"
                              onClick={() => toggleProteinLock(index)}
                              color={locks.proteins[index] ? 'primary' : 'default'}
                            >
                              {locks.proteins[index] ? <LockIcon /> : <LockOpenIcon />}
                            </IconButton>
                          </Tooltip>
                          <Typography
                            variant="body1"
                            sx={{ textAlign: 'right', direction: 'rtl', flex: 1 }}
                          >
                            {protein.hebrew}
                          </Typography>
                        </Box>
                      </Box>
                    ))}

                    <Divider sx={{ my: 2 }} />

                    {/* Carbs */}
                    <Typography
                      variant="subtitle2"
                      color="warning.main"
                      fontWeight="bold"
                      sx={{ direction: 'rtl', mb: 2 }}
                    >
                      פחמימות
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        border: locks.carbs ? 2 : 1,
                        borderColor: locks.carbs ? 'warning.main' : 'grey.300',
                        bgcolor: locks.carbs ? 'warning.50' : 'white',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Tooltip title={locks.carbs ? 'Unlock' : 'Lock'}>
                          <IconButton
                            size="small"
                            onClick={toggleCarbsLock}
                            color={locks.carbs ? 'warning' : 'default'}
                          >
                            {locks.carbs ? <LockIcon /> : <LockOpenIcon />}
                          </IconButton>
                        </Tooltip>
                        <Typography
                          variant="body1"
                          sx={{ textAlign: 'right', direction: 'rtl', flex: 1 }}
                        >
                          {generatedMeal.option.carbs.hebrew}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Regenerate Button */}
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      color={getMealColor(generatedMeal.type)}
                      startIcon={<CasinoIcon />}
                      onClick={() => handleGenerateMeal(generatedMeal.type)}
                      disabled={generatedMeal.isLoading}
                    >
                      Generate Again
                      {(locks.proteins.some((l) => l) || locks.carbs) && ' (keeping locked)'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ maxWidth: 600, mx: 'auto', bgcolor: 'grey.50' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <CasinoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Choose a meal type above
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click on Breakfast, Lunch, or Dinner to generate a meal
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Right Side - Instructions */}
          {currentConfig && generatedMeal && (
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  How to use
                </Typography>
                <Typography variant="body2" paragraph>
                  1. Click a meal button to generate
                </Typography>
                {hasMultipleOptions && (
                  <Typography variant="body2" paragraph>
                    2. Switch between Option 1 (heavy) or Option 2 (light)
                  </Typography>
                )}
                <Typography variant="body2" paragraph>
                  {hasMultipleOptions ? '3' : '2'}. Click items in the left panel to select
                </Typography>
                <Typography variant="body2" paragraph>
                  {hasMultipleOptions ? '4' : '3'}. Click{' '}
                  <LockOpenIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} /> to lock items
                </Typography>
                <Typography variant="body2" paragraph>
                  {hasMultipleOptions ? '5' : '4'}. &quot;Generate Again&quot; keeps locked items
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary" sx={{ direction: 'rtl' }}>
                  ירקות עם הארוחות בדגש על ירוקים
                  <br />
                  רטבים בכמות לא גבוהה - עדיפות לרטבים לייט
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
