import { supabaseAdmin } from '../services/supabaseAdmin.js';

/**
 * POST /api/auth/link-guest
 * Body: { guestId: string (uuid) }
 * Requires: Authorization Bearer <supabase JWT>
 * Links the guest to the authenticated user: sets app_users.auth_user_id = req.user.id where id = guestId.
 * If the OTP trigger already created an app_users row for this auth user (id = auth_user_id), we delete
 * that row first so the unique constraint on auth_user_id is not violated when we link the guest row.
 */
export async function linkGuest(req, res) {
  try {
    const authUserId = req.user.id;
    const { guestId } = req.body || {};

    if (!guestId || typeof guestId !== 'string') {
      return res.status(400).json({ error: 'guestId is required' });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('app_users')
      .select('id, auth_user_id')
      .eq('id', guestId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Guest account not found' });
    }

    if (existing.auth_user_id != null) {
      return res.status(400).json({ error: 'This guest account is already linked' });
    }

    // Remove the app_users row created by the OTP trigger (id = auth_user_id) so we don't violate
    // unique(auth_user_id) when linking the guest row. That row has no health_goals/onboarding_responses.
    await supabaseAdmin
      .from('app_users')
      .delete()
      .eq('id', authUserId);

    const authEmail = req.user.email ?? null;
    const { error: updateError } = await supabaseAdmin
      .from('app_users')
      .update({
        auth_user_id: authUserId,
        email: authEmail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', guestId);

    if (updateError) {
      console.error('[Auth] link-guest update error', updateError);
      return res.status(500).json({ error: 'Failed to link account' });
    }

    return res.json({ ok: true, message: 'Account linked successfully' });
  } catch (error) {
    console.error('[Auth] linkGuest error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/ensure-app-user
 * No body. Requires: Authorization Bearer <supabase JWT>
 * Ensures an app_users row exists for the authenticated user (e.g. signed in with OTP without prior guest).
 */
export async function ensureAppUser(req, res) {
  try {
    const authUserId = req.user.id;

    const { error } = await supabaseAdmin
      .from('app_users')
      .insert({ id: authUserId, auth_user_id: authUserId });

    if (error) {
      if (error.code === '23505') {
        return res.json({ ok: true });
      }
      console.error('[Auth] ensure-app-user error', error);
      return res.status(500).json({ error: 'Failed to ensure app user' });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('[Auth] ensureAppUser error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/delete-account
 * No body. Requires: Authorization Bearer <supabase JWT>
 * Deletes the app user and related data (onboarding_responses cascade) for the authenticated user.
 */
export async function deleteAccount(req, res) {
  try {
    const authUserId = req.user.id;

    const { error } = await supabaseAdmin
      .from('app_users')
      .delete()
      .eq('auth_user_id', authUserId);

    if (error) {
      console.error('[Auth] delete-account error', error);
      return res.status(500).json({ error: 'Failed to delete account' });
    }

    return res.json({ ok: true, message: 'Account data deleted' });
  } catch (error) {
    console.error('[Auth] deleteAccount error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
