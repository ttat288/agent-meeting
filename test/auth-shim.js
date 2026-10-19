'use strict';
// Cho test viết theo kiểu "gọi theo tên" (name=…) chạy qua lớp xác thực thật: bọc fetch, nhớ mã riêng mà join trả về
// cho từng tên, rồi tự gắn header Authorization (curl) hoặc Mcp-Session-Id (MCP) theo tên trong request.
// Test về chính lớp xác thực (thiếu mã, mã sai, giả tên) dùng fetch gốc: require('./auth-shim').raw.
const raw = globalThis.fetch;
const tokens = new Map(); // `/a/${id}|${tên thường}` -> mã (không theo cổng: server khởi động lại vẫn dùng mã cũ)
const lower = (x) => String(x ?? '').trim().toLowerCase();
const nameOf = (u, body) => {
  if (u.searchParams.get('name')) return u.searchParams.get('name');
  if (typeof body !== 'string') return '';
  try { const j = JSON.parse(body); if (j && typeof j === 'object') return j.params?.arguments?.name || j.name || ''; } catch {}
  return new URLSearchParams(body).get('name') || '';
};
const tokenFor = (api, name) => tokens.get(`${new URL(api).pathname}|${lower(name)}`);
const sidFor = (id, name) => `testsess-${id}-${Buffer.from(lower(name)).toString('hex')}`.slice(0, 120).padEnd(16, '0');

async function fetchWithAuth(url, init = {}) {
  const u = new URL(String(url));
  const headers = new Headers(init.headers || {});
  let m;
  if ((m = u.pathname.match(/^\/a\/(\w+)\/([\w/]+)$/)) && !headers.has('authorization')) {
    const api = `${u.origin}/a/${m[1]}`, name = nameOf(u, init.body);
    if (m[2] === 'join') {
      const r = await raw(url, init);
      const text = await r.text();
      const t = text.match(/Bearer ([\w-]+)/);
      const joined = text.match(/tên "([^"]+)"/);
      if (t) tokens.set(`${u.pathname.replace(/\/join$/, '')}|${lower(joined ? joined[1] : name)}`, t[1]);
      return new Response(text, { status: r.status, headers: r.headers });
    }
    const t = name && tokenFor(api, name);
    if (t) headers.set('authorization', `Bearer ${t}`);
  } else if ((m = u.pathname.match(/^\/mcp\/(\w+)$/)) && !headers.has('mcp-session-id')) {
    const name = nameOf(u, init.body);
    if (name) headers.set('mcp-session-id', sidFor(m[1], name));
  }
  return raw(url, { ...init, headers });
}
globalThis.fetch = fetchWithAuth;
module.exports = { raw, tokenFor, sidFor, authHeader: (api, name) => ({ authorization: `Bearer ${tokenFor(api, name)}` }) };
