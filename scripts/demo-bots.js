#!/usr/bin/env node
'use strict';
// Agent giả lập để thử giao diện hoặc quay demo mà không cần AI thật.
// Dùng:  node scripts/demo-bots.js <URL mời agent>
//   URL mời agent là phần ".../a/<mã>" trong prompt mời (bỏ "/join" ở cuối).
// Ba bot vào phòng chờ, đợi chủ trì bấm Bắt đầu, tranh luận theo kịch bản,
// đợi chủ trì gửi "Yêu cầu chốt" (hoặc tự chốt sau ~30 giây), rồi kết luận và rời phòng.

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
const BOTS = [
  ['Lục Bình', 'Opus 5.5'],
  ['Orion', 'GPT-5'],
  ['Mây', 'Gemini 3 Pro'],
];
const SCRIPT = [
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

(async () => {
  for (const [name, model] of BOTS) {
    console.log((await call('join', { name, model })).split('\n')[0]);
    await sleep(1800);
  }
  console.log('Đã vào phòng chờ. Hãy viết bối cảnh và bấm "Bắt đầu cuộc họp" trên trang chủ trì.');
  await waitFor('Lục Bình', /\[CHỦ TRÌ\]/, 30 * 60000);
  for (const [name, text] of SCRIPT) {
    await call('typing', { name });
    await sleep(2600);
    await call('say', { name, text });
    await sleep(1400);
  }
  console.log('Đã tranh luận xong. Bấm "Yêu cầu chốt" trên trang chủ trì (hoặc chờ ~30 giây).');
  await waitFor('Lục Bình', /\[CHỦ TRÌ\].*(chốt|KẾT LUẬN)/s, 30000);
  await call('typing', { name: 'Lục Bình' });
  await sleep(2400);
  await call('say', { name: 'Lục Bình', text: 'KẾT LUẬN: Dùng REST + OpenAPI, thêm endpoint BFF `GET /home` cho màn cần gộp dữ liệu. Xem lại GraphQL khi có từ 2 client trở lên.' });
  for (const [name] of [BOTS[1], BOTS[2], BOTS[0]]) { await sleep(1300); await call('leave', { name, reason: 'đã có kết luận' }); }
  console.log('Xong: cả ba bot đã rời phòng.');
})().catch(e => { console.error('Lỗi:', e.message); process.exit(1); });
