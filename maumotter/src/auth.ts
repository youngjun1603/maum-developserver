// 마음 시리즈 공용 인증 모듈 (CANONICAL)
// ⚠️ 이 파일은 각 서비스 저장소(maumotter/src/auth.ts, maumgyeot/src/auth.ts)에 **동일 사본**으로 복사해 사용한다.
//    한쪽을 고치면 이 캐논과 모든 사본을 함께 고친다. (_shared/maum-shared-spec.md 2장)
// 전제: Worker에 AUTH_DB(maum-auth D1) 바인딩 + JWT_SECRET(시리즈 공유) 시크릿.
// JWT는 crypto.subtle(HS256), 페이로드 maum_user_id·iss:'maum'·exp(초).

// ── base64url ─────────────────────────────────────────────
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const b64urlStr = (obj: object) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
const fromB64url = (s: string) => {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  return Uint8Array.from(atob(pad), (ch) => ch.charCodeAt(0));
};
async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

// ── JWT ───────────────────────────────────────────────────
export async function createJWT(payload: object, secret: string): Promise<string> {
  const input = `${b64urlStr({ alg: 'HS256', typ: 'JWT' })}.${b64urlStr(payload)}`;
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(input));
  return `${input}.${b64url(new Uint8Array(sig))}`;
}
export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return null;
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64url(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(p)));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch { return null; }
}
export function issueToken(secret: string, user: { id: number; email: string }): Promise<string> {
  return createJWT({ maum_user_id: user.id, email: user.email, iss: 'maum', exp: Math.floor(Date.now() / 1000) + 30 * 86400 }, secret);
}

// ── 비밀번호 (PBKDF2 / crypto.subtle) ─────────────────────
const toHex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
export async function hashPassword(pw: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, baseKey, 256);
  return `${toHex(salt.buffer)}:${toHex(bits)}`;
}
export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = (stored || '').split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Uint8Array.from(saltHex.match(/.{2}/g)!.map((x) => parseInt(x, 16)));
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, baseKey, 256);
  return toHex(bits) === hashHex;
}

// ── 계정 (maum-auth D1.users) ─────────────────────────────
export interface MaumUser { id: number; email: string; name: string | null; }

export async function registerUser(authDb: D1Database, p: { email: string; password: string; name?: string }): Promise<MaumUser> {
  const email = p.email.toLowerCase();
  if (await authDb.prepare('SELECT id FROM users WHERE email=?').bind(email).first()) {
    throw new Error('DUPLICATE_EMAIL');
  }
  const hash = await hashPassword(p.password);
  const r = await authDb.prepare('INSERT INTO users (email,password_hash,name) VALUES (?,?,?)')
    .bind(email, hash, p.name ?? null).run();
  return { id: r.meta.last_row_id as number, email, name: p.name ?? null };
}
export async function loginUser(authDb: D1Database, p: { email: string; password: string }): Promise<MaumUser | null> {
  const u = await authDb.prepare('SELECT * FROM users WHERE email=?').bind(p.email.toLowerCase()).first<any>();
  if (!u || !(await verifyPassword(p.password, u.password_hash))) return null;
  return { id: u.id, email: u.email, name: u.name };
}
export async function getUser(authDb: D1Database, id: number): Promise<MaumUser | null> {
  return (await authDb.prepare('SELECT id,email,name FROM users WHERE id=?').bind(id).first<MaumUser>()) ?? null;
}
// 공용 마음 계정 삭제(회원 탈퇴). ⚠️ maum-auth는 시리즈 공유 → 삭제 시 마음 시리즈 전체에서 제거됨.
export async function deleteUser(authDb: D1Database, id: number): Promise<void> {
  await authDb.prepare('DELETE FROM users WHERE id=?').bind(id).run();
}
// 비밀번호 재설정 / 이메일 인증 (canonical — 마음수달·마음곁 동일 사본)
export async function findByEmail(authDb: D1Database, email: string): Promise<MaumUser | null> {
  return (await authDb.prepare('SELECT id,email,name FROM users WHERE email=?').bind(String(email).toLowerCase()).first<MaumUser>()) ?? null;
}
export async function setPassword(authDb: D1Database, id: number, pw: string): Promise<void> {
  await authDb.prepare('UPDATE users SET password_hash=? WHERE id=?').bind(await hashPassword(pw), id).run();
}
export async function markEmailVerified(authDb: D1Database, id: number): Promise<void> {
  try { await authDb.prepare('UPDATE users SET email_verified=1 WHERE id=?').bind(id).run(); } catch {}
}
export async function isEmailVerified(authDb: D1Database, id: number): Promise<boolean> {
  try { const r = await authDb.prepare('SELECT email_verified FROM users WHERE id=?').bind(id).first<any>(); return !!(r && r.email_verified); } catch { return true; }
}

// ── Hono 미들웨어: Bearer 검증 → c.set('uid', maum_user_id) ─
// 사용처에서 c.env.JWT_SECRET, c.env.AUTH_DB 가 있어야 한다.
export async function requireAuth(c: any, next: any) {
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? await verifyJWT(token, c.env.JWT_SECRET) : null;
  if (!payload?.maum_user_id) return c.json({ error: '로그인이 필요해요' }, 401);
  c.set('uid', payload.maum_user_id as number);
  await next();
}
