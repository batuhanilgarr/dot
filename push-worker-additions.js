/**
 * ADIMLAR — Cloudflare Dashboard:
 *
 * 1. Workers & Pages → zeynepbatuhan-rsvp-api → Settings → Variables
 *    Environment Variables (şifreli olarak ekle):
 *      VAPID_PRIVATE_KEY = MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgFmMPbIJjTPqUlvTgy8dSEsNb-rgacDiWiHvDVOSLyO-hRANCAARMtSqFbu8e19Puu-xhdRFdD-FYj3i-0Ujc9SMoBFZfGW86sNfV4FZDEtIy-hNLugHoxUU4LTCGLtb00g3Gg6dF
 *      VAPID_PUBLIC_KEY  = BEy1KoVu7x7X0-677GF1EV0P4ViPeL7RSNz1IygEVl8Zbzqw19XgVkMS0jL6E0u6AejFRTgtMIYu1vTSDcaDp0U
 *      PUSH_ADMIN_SECRET = (kendin seç, örn. rastgele 20 karakter — bunu sadece sen bileceksin)
 *
 * 2. Workers & Pages → zeynepbatuhan-rsvp-api → Settings → Variables → KV Namespace Bindings
 *    Variable name: PUSH_SUBS
 *    KV Namespace: "Create a namespace" → zeynepbatuhan-push-subs → seç
 *
 * 3. Aşağıdaki TAM KODU Workers editörüne yapıştır (mevcut kodu tamamen sil).
 *
 * 4. Save & Deploy
 *
 * BİLDİRİM GÖNDERMEK İÇİN (terminalde):
 *   curl -X POST https://zeynepbatuhan-rsvp-api.batuhannilgarr.workers.dev/push-notify \
 *     -H "Content-Type: application/json" \
 *     -H "X-Admin-Secret: <PUSH_ADMIN_SECRET>" \
 *     -d '{"title":"Zeynep & Batuhan 💍","body":"Davetiyede yeni bir şey var!","url":"/"}'
 */

// ═══════════════════════════════════════════════════════
// WORKERS EDİTÖRÜNE YAPIŞTIRILACAK TAM KOD AŞAĞIDADIR
// ═══════════════════════════════════════════════════════

const VAPID_SUBJECT = 'mailto:batuhan.ilgar@8bitiz.com';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
  });
}

// ——— base64url yardımcıları ———
function b64uDecode(b64u) {
  const pad = '='.repeat((4 - b64u.length % 4) % 4);
  return Uint8Array.from(
    atob((b64u + pad).replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );
}
function b64uEncode(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// ——— VAPID JWT (RFC 8292) ———
async function makeVapidJwt(audience, privateKeyB64u) {
  const header  = b64uEncode(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const now     = Math.floor(Date.now() / 1000);
  const payload = b64uEncode(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: now + 43200,
    sub: VAPID_SUBJECT
  })));

  const unsigned = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'pkcs8', b64uDecode(privateKeyB64u),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned)
  );
  return `${unsigned}.${b64uEncode(new Uint8Array(sig))}`;
}

