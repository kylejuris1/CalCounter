import { supabaseAdmin } from '../services/supabaseAdmin.js';
import { updateHealthGoals } from '../services/healthGoals.js';

/**
 * POST /api/health-goals/update
 *
 * Secured: requires Authorization Bearer <Supabase JWT>.
 * Updates health_goals for the authenticated user's app account only.
 * Resolves app_users.id from auth_user_id (no body user_id accepted for security).
 *
 * Optional server-side / admin: if X-Admin-Key header matches ADMIN_API_KEY env,
 * body may include { user_id } to update that app user (for server-side or admin use).
 */
export async function updateHealthGoalsRoute(req, res) {
  try {
    let appUserId = req.appUserId; // set by middleware when X-Admin-Key + body.user_id

    if (!appUserId) {
      const authUserId = req.user?.id;
      if (!authUserId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { data: appUser, error: lookupError } = await supabaseAdmin
        .from('app_users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (lookupError || !appUser) {
        return res.status(404).json({
          error: 'App user not found. Complete onboarding or link account first.',
        });
      }

      appUserId = appUser.id;
    }

    const result = await updateHealthGoals(appUserId);
    return res.json({ ok: true, health_goals: result });
  } catch (error) {
    console.error('[healthGoals] route error', error);
    const message = error?.message || 'Failed to update health goals';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: message });
  }
}
