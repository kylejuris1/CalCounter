const getWebhookSecret = () => process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN || '';

const PURCHASE_EVENT_TYPES = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
]);

function getWebhookEvent(payload) {
  if (!payload || typeof payload !== 'object') return null;
  return payload.event && typeof payload.event === 'object' ? payload.event : payload;
}

function getEventId(event) {
  return (
    event.id ||
    event.event_id ||
    `${event.original_transaction_id || event.transaction_id || 'unknown'}:${event.event_timestamp_ms || Date.now()}`
  );
}

function isAuthorized(req) {
  const expected = getWebhookSecret();
  if (!expected) return false;

  const rawHeader = req.headers.authorization || '';
  if (!rawHeader) return false;

  const bearerToken = rawHeader.startsWith('Bearer ') ? rawHeader.slice(7).trim() : rawHeader.trim();
  return bearerToken === expected;
}

export async function handleRevenueCatWebhook(req, res) {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized webhook request' });
    }

    const event = getWebhookEvent(req.body);
    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const eventId = getEventId(event);
    const eventType = event.type;
    const appUserId = event.app_user_id;

    if (!eventType || !appUserId) {
      return res.status(400).json({ error: 'Missing required RevenueCat event fields' });
    }

    // Subscription model: premium is determined by RevenueCat entitlements; no credits to apply.
    if (PURCHASE_EVENT_TYPES.has(eventType)) {
      console.log('[RevenueCatWebhook] Purchase event acknowledged', eventType, appUserId);
    }

    return res.status(200).json({ ok: true, acknowledged: true, eventId });
  } catch (error) {
    console.error('[RevenueCatWebhook] Unexpected error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

