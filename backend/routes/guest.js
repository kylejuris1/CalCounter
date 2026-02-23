import { supabaseAdmin } from '../services/supabaseAdmin.js';

/**
 * POST /api/guest/onboarding
 * Body: { answers: OnboardingAnswers, goals: { calorieGoal, proteinGoal, carbsGoal, fatGoal } }
 * Creates a guest app_user and saves onboarding_responses. Returns { guestId }.
 * No auth required.
 */
export async function submitGuestOnboarding(req, res) {
  try {
    const { answers = {}, goals = {} } = req.body || {};
    const {
      gender,
      workoutsPerWeek,
      whereHeard,
      triedOtherApps,
      weightKg,
      heightCm,
      birthDate,
      goal,
      desiredWeight,
      desiredWeightUnit,
      weightLossSpeedPerWeek,
      obstacles,
      diet,
      accomplish,
      rolloverCalories,
      addBurnedCaloriesToGoal,
      notificationsEnabled,
      referralCode,
    } = answers;

    const {
      calorieGoal,
      proteinGoal,
      carbsGoal,
      fatGoal,
      fiberGoal,
      sugarGoal,
      sodiumGoal,
      waterGoalMl,
    } = goals;

    const { data: appUser, error: insertUserError } = await supabaseAdmin
      .from('app_users')
      .insert({})
      .select('id')
      .single();

    if (insertUserError || !appUser?.id) {
      console.error('[Guest] app_users insert error', insertUserError);
      return res.status(500).json({ error: 'Failed to create guest account' });
    }

    const userId = appUser.id;

    const { error: insertOnboardingError } = await supabaseAdmin
      .from('onboarding_responses')
      .insert({
        user_id: userId,
        gender: gender ?? null,
        workouts_per_week: workoutsPerWeek ?? null,
        where_heard: whereHeard ?? null,
        tried_other_apps: triedOtherApps ?? null,
        weight_kg: weightKg != null ? Number(weightKg) : null,
        height_cm: heightCm != null ? Number(heightCm) : null,
        birth_date: birthDate || null,
        goal: goal ?? null,
        desired_weight: desiredWeight != null ? Number(desiredWeight) : null,
        desired_weight_unit: desiredWeightUnit ?? null,
        weight_loss_speed_per_week: weightLossSpeedPerWeek != null ? Number(weightLossSpeedPerWeek) : null,
        obstacles: Array.isArray(obstacles) ? obstacles : null,
        diet: diet ?? null,
        accomplish: accomplish ?? null,
        rollover_calories: rolloverCalories ?? null,
        add_burned_calories_to_goal: addBurnedCaloriesToGoal ?? null,
        notifications_enabled: notificationsEnabled ?? null,
        referral_code: referralCode ?? null,
        calorie_goal: calorieGoal != null ? Number(calorieGoal) : null,
        protein_goal: proteinGoal != null ? Number(proteinGoal) : null,
        carbs_goal: carbsGoal != null ? Number(carbsGoal) : null,
        fat_goal: fatGoal != null ? Number(fatGoal) : null,
      });

    if (insertOnboardingError) {
      console.error('[Guest] onboarding_responses insert error', insertOnboardingError);
      await supabaseAdmin.from('app_users').delete().eq('id', userId);
      return res.status(500).json({ error: 'Failed to save onboarding responses' });
    }

    // Insert into health_goals (schema: user_id, calorie_goal, protein_grams, fat_grams, carbs_grams, fiber_grams, sugar_grams, sodium_mg, water_liters)
    const calorie_goal = calorieGoal != null ? Number(calorieGoal) : 2000;
    const protein_grams = proteinGoal != null ? Number(proteinGoal) : 150;
    const fat_grams = fatGoal != null ? Number(fatGoal) : 65;
    const carbs_grams = carbsGoal != null ? Number(carbsGoal) : 200;
    const fiber_grams = fiberGoal != null ? Number(fiberGoal) : 38;
    const sugar_grams = sugarGoal != null ? Number(sugarGoal) : 50;
    const sodium_mg = sodiumGoal != null ? Number(sodiumGoal) : 2300;
    const water_liters = waterGoalMl != null ? Number(waterGoalMl) / 1000 : 2.5;

    const { error: healthGoalsError } = await supabaseAdmin.from('health_goals').insert({
      user_id: userId,
      calorie_goal,
      protein_grams,
      fat_grams,
      carbs_grams,
      fiber_grams,
      sugar_grams,
      sodium_mg,
      water_liters,
    });

    if (healthGoalsError) {
      console.error('[Guest] health_goals insert error', healthGoalsError);
      await supabaseAdmin.from('onboarding_responses').delete().eq('user_id', userId);
      await supabaseAdmin.from('app_users').delete().eq('id', userId);
      return res.status(500).json({ error: 'Failed to save health goals' });
    }

    return res.status(201).json({ guestId: userId });
  } catch (error) {
    console.error('[Guest] submitGuestOnboarding error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
