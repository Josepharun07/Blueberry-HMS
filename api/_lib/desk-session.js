const { createHmac, randomBytes, timingSafeEqual } = require('crypto');

const COOKIE = 'bh_desk';
const MAX_AGE_SECONDS = 8 * 60 * 60;

function required(name) {
  const value = process.env[name];
  if (typeof value !== 'string' || value === '') return null;
  return value;
}

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

function header(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sign(payload) {
  const secret = required('SESSION_SECRET');
  if (!secret) return null;
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function readSession(req) {
  const pair = header(req, 'cookie')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`));
  if (!pair) return null;
  const token = decodeURIComponent(pair.slice(COOKIE.length + 1));
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const secret = required('SESSION_SECRET');
  if (!secret) return null;
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  if (!safeEqual(mac, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    if (typeof payload.email !== 'string' || typeof payload.csrf !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
}

function sessionCookie(value, maxAge) {
  return [
    `${COOKIE}=${encodeURIComponent(value)}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${maxAge}`,
  ].join('; ');
}

function userFrom(email) {
  return {
    id: 'desk-admin',
    email,
    firstName: 'Admin',
    lastName: 'Desk',
    role: 'SUPER_ADMIN',
  };
}

function send(res, status, body, cookie) {
  res.setHeader('Cache-Control', 'no-store');
  if (cookie) res.setHeader('Set-Cookie', cookie);
  res.status(status).json(body);
}

async function login(req, res) {
  if (req.method !== 'POST') return send(res, 405, { message: 'Method not allowed' });
  const email = required('ADMIN_EMAIL');
  const password = required('ADMIN_PASSWORD');
  if (!email || !password || !required('SESSION_SECRET')) {
    return send(res, 503, { message: 'Login is not configured' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return send(res, 400, { message: 'Invalid credentials' });
  }

  const givenEmail = typeof body?.email === 'string' ? body.email.trim() : '';
  const givenPassword = typeof body?.password === 'string' ? body.password : '';
  const emailOk = safeEqual(givenEmail.toLowerCase(), email.trim().toLowerCase());
  const passwordOk = safeEqual(givenPassword, password);
  if (!emailOk || !passwordOk) return send(res, 401, { message: 'Invalid credentials' });

  const csrf = randomBytes(32).toString('base64url');
  const token = sign({
    email: email.trim(),
    csrf,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  });
  if (!token) return send(res, 503, { message: 'Login is not configured' });
  return send(res, 200, { user: userFrom(email.trim()), csrfToken: csrf }, sessionCookie(token, MAX_AGE_SECONDS));
}

function me(req, res) {
  if (req.method !== 'GET') return send(res, 405, { message: 'Method not allowed' });
  const session = readSession(req);
  if (!session) return send(res, 401, { message: 'Invalid credentials' });
  return send(res, 200, { user: userFrom(session.email), csrfToken: session.csrf });
}

function logout(req, res) {
  if (req.method !== 'POST') return send(res, 405, { message: 'Method not allowed' });
  const session = readSession(req);
  const csrf = header(req, 'x-csrf-token');
  if (!session || !safeEqual(csrf, session.csrf)) {
    return send(res, 403, { message: 'Invalid credentials' }, sessionCookie('', 0));
  }
  return send(res, 200, { ok: true }, sessionCookie('', 0));
}

module.exports = { login, me, logout };
