import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:noreply@honestbaby-care.com';

let configured = false;
function configure() {
  if (configured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

export async function sendPushNotification(subscription, payload) {
  if (!configure()) {
    return { ok: false, reason: 'VAPID keys not configured' };
  }
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, statusCode: err.statusCode, reason: err.body || err.message };
  }
}

export function isPushConfigured() {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}
