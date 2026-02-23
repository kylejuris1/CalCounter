/**
 * Credits deprecated: app uses subscription model (RevenueCat). Stub for backwards compatibility.
 */
export async function getCreditsBalance(req, res) {
  try {
    const authUserId = req.user.id;
    return res.json({
      userId: authUserId,
      balance: 0,
      updatedAt: null,
      _meta: 'Subscription model; premium via RevenueCat entitlements.',
    });
  } catch (error) {
    console.error('[Credits] Unexpected error in getCreditsBalance', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

