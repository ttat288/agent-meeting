#!/usr/bin/env node
'use strict';
// Agent giả lập để thử giao diện hoặc quay demo mà không cần AI thật.
// Dùng:  node scripts/demo-bots.js <URL mời agent> [--en]
//   --en: bot nói tiếng Anh (cho demo với trang chủ trì tiếng Anh); từ khoá giao thức (KẾT LUẬN, VIỆC, XONG MỤC) giữ nguyên.
//   URL mời agent là phần ".../a/<mã>" trong prompt mời (bỏ "/join" ở cuối).
// Ba bot vào phòng chờ, đợi chủ trì bấm Bắt đầu, tranh luận theo kịch bản,
// đợi chủ trì gửi "Yêu cầu chốt" (hoặc tự chốt sau ~30 giây), rồi kết luận và rời phòng.
// Nếu phòng bật "Giữ phòng để báo tiến độ", sau khi rời các bot lần lượt báo tiến độ việc của mình (có một lần "vướng"),
// và Lục Bình gửi tệp openapi.yaml riêng cho Mây qua server (Mây chờ tệp bằng files?wait=1 rồi tải về).

const base = (process.argv[2] || '').replace(/\/join\/?$/, '').replace(/\/$/, '');
if (!/\/a\/\w+$/.test(base)) {
  console.error('Dùng: node scripts/demo-bots.js http://localhost:3000/a/<mã>');
  process.exit(1);
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const call = async (tool, args) => {
  const r = await fetch(`${base}/${tool}`, { method: 'POST', body: new URLSearchParams(args) });
  return r.text();
};
const EN = process.argv.includes('--en');
const [A, B, C] = EN ? ['Lucas', 'Orion', 'Maya'] : ['Lục Bình', 'Orion', 'Mây'];
const BOTS = [
  [A, 'Opus 5.5'],
  [B, 'GPT-5'],
  [C, 'Gemini 3 Pro'],
];
const SCRIPT = EN ? [
  [A, 'I vote for **REST**:\n- A team of 4, only one mobile client\n- OpenAPI can generate the client\n- HTTP caching and CDN work out of the box'],
  [B, 'GraphQL shines when a screen combines several data sources. Take the Home screen:\n```graphql\n{ me { name } feed(first: 10) { title } notifications { count } }\n```\nREST would need 3 requests.'],
  [C, 'Agreed on the Home screen, but a BFF endpoint `GET /home` solves that too, without a new schema, resolvers and tooling.'],
  [B, 'Fair. With one client and a small team, the learning and running cost of GraphQL is not worth it yet. I lean to REST + BFF.'],
] : [
  ['Lục Bình', 'Mình chọn **REST**:\n- Team 4 người, chỉ có 1 client mobile\n- Có sẵn OpenAPI để sinh client\n- Cache HTTP và CDN dùng ngay được'],
  ['Orion', 'GraphQL có lợi khi màn hình cần gộp nhiều nguồn dữ liệu. Ví dụ màn Home:\n```graphql\n{ me { name } feed(first: 10) { title } notifications { count } }\n```\nREST sẽ cần 3 request.'],
  ['Mây', 'Đồng ý với Orion về màn Home, nhưng một endpoint BFF `GET /home` cũng giải quyết được mà không thêm schema, resolver và tooling mới.'],
  ['Orion', 'Hợp lý. Với một client và team nhỏ, chi phí học và vận hành GraphQL chưa đáng. Mình nghiêng về REST + BFF.'],
];

async function waitFor(name, pattern, maxMs) {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    const out = await call('wait', { name });
    if (pattern.test(out)) return out;
    if (/đã kết thúc|đã rời/.test(out) && !/\[/.test(out)) process.exit(0);
  }
  return null;
}

const AGENDA_2 = EN ? [
  [B, 'On auth: use **OAuth 2.0 + PKCE** through an existing provider (Keycloak or Auth0), do not roll our own.'],
  [A, 'Agreed. Add rotating refresh tokens and a 15-minute access token lifetime.'],
] : [
  ['Orion', 'Về xác thực: dùng **OAuth 2.0 + PKCE** qua nhà cung cấp có sẵn (Keycloak hoặc Auth0), không tự viết.'],
  ['Lục Bình', 'Đồng ý. Thêm refresh token xoay vòng và thời hạn access token 15 phút.'],
];

(async () => {
  for (const [name, model] of BOTS) {
    console.log((await call('join', { name, model })).split('\n')[0]);
    await sleep(1800);
  }
  console.log('Đã vào phòng chờ. Hãy viết bối cảnh và bấm "Bắt đầu cuộc họp" trên trang chủ trì.');
  const opening = await waitFor(A, /\[CHỦ TRÌ\]/, 30 * 60000);
  const agenda = /Chương trình họp/.test(opening || '');
  const speak = async (name, text) => { await call('typing', { name }); await sleep(2600); await call('say', { name, text }); await sleep(1400); };
  for (const [name, text] of SCRIPT) await speak(name, text);
  if (agenda) {
    await speak(C, EN ? 'XONG MỤC 1: REST + OpenAPI, plus a BFF endpoint `GET /home` for the screen that combines data.'
      : 'XONG MỤC 1: Dùng REST + OpenAPI, thêm endpoint BFF `GET /home` cho màn cần gộp dữ liệu.');
    for (const [name, text] of AGENDA_2) await speak(name, text);
  }
  console.log('Đã tranh luận xong. Bấm "Yêu cầu chốt" trên trang chủ trì (hoặc chờ ~30 giây).');
  await waitFor(A, /\[CHỦ TRÌ\].*(chốt|KẾT LUẬN)/s, 30000);
  if (EN) await speak(A, (agenda ? 'XONG MỤC 2: OAuth 2.0 + PKCE via Keycloak, 15-minute access tokens, rotating refresh tokens.\n' : '') +
    'KẾT LUẬN: REST + OpenAPI with a BFF `GET /home`' + (agenda ? '; auth with OAuth 2.0 + PKCE via Keycloak.' : '.') +
    `\nVIỆC: ${A} | Write the OpenAPI spec for the 12 endpoints | Friday\nVIỆC: ${B} | Set up Keycloak with PKCE | next Wednesday\nVIỆC: ${C} | Build the BFF endpoint \`GET /home\` | Friday`);
  else await speak(A, (agenda ? 'XONG MỤC 2: OAuth 2.0 + PKCE qua Keycloak, access token 15 phút, refresh token xoay vòng.\n' : '') +
    'KẾT LUẬN: Dùng REST + OpenAPI, thêm BFF `GET /home`' + (agenda ? '; xác thực bằng OAuth 2.0 + PKCE qua Keycloak.' : '.') +
    '\nVIỆC: Lục Bình | Viết đặc tả OpenAPI cho 12 endpoint | thứ 6\nVIỆC: Orion | Dựng Keycloak và cấu hình PKCE | thứ 4 tuần sau\nVIỆC: Mây | Làm endpoint BFF `GET /home` | thứ 6');
  const tasks = {};
  for (const [name] of [BOTS[1], BOTS[2], BOTS[0]]) {
    await sleep(1300);
    const out = await call('leave', { name, reason: EN ? 'conclusion reached' : 'đã có kết luận' });
    tasks[name] = /Việc của bạn chưa xong/.test(out) ? [...out.matchAll(/^- #(\d+) /gm)].map(m => m[1]) : [];
  }
  console.log('Xong: cả ba bot đã rời phòng.');
  if (!Object.values(tasks).some(t => t.length)) return;
  // giai đoạn thực hiện: mỗi bot báo việc đầu tiên ghi tên mình
  const OPENAPI = `openapi: 3.1.0\ninfo: { title: App API, version: 1.0.0 }\npaths:\n  /home:\n    get:\n      summary: ${EN ? 'Home screen data (BFF)' : 'Dữ liệu màn Home (BFF)'}\n      responses: { "200": { description: OK } }\n`;
  const mayWaits = call('files', { name: C, wait: '1' }); // Mây chờ đặc tả của Lục Bình (chặn tới khi có tệp mới)
  const report = async (name, status, note) => { const n = tasks[name][0]; if (n) { await sleep(4000); await call('progress', { name, task: n, status, note }); } };
  console.log('Phòng đang ở giai đoạn thực hiện: các bot sẽ báo tiến độ.');
  await report(C, EN ? 'doing' : 'đang làm', EN ? 'Scaffolded `GET /home`, writing tests' : 'Đã dựng khung `GET /home`, đang viết test');
  await report(A, EN ? 'done' : 'xong', EN ? 'PR #12 openapi.yaml (12 endpoints), CI green' : 'PR #12 openapi.yaml (12 endpoint), CI xanh');
  await sleep(2500);
  const q = new URLSearchParams({ name: A, to: C, file: 'openapi.yaml', note: EN ? 'spec for GET /home, generate the client from it' : 'đặc tả cho GET /home, sinh client từ đây' });
  console.log((await (await fetch(`${base}/send?${q}`, { method: 'POST', body: OPENAPI })).text()).split(':')[0]);
  const url = (await mayWaits).match(/Tải: curl -sSf -o "[^"]+" "([^"]+)"/)?.[1];
  if (url) await (await fetch(url)).arrayBuffer(); // C tải về
  await report(B, EN ? 'blocked' : 'vướng', EN ? 'Waiting for the infra team to assign a domain for Keycloak' : 'Chờ cấp domain cho Keycloak từ đội hạ tầng');
  await report(C, EN ? 'done' : 'xong', EN ? 'commit 3f2a9c1, client generated from openapi.yaml (sha256 matches), 8 new tests pass' : 'commit 3f2a9c1, client sinh từ openapi.yaml (sha256 khớp), 8 test mới đều qua');
  await sleep(4000);
  await report(B, EN ? 'done' : 'xong', EN ? 'Keycloak running at auth.example.com, PKCE enabled' : 'Keycloak chạy ở auth.example.com, PKCE đã bật');
  console.log('Xong: mọi việc đã báo xong.');
})().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
