/**
 * Zeynep & Batuhan — misafir fotoğraf hizmeti (Cloudflare Worker + R2)
 *
 *   GET    /photos?cursor=&limit=   → { open, items:[{id,name,ts}], cursor }
 *   GET    /photo/<id>              → tam boy JPEG
 *   GET    /thumb/<id>              → küçük resim JPEG
 *   POST   /upload                  → multipart: file (JPEG), thumb (JPEG), name (opsiyonel)
 *   POST   /admin/verify            → yönetici parolası doğrulama (X-Admin-Secret)
 *   DELETE /photo/<id>              → yönetici (X-Admin-Secret)
 */

const MAX_TS = 9999999999999;
const ID_RE = /^[0-9]{13}-[a-z0-9]{8}$/;
const buckets = new Map();

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const list = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (list.includes(origin)) return origin;
  // Yerel geliştirme
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return null;
}

function cors(request, env, extra = {}) {
  const origin = allowedOrigin(request, env);
  const headers = { Vary: 'Origin', ...extra };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET,POST,DELETE,OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type,X-Admin-Secret';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return headers;
}

function json(request, env, data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: cors(request, env, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra })
  });
}

function windowState(env) {
  const now = Date.now();
  const opens = Date.parse(env.UPLOAD_OPENS_AT || '');
  const closes = Date.parse(env.UPLOAD_CLOSES_AT || '');
  if (Number.isFinite(opens) && now < opens) return 'not_open';
  if (Number.isFinite(closes) && now > closes) return 'closed';
  return 'open';
}

function rateLimited(ip) {
  // En iyi çaba: isolate başına IP başına 10 dakikada 60 yükleme.
  const now = Date.now();
  const entry = buckets.get(ip) || { start: now, count: 0 };
  if (now - entry.start > 10 * 60 * 1000) { entry.start = now; entry.count = 0; }
  entry.count += 1;
  buckets.set(ip, entry);
  if (buckets.size > 5000) buckets.clear();
  return entry.count > 60;
}

const failures = new Map();

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i += 1) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

// Başarısız yönetici denemeleri: isolate başına IP başına 10 dakikada en fazla 8 (en iyi çaba).
function checkAdmin(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const entry = failures.get(ip) || { start: now, count: 0 };
  if (now - entry.start > 10 * 60 * 1000) { entry.start = now; entry.count = 0; }
  if (entry.count >= 8) return 'locked';
  const secret = request.headers.get('X-Admin-Secret') || '';
  if (env.ADMIN_SECRET && timingSafeEqual(secret, env.ADMIN_SECRET)) return 'ok';
  entry.count += 1;
  failures.set(ip, entry);
  if (failures.size > 5000) failures.clear();
  return 'denied';
}

function isJpeg(bytes) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function cleanName(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
}

function newId() {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => (b % 36).toString(36)).join('');
  return `${String(MAX_TS - Date.now()).padStart(13, '0')}-${rand}`;
}

function tsFromId(id) {
  return MAX_TS - Number(id.slice(0, 13));
}

async function handleUpload(request, env) {
  const state = windowState(env);
  if (state !== 'open') return json(request, env, { error: state }, 403);
  if (!allowedOrigin(request, env)) return json(request, env, { error: 'origin' }, 403);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (rateLimited(ip)) return json(request, env, { error: 'rate_limited' }, 429);

  const maxPhoto = Number(env.MAX_PHOTO_BYTES) || 4000000;
  const maxThumb = Number(env.MAX_THUMB_BYTES) || 400000;
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > maxPhoto + maxThumb + 200000) return json(request, env, { error: 'too_large' }, 413);

  let form;
  try { form = await request.formData(); } catch (_) { return json(request, env, { error: 'bad_form' }, 400); }
  const file = form.get('file');
  const thumb = form.get('thumb');
  if (!file || typeof file === 'string' || !thumb || typeof thumb === 'string') return json(request, env, { error: 'missing_file' }, 400);
  if (file.size > maxPhoto || thumb.size > maxThumb) return json(request, env, { error: 'too_large' }, 413);

  const photoBytes = new Uint8Array(await file.arrayBuffer());
  const thumbBytes = new Uint8Array(await thumb.arrayBuffer());
  if (!isJpeg(photoBytes) || !isJpeg(thumbBytes)) return json(request, env, { error: 'bad_type' }, 415);

  const id = newId();
  const name = cleanName(form.get('name'));
  const meta = { name, uploaded: String(Date.now()) };
  await env.PHOTOS.put(`p/${id}.jpg`, photoBytes, { httpMetadata: { contentType: 'image/jpeg' }, customMetadata: meta });
  await env.PHOTOS.put(`t/${id}.jpg`, thumbBytes, { httpMetadata: { contentType: 'image/jpeg' } });
  return json(request, env, { id, name, ts: tsFromId(id) }, 201);
}

async function handleList(request, env, url) {
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 24, 1), 60);
  const cursor = url.searchParams.get('cursor') || undefined;
  const list = await env.PHOTOS.list({ prefix: 'p/', limit, cursor, include: ['customMetadata'] });
  const items = list.objects.map((obj) => {
    const id = obj.key.slice(2, -4);
    return { id, name: obj.customMetadata?.name || '', ts: tsFromId(id) };
  });
  return json(request, env, { open: windowState(env), items, cursor: list.truncated ? list.cursor : null }, 200, { 'Cache-Control': 'public, max-age=10' });
}

async function handleImage(request, env, kind, id) {
  if (!ID_RE.test(id)) return new Response('Not found', { status: 404, headers: cors(request, env) });
  const object = await env.PHOTOS.get(`${kind}/${id}.jpg`);
  if (!object) return new Response('Not found', { status: 404, headers: cors(request, env) });
  return new Response(object.body, {
    headers: cors(request, env, {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    })
  });
}

async function handleAdminVerify(request, env) {
  const auth = checkAdmin(request, env);
  if (auth === 'locked') return json(request, env, { error: 'locked' }, 429);
  if (auth !== 'ok') return json(request, env, { error: 'unauthorized' }, 401);
  return json(request, env, { ok: true });
}

async function handleDelete(request, env, id) {
  const auth = checkAdmin(request, env);
  if (auth === 'locked') return json(request, env, { error: 'locked' }, 429);
  if (auth !== 'ok') return json(request, env, { error: 'unauthorized' }, 401);
  if (!ID_RE.test(id)) return json(request, env, { error: 'bad_id' }, 400);
  await env.PHOTOS.delete([`p/${id}.jpg`, `t/${id}.jpg`]);
  return json(request, env, { deleted: id });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request, env) });
    try {
      if (request.method === 'POST' && url.pathname === '/upload') return await handleUpload(request, env);
      if (request.method === 'POST' && url.pathname === '/admin/verify') return await handleAdminVerify(request, env);
      if (request.method === 'GET' && url.pathname === '/photos') return await handleList(request, env, url);
      const m = url.pathname.match(/^\/(photo|thumb)\/([^/]+)$/);
      if (m && request.method === 'GET') return await handleImage(request, env, m[1] === 'photo' ? 'p' : 't', m[2].replace(/\.jpg$/, ''));
      if (m && m[1] === 'photo' && request.method === 'DELETE') return await handleDelete(request, env, m[2].replace(/\.jpg$/, ''));
      return json(request, env, { error: 'not_found' }, 404);
    } catch (error) {
      return json(request, env, { error: 'server_error' }, 500);
    }
  }
};
