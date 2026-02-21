import { supabaseAdmin } from './supabaseAdmin.js';

/**
 * Get activity multiplier from workouts_per_week (Mifflin–St Jeor style).
 * 0 → 1.2 (sedentary), 1–2 → 1.375, 3–4 → 1.55, 5–6 → 1.725, ≥7 → 1.9
 */
function getActivityMultiplier(workoutsPerWeek) {
  const n = workoutsPerWeek == null ? 0 : Number(workoutsPerWeek);
  if (n >= 7) return 1.9;
  if (n >= 5) return 1.725;
  if (n >= 3) return 1.55;
  if (n >= 1) return 1.375;
  return 1.2;
}

/**
 * Compute age in full years from birth_date.
 */
function getAge(birthDate) {
  if (!birthDate) return 25; // fallback for missing birth_date
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return Math.max(0, age);
}

/**
 * Updates health_goals for a given app user_id from onboarding_responses.
 * Uses BMR (Mifflin–St Jeor), TDEE, goal-based calorie target, and derived macros/micros.
 * Idempotent: upserts one row per user_id.
 *
 * @param {string} user_id - public.app_users.id (same as onboarding_responses.user_id)
 * @throws {Error} if onboarding data not found or Supabase error
 */
export async function updateHealthGoals(user_id) {
  const { data: row, error: fetchError } = await supabaseAdmin
    .from('onboarding_responses')
    .select(
      'gender, weight_kg, height_cm, birth_date, workouts_per_week, goal, desired_weight, weight_loss_speed_per_week'
    )
    .eq('user_id', user_id)
    .single();

  if (fetchError || !row) {
    throw new Error('User onboarding data not found');
  }

  const weight_kg = Number(row.weight_kg) || 70;
  const height_cm = Number(row.height_cm) || 170;
  const age = getAge(row.birth_date);
  const gender = (row.gender || 'male').toLowerCase();
  const workouts_per_week = row.workouts_per_week != null ? Number(row.workouts_per_week) : 0;
  const goal = (row.goal || 'maintain').toLowerCase();
  const weight_loss_speed_per_week = Number(row.weight_loss_speed_per_week) || 0;

  // BMR (Mifflin–St Jeor)
  const bmr =
    gender === 'male'
      ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;

  const multiplier = getActivityMultiplier(workouts_per_week);
  const tdee = bmr * multiplier;

  // Daily calorie goal
  const calorie_delta = (weight_loss_speed_per_week * 3500) / 7;
  let calorie_goal = tdee;
  if (goal === 'lose') calorie_goal -= calorie_delta;
  else if (goal === 'gain') calorie_goal += calorie_delta;
  calorie_goal = Math.max(500, Math.round(calorie_goal));

  // Macros (grams)
  const protein_grams = weight_kg * 1.8;
  const fat_grams = 0.9 * weight_kg;
  const carbs_grams = (calorie_goal - (protein_grams * 4 + fat_grams * 9)) / 4;

  // Micros / fiber
  const fiber_grams = (calorie_goal / 1000) * 14;
  const sugar_grams = (calorie_goal * 0.1) / 4;
  const sodium_mg = 2300;
  const water_liters = weight_kg * 0.035;

  const payload = {
    user_id,
    calorie_goal,
    protein_grams: Math.round(protein_grams),
    fat_grams: Math.round(fat_grams),
    carbs_grams: Math.round(carbs_grams),
    fiber_grams: Math.round(fiber_grams),
    sugar_grams: Math.round(sugar_grams),
    sodium_mg,
    water_liters: Number(water_liters.toFixed(2)),
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabaseAdmin
    .from('health_goals')
    .upsert(payload, { onConflict: 'user_id' });

  if (upsertError) {
    console.error('[healthGoals] upsert error', upsertError);
    throw new Error('Failed to save health goals');
  }

  return payload;
}
