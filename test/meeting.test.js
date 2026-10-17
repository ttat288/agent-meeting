'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Meeting } = require('../src/meeting');

const fast = { waitMs: 400, idleMs: 150, tick: 30, busyMs: 300, staleMs: 800, maxMsgs: 50 };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

test('slot tăng dần khi agent vào; trùng tên thì agent mới được đặt tên riêng', () => {
  const m = new Meeting(fast);
  m.join('A'); m.join('B');
  assert.match(m.join('A'), /tên "A-2"/);
  assert.deepEqual(m.snapshot().agents.map(a => [a.slot, a.name]), [[1, 'A'], [2, 'B'], [3, 'A-2']]);
});

test('agent đã rời có thể vào lại với tên cũ', () => {
  const m = new Meeting(fast);
  m.join('A'); m.join('B'); m.leave('A');
  assert.match(m.join('A'), /tên "A"/);
  assert.equal(m.snapshot().agents.length, 2);
});

test('agent chờ ở sảnh rồi nhận bối cảnh khi chủ trì bắt đầu', async () => {
  const m = new Meeting(fast);
  m.join('A');
  const p = m.wait('A');
  setTimeout(() => m.start('Bàn về tab vs space', ''), 50);
  assert.match(await p, /\[CHỦ TRÌ\] Bàn về tab vs space/);
});

test('A nói, B nghe được; người nói không nhận lại tin của mình', async () => {
  const m = new Meeting({ ...fast, idleMs: 60000 });
  m.join('A'); m.join('B'); m.start('x', '');
  await m.wait('A'); await m.wait('B');
  const p = m.wait('B');
  m.say('A', 'xin chào');
  assert.match(await p, /\[A\] xin chào/);
  assert.match(await m.wait('A'), /Chưa có tin mới|vào phòng/); // A không nhận lại tin của chính mình
});

test('im lặng: chỉ agent slot nhỏ nhất bị hỏi, agent kia không', async () => {
  const m = new Meeting(fast);
  m.join('A'); m.join('B'); m.start('x', '');
  await m.wait('A'); await m.wait('B');
  await sleep(200);
  const [ra, rb] = await Promise.all([m.wait('A'), m.wait('B')]);
  assert.match(ra, /Bạn được chọn để quyết định/);
  assert.match(rb, /Chưa có tin mới/);
});

test('không kiểm tra im lặng khi có agent đang soạn tin (typing)', async () => {
  const m = new Meeting({ ...fast, busyMs: 5000, staleMs: 9000 });
  m.join('A'); m.join('B'); m.start('x', '');
  await m.wait('A'); await m.wait('B');
  m.typing('B');
  await sleep(200);
  assert.match(await m.wait('A'), /Chưa có tin mới/);
});

test('leave thông báo cho người còn lại, người cuối cùng được nhắc rời', async () => {
  const m = new Meeting(fast);
  m.join('A'); m.join('B'); m.start('x', '');
  await m.wait('A'); await m.wait('B');
  const p = m.wait('B');
  m.leave('A', 'xong');
  const out = await p;
  assert.match(out, /A đã rời phòng: xong/);
  assert.match(out, /người duy nhất còn lại/);
});

test('tất cả rời thì cuộc họp tự kết thúc', async () => {
  const m = new Meeting(fast);
  m.join('A'); m.join('B'); m.start('x', '');
  m.leave('A'); m.leave('B');
  assert.equal(m.state, 'ENDED');
  assert.match(await m.wait('A'), /đã rời|kết thúc/);
});

test('chủ trì dừng thì mọi tool báo kết thúc', async () => {
  const m = new Meeting(fast);
  m.join('A'); m.start('x', '');
  m.typing('A');
  m.stop();
  assert.equal(m.snapshot().agents[0].status, 'ended');
  assert.match(m.say('A', 'hi'), /đã kết thúc/);
  assert.match(await m.wait('A'), /đã kết thúc/);
});

test('agent im bặt quá lâu bị coi là đã rời để không chặn cuộc họp', async () => {
  const m = new Meeting(fast);
  m.join('A'); m.join('B'); m.start('x', '');
  await m.wait('A');       // B join rồi biến mất
  await sleep(900);
  await m.wait('A');
  assert.equal(m.snapshot().agents.find(a => a.name === 'B').status, 'left');
});

test('đạt giới hạn tin nhắn thì kết thúc', () => {
  const m = new Meeting({ ...fast, maxMsgs: 2 });
  m.join('A'); m.start('x', '');
  m.say('A', '1'); m.say('A', '2');
  assert.equal(m.state, 'ENDED');
});

test('long-poll trả về ngay khi có thay đổi và treo khi không có', async () => {
  const m = new Meeting(fast);
  const v0 = m.snapshot().version;
  const p = m.changedSince(v0, 1000);
  setTimeout(() => m.join('A'), 30);
  const s = await p;
  assert.ok(s.version > v0);
  assert.equal(s.agents.length, 1);
  const t0 = Date.now();
  await m.changedSince(s.version, 120);
  assert.ok(Date.now() - t0 >= 100);
});
