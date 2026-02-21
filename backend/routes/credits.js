import { supabaseAdmin } from '../services/supabaseAdmin.js';

export async function getCreditsBalance(req, res) {
  try {
    const authUserId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('app_users')
      .select('id, credits_balance, credits_updated_at')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      console.error('[Credits] Failed to fetch balance', error);
      return res.status(500).json({ error: 'Failed to fetch credit balance' });
    }

    return res.json({
      userId: data?.id ?? authUserId,
      balance: data?.credits_balance ?? 0,
      updatedAt: data?.credits_updated_at ?? null,
    });
  } catch (error) {
    console.error('[Credits] Unexpected error in getCreditsBalance', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

