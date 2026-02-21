import { supabaseAdmin } from '../services/supabaseAdmin.js';

const getWebhookSecret = () => process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN || '';

/** Credits product id -> amount to add */
const CREDITS_PRODUCT_AMOUNTS = {
  credits_500: 500,
  credits_1000: 1000,
  credits_2000: 2000,
};

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

function getCreditsAmountFromEvent(event) {
  const productId = event.product_id || event.store_product_id || event.product_identifier || '';
  return CREDITS_PRODUCT_AMOUNTS[productId] ?? 0;
}

async function addCreditsToAppUser(appUserId, amount) {
  if (!appUserId || amount <= 0) return;

  const { data: row, error: findError } = await supabaseAdmin
    .from('app_users')
    .select('id, credits_balance')
    .or(`id.eq.${appUserId},auth_user_id.eq.${appUserId}`)
    .maybeSingle();

  if (findError || !row) {
    console.warn('[RevenueCatWebhook] app_users row not found for', appUserId, findError?.message);
    return;
  }

  const newBalance = (row.credits_balance ?? 0) + amount;
  const { error: updateError } = await supabaseAdmin
    .from('app_users')
    .update({
      credits_balance: newBalance,
      credits_updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  if (updateError) {
    console.error('[RevenueCatWebhook] Failed to update credits', updateError);
  }
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

    if (PURCHASE_EVENT_TYPES.has(eventType)) {
      const creditsToAdd = getCreditsAmountFromEvent(event);
      if (creditsToAdd > 0) {
        await addCreditsToAppUser(appUserId, creditsToAdd);
      }
    }

    return res.status(200).json({ ok: true, acknowledged: true, eventId });
  } catch (error) {
    console.error('[RevenueCatWebhook] Unexpected error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

