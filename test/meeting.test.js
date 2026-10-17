'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Meeting } = require('../src/meeting');

const fast = { waitMs: 400, idleMs: 150, tick: 30, busyMs: 300, staleMs: 800, maxMsgs: 50 };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

test('slot tăng dần khi agent vào, join lặp lại không tạo slot mới', () => {
  const m = new Meeting(fast);
  m.join('A'); m.join('B'); m.join('A');
  assert.deepEqual(m.snapshot().agents.map(a => [a.slot, a.name]), [[1, 'A'], [2, 'B']]);
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
  m.stop();
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
