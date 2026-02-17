import { supabaseAdmin } from '../services/supabaseAdmin.js';

export async function getCreditsBalance(req, res) {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('user_credits')
      .select('balance, updated_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[Credits] Failed to fetch balance', error);
      return res.status(500).json({ error: 'Failed to fetch credit balance' });
    }

    return res.json({
      userId,
      balance: data?.balance ?? 0,
      updatedAt: data?.updated_at ?? null,
    });
  } catch (error) {
    console.error('[Credits] Unexpected error in getCreditsBalance', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

