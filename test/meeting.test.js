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

// ---------- v2 ----------
const turns = { ...fast, mode: 'turns', busyMs: 5000, staleMs: 9000 };

test('lần lượt: chỉ người có lượt được nói, lượt chuyển theo slot', async () => {
  const m = new Meeting(turns);
  m.join('A'); m.join('B'); m.start('x', '');
  assert.match(await m.wait('A'), /TỚI LƯỢT BẠN/);
  assert.match(m.say('B', 'chen ngang'), /Chưa tới lượt bạn/);
  assert.match(m.say('A', 'ý của A'), /Đã gửi/);
  const rb = await m.wait('B');
  assert.match(rb, /\[A\] ý của A/);
  assert.match(rb, /TỚI LƯỢT BẠN/);
  assert.equal(m.snapshot().turn, 'B');
});

test('lần lượt: cả vòng đều bỏ lượt thì kết thúc', async () => {
  const m = new Meeting(turns);
  m.join('A'); m.join('B'); m.start('x', '');
  await m.wait('A'); m.pass('A');
  await m.wait('B'); m.pass('B');
  assert.equal(m.state, 'ENDED');
  assert.match(m.endReason, /không còn ý kiến/);
});

test('lần lượt: người giữ lượt rời phòng thì lượt chuyển cho người kế', () => {
  const m = new Meeting(turns);
  m.join('A'); m.join('B'); m.join('C'); m.start('x', '');
  m.leave('A');
  assert.equal(m.snapshot().turn, 'B');
});

test('lần lượt: giữ lượt quá lâu thì tự bỏ lượt', async () => {
  const m = new Meeting({ ...turns, busyMs: 150, staleMs: 5000 });
  m.join('A'); m.join('B'); m.start('x', '');
  await m.wait('B');                 // B nghe, A có lượt nhưng không làm gì
  await sleep(200);
  await m.wait('B');
  assert.ok(m.log.some(x => /A quá thời gian/.test(x.text)));
});

test('chủ trì nhắn giữa cuộc họp: agent nhận được [CHỦ TRÌ]', async () => {
  const m = new Meeting({ ...fast, idleMs: 60000 });
  m.join('A'); m.start('x', '');
  await m.wait('A');
  const p = m.wait('A');
  assert.equal(m.hostSay('Hãy chốt đi'), true);
  assert.match(await p, /\[CHỦ TRÌ\] Hãy chốt đi/);
  assert.equal(new Meeting().hostSay('chưa họp'), false);
});

test('kick: agent bị mời ra nhận thông báo và không vào lại được', async () => {
  const m = new Meeting(fast);
  m.join('A'); m.join('B'); m.start('x', '');
  assert.equal(m.kick('B'), true);
  assert.match(await m.wait('B'), /mời bạn ra/);
  assert.match(m.join('B'), /mời bạn ra/);
  assert.equal(m.snapshot().agents.find(a => a.name === 'B').status, 'kicked');
});

test('giới hạn thời gian: hết giờ thì kết thúc', async () => {
  const m = new Meeting({ ...fast, timeLimitMin: 0.004 }); // ~240ms
  m.join('A'); m.start('x', '');
  assert.ok(m.endsAt > m.startedAt);
  await sleep(350);
  assert.equal(m.state, 'ENDED');
  assert.equal(m.endReason, 'hết thời gian');
});

test('cấu hình từ chủ trì bị giới hạn trong khoảng hợp lệ', () => {
  const m = new Meeting();
  m.start('x', '', { maxMsgs: 999999, idleSec: 1, timeLimitMin: -5, mode: 'turns' });
  assert.deepEqual(m.snapshot().settings, { mode: 'turns', maxMsgs: 1000, idleSec: 10, timeLimitMin: 0 });
  assert.equal(m.configure({ maxMsgs: 5 }), false); // đã họp thì không đổi được
});

test('tin quá dài bị cắt và agent được báo', () => {
  const m = new Meeting(fast);
  m.join('A'); m.start('x', '');
  assert.match(m.say('A', 'x'.repeat(5000)), /bị cắt/);
  assert.equal(m.log.at(-1).text.length, 4000);
});

test('tin KẾT LUẬN được đánh dấu', () => {
  const m = new Meeting(fast);
  m.join('A'); m.start('x', '');
  m.say('A', 'KẾT LUẬN: chọn Go');
  m.say('A', '**Kết luận:** vẫn là Go');
  m.say('A', 'chưa kết luận gì');
  assert.deepEqual(m.log.filter(x => x.type === 'chat').map(x => !!x.conclusion), [true, true, false]);
});

test('tên có dấu cách được mã hoá trong lệnh curl của giao thức', () => {
  const m = new Meeting(fast);
  const out = m.join('Trợ lý A', { base: 'http://x/a/1' });
  assert.ok(out.includes('wait?name=Tr%E1%BB%A3%20l%C3%BD%20A'));
});

test('snapshot chỉ gửi phần log mới', () => {
  const m = new Meeting(fast);
  m.join('A'); m.join('B');
  const s = m.snapshot(1);
  assert.equal(s.logFrom, 1);
  assert.equal(s.log.length, 1);
  assert.equal(m.snapshot(99).logFrom, 0); // vượt quá thì gửi lại từ đầu
});

test('ở phòng chờ, nhận thông báo hệ thống không bị coi là đang soạn tin', async () => {
  const m = new Meeting(fast);
  m.join('A'); m.join('B');
  await m.wait('A'); // nhận "B đã vào phòng"
  assert.notEqual(m.snapshot().agents[0].status, 'thinking');
});

test('chủ trì mời agent ra ngay từ phòng chờ', () => {
  const m = new Meeting(fast);
  m.join('A'); m.join('Lạ');
  assert.equal(m.kick('Lạ'), true);
  assert.equal(m.state, 'LOBBY');
  assert.match(m.join('Lạ'), /mời bạn ra/);
});