// ——— RFC 8291 Web Push şifreleme (aes128gcm) ———
async function encryptWebPush(subscription, plaintext) {
  const receiverPub = b64uDecode(subscription.keys.p256dh);
  const authSecret  = b64uDecode(subscription.keys.auth);

  // Geçici gönderici EC key pair
  const senderKP  = /** @type {CryptoKeyPair} */ (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']));
  const senderPub = new Uint8Array(/** @type {ArrayBuffer} */ (await crypto.subtle.exportKey('raw', senderKP.publicKey)));

  // Alıcı public key import
  const receiverKey = await crypto.subtle.importKey(
    'raw', receiverPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );

  // ECDH paylaşımlı gizli
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: receiverKey }, senderKP.privateKey, 256
  );

  // Salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF auth adımı → PRK
  const ikmKey = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveBits']);
  const authInfo = new Uint8Array([
    ...new TextEncoder().encode('WebPush: info\x00'),
    ...receiverPub,
    ...senderPub
  ]);
  const prk = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: authInfo },
    ikmKey, 256
  );

  // CEK (128 bit) ve Nonce (96 bit)
  const prkKey = await crypto.subtle.importKey('raw', prk, 'HKDF', false, ['deriveBits']);
  const cekBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode('Content-Encoding: aes128gcm\x00') },
    prkKey, 128
  );
  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode('Content-Encoding: nonce\x00') },
    prkKey, 96
  );

  // AES-128-GCM şifreleme (son byte = 0x02 record delimiter)
  const encKey = await crypto.subtle.importKey('raw', cekBits, { name: 'AES-GCM' }, false, ['encrypt']);
  const padded = new Uint8Array([...new TextEncoder().encode(plaintext), 0x02]);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(nonceBits) },
    encKey, padded
  );

  // RFC 8291 body: salt(16) + rs(4 BE uint32) + idlen(1) + senderPub(65) + ciphertext
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096 byte record size
  return new Uint8Array([...salt, ...rs, 65, ...senderPub, ...new Uint8Array(ciphertext)]);
}

// ——— Tek bir abone'ye push gönder ———
async function deliverPush(subscription, message, vapidPrivKey, vapidPubKey) {
  const url      = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt      = await makeVapidJwt(audience, vapidPrivKey);
  const body     = await encryptWebPush(subscription, JSON.stringify(message));

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Authorization': `vapid t=${jwt},k=${vapidPubKey}`,
    },
    body,
  });
  return res.status;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // GET /rsvp-count
    if (request.method === 'GET' && url.pathname === '/rsvp-count') {
      const countRaw  = await env.RSVP_STORE.get('count');
      const updatedAt = await env.RSVP_STORE.get('updatedAt');
      return json({ count: Number(countRaw || 0), updatedAt: updatedAt || new Date().toISOString() });
    }

    // POST /rsvp → count +1
    if (request.method === 'POST' && url.pathname === '/rsvp') {
      const countRaw = await env.RSVP_STORE.get('count');
      const next = Number(countRaw || 0) + 1;
      const now  = new Date().toISOString();
      await env.RSVP_STORE.put('count', String(next));
      await env.RSVP_STORE.put('updatedAt', now);
      return json({ ok: true, count: next, updatedAt: now }, 201);
    }

    // POST /push-subscribe → aboneliği kaydet
    if (request.method === 'POST' && url.pathname === '/push-subscribe') {
      try {
        const sub = await request.json();
        if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
          return json({ error: 'Invalid subscription' }, 400);
        }
        // Endpoint hash'ini key olarak kullan
        const key = b64uEncode(
          new Uint8Array(/** @type {ArrayBuffer} */ (await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sub.endpoint))))
        );
        await env.PUSH_SUBS.put(key, JSON.stringify(sub), { expirationTtl: 60 * 60 * 24 * 365 });
        return json({ ok: true });
      } catch {
        return json({ error: 'Bad request' }, 400);
      }
    }

    // POST /push-notify → tüm abonelere bildirim gönder (admin only)
    if (request.method === 'POST' && url.pathname === '/push-notify') {
      if (request.headers.get('X-Admin-Secret') !== env.PUSH_ADMIN_SECRET) {
        return json({ error: 'Unauthorized' }, 401);
      }

      const message = await request.json(); // { title, body, url }
      const { keys } = await env.PUSH_SUBS.list();

      const results = await Promise.allSettled(
        keys.map(async ({ name }) => {
          const raw = await env.PUSH_SUBS.get(name);
          if (!raw) return;
          const sub = JSON.parse(raw);
          const status = await deliverPush(sub, message, env.VAPID_PRIVATE_KEY, env.VAPID_PUBLIC_KEY);
          // 404 veya 410 → abone silinmiş, temizle
          if (status === 404 || status === 410) await env.PUSH_SUBS.delete(name);
          return { name: name.slice(0, 8), status };
        })
      );

      const sent = results.filter(r => r.status === 'fulfilled').length;
      return json({ ok: true, total: keys.length, sent });
    }

    return json({ error: 'Not found' }, 404);
  },
};
