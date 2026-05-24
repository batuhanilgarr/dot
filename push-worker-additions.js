/**
 * Cloudflare Worker — Push Notification eklentisi
 *
 * ADIMLAR:
 * 1. Cloudflare dashboard → Workers → zeynepbatuhan-rsvp-api
 * 2. Settings → Variables → KV Namespace Bindings:
 *    - Variable name: PUSH_SUBS
 *    - KV Namespace: yeni oluştur → "zeynepbatuhan-push-subs"
 * 3. Settings → Variables → Environment Variables (encrypted):
 *    - VAPID_PRIVATE_KEY = MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgFmMPbIJjTPqUlvTgy8dSEsNb-rgacDiWiHvDVOSLyO-hRANCAARMtSqFbu8e19Puu-xhdRFdD-FYj3i-0Ujc9SMoBFZfGW86sNfV4FZDEtIy-hNLugHoxUU4LTCGLtb00g3Gg6dF
 *    - VAPID_PUBLIC_KEY  = BEy1KoVu7x7X0-677GF1EV0P4ViPeL7RSNz1IygEVl8Zbzqw19XgVkMS0jL6E0u6AejFRTgtMIYu1vTSDcaDp0U
 *    - PUSH_ADMIN_SECRET = (kendin belirle, örn. rastgele 32 karakter)
 * 4. Aşağıdaki kodu mevcut Worker koduna ekle (router'ın içine)
 *
 * BİLDİRİM GÖNDERMEK İÇİN (güncelleme yapınca):
 *   curl -X POST https://zeynepbatuhan-rsvp-api.batuhannilgarr.workers.dev/push-notify \
 *     -H "Content-Type: application/json" \
 *     -H "X-Admin-Secret: <PUSH_ADMIN_SECRET>" \
 *     -d '{"title":"Zeynep & Batuhan","body":"Davetiyede yeni bir güncelleme var!","url":"/"}'
 */

// ——— Mevcut Worker koduna eklenecek handler'lar ———

// POST /push-subscribe — tarayıcı subscription'ı kaydet
async function handlePushSubscribe(request, env) {
  const cors = {
    'Access-Control-Allow-Origin': 'https://zeynepbatuhan.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  try {
    const sub = await request.json();
    if (!sub.endpoint) return new Response('Bad request', { status: 400 });

    // Endpoint URL'yi key olarak kullan (her cihaz benzersiz)
    const key = btoa(sub.endpoint).slice(0, 128);
    await env.PUSH_SUBS.put(key, JSON.stringify(sub), { expirationTtl: 60 * 60 * 24 * 365 });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response('Error', { status: 500 });
  }
}

// POST /push-notify — admin bildirim gönder (PUSH_ADMIN_SECRET ile korumalı)
async function handlePushNotify(request, env) {
  if (request.headers.get('X-Admin-Secret') !== env.PUSH_ADMIN_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await request.json();
  const keys = await env.PUSH_SUBS.list();
  const results = [];

  for (const { name } of keys.keys) {
    const raw = await env.PUSH_SUBS.get(name);
    if (!raw) continue;
    const sub = JSON.parse(raw);

    try {
      // Cloudflare Workers web-push: manuel VAPID imzalama gerekir.
      // En kolay yol: webpush-worker npm paketi veya aşağıdaki gibi CF'nin WebCrypto'su.
      // Bu örnek temel yapıyı gösterir; tam VAPID imzalamak için web-push-cfw paketini kullan.
      const res = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TTL': '86400',
          // VAPID Authorization header buraya eklenecek (web-push-cfw ile otomatik)
        },
        body: JSON.stringify(payload),
      });
      results.push({ endpoint: sub.endpoint.slice(-20), status: res.status });
    } catch (e) {
      results.push({ endpoint: sub.endpoint.slice(-20), error: e.message });
    }
  }

  return new Response(JSON.stringify({ sent: results.length, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// ——— Mevcut fetch handler'ındaki router'a ekle ———
// if (url.pathname === '/push-subscribe') return handlePushSubscribe(request, env);
// if (url.pathname === '/push-notify')    return handlePushNotify(request, env);
