'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Meeting } = require('../src/meeting');

const fast = { waitMs: 400, idleMs: 150, tick: 30, busyMs: 300, staleMs: 800, maxMsgs: 50 };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

test('slot tăng dần khi agent vào; tên và model được ghi nhận', () => {
  const m = new Meeting(fast);
  assert.match(m.join('Claude', 'Opus 5.5'), /tên "Claude", model Opus 5.5 \(slot 1\)/);
  m.join('GPT', 'GPT-5');
  assert.deepEqual(m.snapshot().agents.map(a => [a.slot, a.name, a.model]), [[1, 'Claude', 'Opus 5.5'], [2, 'GPT', 'GPT-5']]);
});

test('trùng tên thì bị từ chối và phải đặt tên khác (không phân biệt hoa thường)', () => {
  const m = new Meeting(fast);
  m.join('Claude', 'Opus 5.5');
  const r = m.join('claude', 'Sonnet 5.5');
  assert.match(r, /đã có agent khác dùng.*chọn một tên KHÁC/s);
  assert.equal(m.snapshot().agents.length, 1);
  assert.match(m.join('Claude Sonnet', 'Sonnet 5.5'), /slot 2/);
});

test('bắt buộc tự đặt tên và khai báo model', () => {
  const m = new Meeting(fast);
  assert.match(m.join('', 'Opus 5.5'), /Thiếu tên/);
  assert.match(m.join('Claude', ''), /Thiếu model/);
  assert.match(m.join('Claude'), /Thiếu model/);
  assert.equal(m.snapshot().agents.length, 0);
});

test('tên của agent đã rời: cùng model thì vào lại được, khác model thì bị coi là trùng', () => {
  const m = new Meeting(fast);
  m.join('A', 'Opus 5.5'); m.join('B', 'GPT-5'); m.leave('A');
  assert.match(m.join('A', 'GPT-5'), /đã có agent khác dùng/);
  assert.match(m.join('a', 'opus 5.5'), /tên "A"/);
  assert.equal(m.snapshot().agents.length, 2);
});

test('agent đã rời có thể vào lại với tên cũ', () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.join('B', 'test'); m.leave('A');
  assert.match(m.join('A', 'test'), /tên "A"/);
  assert.equal(m.snapshot().agents.length, 2);
});

test('agent chờ ở sảnh rồi nhận bối cảnh khi chủ trì bắt đầu', async () => {
  const m = new Meeting(fast);
  m.join('A', 'test');
  const p = m.wait('A');
  setTimeout(() => m.start('Bàn về tab vs space', ''), 50);
  assert.match(await p, /\[CHỦ TRÌ\] Bàn về tab vs space/);
});

test('A nói, B nghe được; người nói không nhận lại tin của mình', async () => {
  const m = new Meeting({ ...fast, idleMs: 60000 });
  m.join('A', 'test'); m.join('B', 'test'); m.start('x', '');
  await m.wait('A'); await m.wait('B');
  const p = m.wait('B');
  m.say('A', 'xin chào');
  assert.match(await p, /\[A\] xin chào/);
  assert.match(await m.wait('A'), /Chưa có tin mới|vào phòng/); // A không nhận lại tin của chính mình
});

test('im lặng: chỉ agent slot nhỏ nhất bị hỏi, agent kia không', async () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.join('B', 'test'); m.start('x', '');
  await m.wait('A'); await m.wait('B');
  await sleep(200);
  const [ra, rb] = await Promise.all([m.wait('A'), m.wait('B')]);
  assert.match(ra, /Bạn được chọn để quyết định/);
  assert.match(rb, /Chưa có tin mới/);
});

test('không kiểm tra im lặng khi có agent đang soạn tin (typing)', async () => {
  const m = new Meeting({ ...fast, busyMs: 5000, staleMs: 9000 });
  m.join('A', 'test'); m.join('B', 'test'); m.start('x', '');
  await m.wait('A'); await m.wait('B');
  m.typing('B');
  await sleep(200);
  assert.match(await m.wait('A'), /Chưa có tin mới/);
});

test('leave thông báo cho người còn lại, người cuối cùng được nhắc rời', async () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.join('B', 'test'); m.start('x', '');
  await m.wait('A'); await m.wait('B');
  const p = m.wait('B');
  m.leave('A', 'xong');
  const out = await p;
  assert.match(out, /A đã rời phòng: xong/);
  assert.match(out, /người duy nhất còn lại/);
});

test('tất cả rời thì cuộc họp tự kết thúc', async () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.join('B', 'test'); m.start('x', '');
  m.leave('A'); m.leave('B');
  assert.equal(m.state, 'ENDED');
  assert.match(await m.wait('A'), /đã rời|kết thúc/);
});

test('chủ trì dừng thì mọi tool báo kết thúc', async () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.start('x', '');
  m.typing('A');
  m.stop();
  assert.equal(m.snapshot().agents[0].status, 'ended');
  assert.match(m.say('A', 'hi'), /đã kết thúc/);
  assert.match(await m.wait('A'), /đã kết thúc/);
});

test('agent im bặt quá lâu bị coi là đã rời để không chặn cuộc họp', async () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.join('B', 'test'); m.start('x', '');
  await m.wait('A');       // B join rồi biến mất
  await sleep(900);
  await m.wait('A');
  assert.equal(m.snapshot().agents.find(a => a.name === 'B').status, 'left');
});

test('đạt giới hạn tin nhắn thì kết thúc', () => {
  const m = new Meeting({ ...fast, maxMsgs: 2 });
  m.join('A', 'test'); m.start('x', '');
  m.say('A', '1'); m.say('A', '2');
  assert.equal(m.state, 'ENDED');
});

test('long-poll trả về ngay khi có thay đổi và treo khi không có', async () => {
  const m = new Meeting(fast);
  const v0 = m.snapshot().version;
  const p = m.changedSince(v0, 1000);
  setTimeout(() => m.join('A', 'test'), 30);
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
  m.join('A', 'test'); m.join('B', 'test'); m.start('x', '');
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
  m.join('A', 'test'); m.join('B', 'test'); m.start('x', '');
  await m.wait('A'); m.pass('A');
  await m.wait('B'); m.pass('B');
  assert.equal(m.state, 'ENDED');
  assert.match(m.endReason, /không còn ý kiến/);
});

test('lần lượt: người giữ lượt rời phòng thì lượt chuyển cho người kế', () => {
  const m = new Meeting(turns);
  m.join('A', 'test'); m.join('B', 'test'); m.join('C', 'test'); m.start('x', '');
  m.leave('A');
  assert.equal(m.snapshot().turn, 'B');
});

test('lần lượt: giữ lượt quá lâu thì tự bỏ lượt', async () => {
  const m = new Meeting({ ...turns, busyMs: 150, staleMs: 5000 });
  m.join('A', 'test'); m.join('B', 'test'); m.start('x', '');
  await m.wait('B');                 // B nghe, A có lượt nhưng không làm gì
  await sleep(200);
  await m.wait('B');
  assert.ok(m.log.some(x => /A quá thời gian/.test(x.text)));
});

test('chủ trì nhắn giữa cuộc họp: agent nhận được [CHỦ TRÌ]', async () => {
  const m = new Meeting({ ...fast, idleMs: 60000 });
  m.join('A', 'test'); m.start('x', '');
  await m.wait('A');
  const p = m.wait('A');
  assert.equal(m.hostSay('Hãy chốt đi'), true);
  assert.match(await p, /\[CHỦ TRÌ\] Hãy chốt đi/);
  assert.equal(new Meeting().hostSay('chưa họp'), false);
});

test('kick: agent bị mời ra nhận thông báo và không vào lại được', async () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.join('B', 'test'); m.start('x', '');
  assert.equal(m.kick('B'), true);
  assert.match(await m.wait('B'), /mời bạn ra/);
  assert.match(m.join('B', 'test'), /mời bạn ra/);
  assert.equal(m.snapshot().agents.find(a => a.name === 'B').status, 'kicked');
});

test('giới hạn thời gian: hết giờ thì kết thúc', async () => {
  const m = new Meeting({ ...fast, timeLimitMin: 0.004 }); // ~240ms
  m.join('A', 'test'); m.start('x', '');
  assert.ok(m.endsAt > m.startedAt);
  await sleep(350);
  assert.equal(m.state, 'ENDED');
  assert.equal(m.endReason, 'hết thời gian');
});

test('cấu hình từ chủ trì bị giới hạn trong khoảng hợp lệ', () => {
  const m = new Meeting();
  m.start('x', '', { maxMsgs: 999999, idleSec: 1, timeLimitMin: -5, mode: 'turns' });
  assert.deepEqual(m.snapshot().settings, { mode: 'turns', maxMsgs: 1000, idleSec: 10, timeLimitMin: 0, followUp: false });
  assert.equal(m.configure({ maxMsgs: 5 }), false); // đã họp thì không đổi được
});

test('tin quá dài bị cắt và agent được báo', () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.start('x', '');
  assert.match(m.say('A', 'x'.repeat(5000)), /bị cắt/);
  assert.equal(m.log.at(-1).text.length, 4000);
});

test('tin KẾT LUẬN được đánh dấu', () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.start('x', '');
  m.say('A', 'KẾT LUẬN: chọn Go');
  m.say('A', '**Kết luận:** vẫn là Go');
  m.say('A', 'chưa kết luận gì');
  assert.deepEqual(m.log.filter(x => x.type === 'chat').map(x => !!x.conclusion), [true, true, false]);
});

test('tên có dấu cách được mã hoá trong lệnh curl của giao thức', () => {
  const m = new Meeting(fast);
  const out = m.join('Trợ lý A', 'test', { base: 'http://x/a/1' });
  assert.ok(out.includes('wait?name=Tr%E1%BB%A3%20l%C3%BD%20A'));
});

test('snapshot chỉ gửi phần log mới', () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.join('B', 'test');
  const s = m.snapshot(1);
  assert.equal(s.logFrom, 1);
  assert.equal(s.log.length, 1);
  assert.equal(m.snapshot(99).logFrom, 0); // vượt quá thì gửi lại từ đầu
});

test('ở phòng chờ, nhận thông báo hệ thống không bị coi là đang soạn tin', async () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.join('B', 'test');
  await m.wait('A'); // nhận "B đã vào phòng"
  assert.notEqual(m.snapshot().agents[0].status, 'thinking');
});

test('chủ trì mời agent ra ngay từ phòng chờ', () => {
  const m = new Meeting(fast);
  m.join('A', 'test'); m.join('Lạ', 'test');
  assert.equal(m.kick('Lạ'), true);
  assert.equal(m.state, 'LOBBY');
  assert.match(m.join('Lạ', 'test'), /mời bạn ra/);
});

test('bỏ tiền tố tên của chính người nói ([Tên], **Tên**:, Tên:)', () => {
  const m = new Meeting(fast);
  m.join('Haiku', 'test'); m.join('GPT-5.1', 'test'); m.start('x', '');
  m.say('Haiku', '[Haiku] Lập trường KHÔNG');
  m.say('Haiku', '**Haiku:** ý hai');
  m.say('GPT-5.1', 'GPT-5.1: ý ba');
  m.say('Haiku', '[GPT-5.1] không phải tên mình thì giữ nguyên');
  assert.deepEqual(m.log.filter(x => x.type === 'chat').map(x => x.text),
    ['Lập trường KHÔNG', 'ý hai', 'ý ba', '[GPT-5.1] không phải tên mình thì giữ nguyên']);
  assert.match(m.say('Haiku', '[Haiku]   '), /Tin trống/);
});

// ---------- v3: kết quả có cấu trúc, chương trình họp, vai trò, nhắn riêng ----------
test('việc cần làm: đọc dòng VIỆC trong tin, gộp việc trùng', () => {
  const m = new Meeting(fast);
  m.join('A', 'x'); m.start('x', '');
  m.say('A', 'KẾT LUẬN: chốt REST.\nVIỆC: Lan | Viết OpenAPI spec | thứ 6\n- **VIỆC:** Minh | Dựng CI\nVIỆC: Dọn backlog');
  m.say('A', 'VIỆC: Hùng | viết openapi spec | thứ 5');
  assert.deepEqual(m.actions.map(a => [a.owner, a.task, a.due]), [
    ['Hùng', 'Viết OpenAPI spec', 'thứ 5'], ['Minh', 'Dựng CI', ''], ['', 'Dọn backlog', '']]);
  assert.equal(m.log.find(x => x.type === 'chat').conclusion, true);
});

test('chương trình họp: XONG MỤC chuyển mục, hết mục thì nhắc kết luận tổng hợp', () => {
  const m = new Meeting(fast);
  m.join('A', 'x'); m.start('x', '', { agenda: '1. Chọn DB\n2. Chọn auth\n3. Chia việc' });
  assert.deepEqual(m.agenda, ['Chọn DB', 'Chọn auth', 'Chia việc']);
  assert.match(m.log.find(x => x.type === 'host').text, /Chương trình họp \(3 mục.*XONG MỤC <số>: <tóm tắt.*Bắt đầu với mục 1: Chọn DB/s);
  m.say('A', 'XONG MỤC 9: không có mục này'); // số mục không tồn tại thì bỏ qua
  assert.equal(m.agendaIndex, 0);
  m.say('A', 'XONG MỤC 1: dùng Postgres');
  assert.equal(m.agendaIndex, 1);
  assert.match(m.log.at(-1).text, /Chuyển sang mục 2\/3: Chọn auth/);
  m.say('A', 'XONG MỤC 1: nói lại mục cũ'); // mục đã xong và có tóm tắt thì bỏ qua
  assert.equal(m.agendaIndex, 1);
  assert.equal(m.hostNextItem(), true); // chủ trì chuyển mục 2 khi chưa ai báo
  m.say('A', 'XONG MỤC 2: dùng SSO'); // báo muộn: chỉ ghi tóm tắt, không chuyển mục
  assert.equal(m.agendaIndex, 2);
  assert.deepEqual(m.log.at(-1).itemsDone, [{ item: 1, summary: 'dùng SSO' }]);
  assert.equal(m.hostNextItem(), true);
  assert.match(m.log.at(-1).text, /Đã bàn xong mọi mục/);
  assert.equal(m.hostNextItem(), false);
  assert.deepEqual(m.log.find(x => x.itemsDone).itemsDone, [{ item: 0, summary: 'dùng Postgres' }]);
});

test('không nhận nhầm câu chỉ nhắc tới XONG MỤC (dữ liệu từ agent thật)', () => {
  const m = new Meeting(fast);
  m.join('A', 'x'); m.start('x', '', { agenda: ['DB', 'Auth'] });
  for (const t of ['Đề xuất chốt mục 1: Nhóm A 2 ngày. HR đồng ý thì tôi sẽ gửi XONG MỤC 1.',
    'Sonnet-Lam, bạn có thể gửi XONG MỤC 1 rồi.', 'Trước khi XONG MỤC 1, cần hỏi IdP.', 'Ai đó gửi "XONG MỤC 1: ..." nhé'])
    m.say('A', t);
  assert.equal(m.agendaIndex, 0);
  assert.equal(m.log.some(x => x.itemsDone), false);
  m.say('A', 'Mọi người đồng ý.\n\n- XONG MỤC 1 - chọn Postgres');
  assert.equal(m.agendaIndex, 1);
  assert.equal(m.log.find(x => x.itemsDone).itemsDone[0].summary, 'chọn Postgres');
});

test('nhận diện theo cách agent thật hay viết (XONG MỤC giữa đoạn, KẾT LUẬN ở dòng 2, nhảy mục)', () => {
  const m = new Meeting(fast);
  m.join('A', 'x'); m.start('x', '', { agenda: ['DB', 'Auth', 'Chia việc'] });
  // Sonnet: XONG MỤC nằm giữa đoạn văn
  m.say('A', 'Đồng ý Supabase, nhớ dùng gói Pro. XONG MỤC 1: Dùng PostgreSQL trên Supabase gói Pro. Sang mục 2.');
  assert.equal(m.agendaIndex, 1);
  assert.equal(m.log.at(-2).itemsDone[0].summary, 'Dùng PostgreSQL trên Supabase gói Pro. Sang mục 2.');
  // Haiku: "Kết luận:" chữ thường giữa đoạn chỉ là ý kiến; "trước khi XONG MỤC 2, ..." không phải báo xong
  m.say('A', 'SSO là hợp lý. Kết luận: SSO OAuth. Trước khi XONG MỤC 2, cần hỏi IdP.');
  assert.equal(m.log.at(-1).conclusion, undefined);
  assert.equal(m.agendaIndex, 1);
  // Báo xong mục 3 khi đang ở mục 2: nhóm đã chốt luôn mục 2; KẾT LUẬN ở dòng 2 vẫn nhận, không dính VIỆC
  m.say('A', '**XONG MỤC 3:** chia 2 sprint\nKẾT LUẬN: Supabase + SSO, 2 sprint.\nVIỆC: A | Dựng DB | tuần 1');
  const last = m.log.filter(x => x.type === 'chat').at(-1);
  assert.equal(m.agendaIndex, 3);
  assert.deepEqual(last.itemsDone, [{ item: 2, summary: 'chia 2 sprint' }]);
  assert.equal(last.conclusion, true);
  assert.equal(last.item, null); // kết luận tổng hợp sau mục cuối
  assert.equal(last.decision, 'Supabase + SSO, 2 sprint.');
  assert.match(m.log.at(-1).text, /Đã bàn xong mọi mục/);
  // KẾT LUẬN viết HOA sau dấu hết câu, và XONG MỤC đứng một mình rồi tóm tắt ở dòng dưới
  const n = new Meeting(fast);
  n.join('B', 'x'); n.start('x', '', { agenda: ['DB', 'Auth'] });
  n.say('B', 'XONG MỤC 1\nChọn Postgres.\nVIỆC: B | Viết schema');
  n.say('B', 'Mọi người đồng ý. KẾT LUẬN: Postgres + SSO.');
  assert.equal(n.log.find(x => x.itemsDone).itemsDone[0].summary, 'Chọn Postgres.');
  const c = n.log.filter(x => x.conclusion);
  assert.equal(c.length, 1);
  assert.equal(c[0].decision, 'Postgres + SSO.');
  assert.equal(c[0].item, 1);
});

test('việc nhắc lại với câu chữ hơi khác được gộp (dữ liệu từ agent thật); việc khác nhau thì giữ', () => {
  const m = new Meeting(fast);
  m.join('S', 'x'); m.join('H', 'x'); m.start('x', '');
  m.say('S', 'KẾT LUẬN: 2 cổng.\nVIỆC: S | PaymentProvider interface, bảng subscription/invoice, webhook idempotent, Stripe, PayOS, đối soát hằng ngày | Tuần 5\nVIỆC: H | Template email/SMS nhắc gia hạn VN+Anh, chính sách refund hiển thị, FAQ kỹ thuật thanh toán/refund, hướng dẫn QR, tuyển khách beta | Tuần 6');
  m.say('S', 'KẾT LUẬN: 2 cổng, 7 tuần.\nVIỆC: S | PaymentProvider interface, bảng subscription/invoice, webhook idempotent, tích hợp Stripe và PayOS, đối soát hằng ngày | Tuần 5\nVIỆC: H | Template email/SMS nhắc gia hạn VN+Anh, chính sách refund hiển thị, FAQ kỹ thuật thanh toán, hướng dẫn QR, tuyển khách beta | Tuần 6');
  m.say('H', 'VIỆC: S | Viết test cho API A\nVIỆC: S | Viết test cho API B');
  assert.deepEqual(m.actions.map(a => a.task), [
    'PaymentProvider interface, bảng subscription/invoice, webhook idempotent, tích hợp Stripe và PayOS, đối soát hằng ngày',
    'Template email/SMS nhắc gia hạn VN+Anh, chính sách refund hiển thị, FAQ kỹ thuật thanh toán, hướng dẫn QR, tuyển khách beta',
    'Viết test cho API A', 'Viết test cho API B']);
});

test('vai trò: có trong tin mở đầu; đổi khi đang họp thì chỉ agent đó nhận', async () => {
  const m = new Meeting({ ...fast, idleMs: 60000 });
  m.join('A', 'x'); m.join('B', 'x');
  assert.equal(m.setRole('A', 'phản biện'), true);
  m.start('x', '');
  assert.match(m.log.find(x => x.type === 'host').text, /Vai trò:\n- A: phản biện/);
  await m.wait('A'); await m.wait('B');
  m.setRole('B', 'thư ký');
  assert.match(await m.wait('B'), /\[CHỦ TRÌ → riêng bạn\] Vai trò của bạn từ giờ: thư ký/);
  assert.doesNotMatch(await m.wait('A'), /thư ký/);
  assert.equal(m.snapshot().agents.find(a => a.name === 'B').role, 'thư ký');
});

test('nhắn riêng: chỉ người nhận thấy, history không lộ cho người khác', async () => {
  const m = new Meeting({ ...fast, idleMs: 60000 });
  m.join('A', 'x'); m.join('B', 'x'); m.start('x', '');
  await m.wait('A'); await m.wait('B');
  assert.equal(m.hostSay('chỉ cho B', 'B'), true);
  assert.equal(m.hostSay('không ai', 'Z'), false);
  assert.match(await m.wait('B'), /riêng bạn\] chỉ cho B/);
  assert.match(await m.wait('A'), /Chưa có tin mới/);
  assert.doesNotMatch(m.history('A'), /chỉ cho B/);
  assert.match(m.history('B'), /chỉ cho B/);
});

test('sự kiện ended phát đúng một lần', () => {
  const m = new Meeting(fast);
  let n = 0; m.ev.on('ended', () => n++);
  m.join('A', 'x'); m.start('x', '');
  m.stop(); m.stop();
  assert.equal(n, 1);
});

test('Việc có số và trạng thái: TIẾN ĐỘ VIỆC trong tin, tool progress, chủ trì đổi trạng thái', async () => {
  const m = new Meeting({ ...fast, idleMs: 60000 });
  m.join('A', 'x'); m.join('B', 'x'); m.start('x', '');
  await m.wait('A'); await m.wait('B');
  const r = m.say('A', 'KẾT LUẬN: làm\nVIỆC: A | viết parser | thứ 6\nVIỆC: B | viết test | thứ 7');
  assert.deepEqual(m.actions.map(a => [a.n, a.owner, a.status]), [[1, 'A', 'todo'], [2, 'B', 'todo']]);
  assert.match(m.log.at(-1).text, /Đã ghi việc: #1 A — viết parser; #2 B — viết test/);
  assert.match(await m.wait('A'), /#1 A — viết parser/); // người ghi cũng được báo số việc
  // nhắc lại cùng việc với câu chữ khác: giữ số cũ, không tạo việc mới
  m.say('B', 'VIỆC: B | Viết test. | thứ 7');
  assert.deepEqual(m.actions.map(a => a.n), [1, 2]);
  assert.match(m.say('B', 'TIẾN ĐỘ VIỆC 2: đang làm | đã có 3 test\n**TIẾN ĐỘ VIỆC #1**: xong'), /Đã cập nhật việc #2: đang làm\. Đã cập nhật việc #1: xong\./);
  assert.equal(m.actions[1].status, 'doing'); assert.equal(m.actions[1].note, 'đã có 3 test');
  assert.equal(m.actions[0].status, 'done'); assert.equal(m.actions[0].updatedBy, 'B');
  assert.equal(m.log.filter(x => x.progress).length, 2);
  assert.match(m.say('A', 'TIẾN ĐỘ VIỆC 9: xong'), /Không có việc #9\. Các việc hiện có: #1, #2\./);
  assert.match(m.progress('A', '#2', 'gần xong', ''), /Không hiểu trạng thái "gần xong".*đang làm \| xong \| vướng \| chưa làm/);
  assert.match(m.progress('A', '2', 'vướng', 'thiếu quyền repo'), /Đã cập nhật việc #2: vướng/);
  assert.equal(m.actions[1].note, 'thiếu quyền repo');
  m.leave('B');
  assert.match(m.progress('B', 'việc 2', 'xong', 'PR #7'), /^Đã cập nhật việc #2: xong\. Bạn đã báo xong mọi việc ghi tên mình\. Hãy dừng lại/); // đã rời phòng vẫn báo được
  assert.match(m.progress('Z', '2', 'xong'), /không có trong cuộc họp/);
  assert.equal(m.hostTask(2, 'đang làm'), true);
  assert.equal(m.actions[1].status, 'doing'); assert.equal(m.actions[1].note, 'PR #7'); // không gửi ghi chú thì giữ ghi chú cũ
  m.progress('A', '2', 'đang làm', '');
  assert.equal(m.actions[1].note, 'PR #7'); // agent gửi ghi chú trống cũng giữ
  m.hostTask(2, 'đang làm', '');
  assert.equal(m.actions[1].note, ''); // chủ trì xoá ghi chú
  assert.equal(m.hostTask(5, 'xong'), false); assert.equal(m.hostTask(1, 'lung tung'), false);
  assert.doesNotMatch(require('../src/meeting').decisionText('KẾT LUẬN: ok\nTIẾN ĐỘ VIỆC 1: xong'), /TIẾN ĐỘ/);
  m.stop();
  assert.match(m.progress('A', '1', 'xong'), /đã kết thúc/);
});

test('Giữ phòng báo tiến độ: chốt xong thì sang WORK, agent rời đi làm, báo xong hết thì đóng phòng', async () => {
  const m = new Meeting({ ...fast, idleMs: 60000, followUp: true });
  const events = [];
  m.ev.on('work', () => events.push('work')); m.ev.on('ended', () => events.push('ended')); m.ev.on('task', (t) => events.push(`task#${t.n}:${t.status}`));
  m.join('Lam', 'Sonnet 5.5', { base: 'http://x/a/id' }); m.join('Minh', 'Haiku 4.5');
  m.start('Chia việc', '');
  assert.match(m.log.at(-1).text, /PHÒNG ĐƯỢC GIỮ LẠI ĐỂ THEO DÕI TIẾN ĐỘ/);
  await m.wait('Lam'); await m.wait('Minh');
  m.say('Lam', 'KẾT LUẬN: chia như sau\nVIỆC: Lam | viết parser | hôm nay\nVIỆC: Minh (Haiku) | viết test | hôm nay\nVIỆC: Khoa | viết docs | mai');
  // rời thảo luận khi phòng vẫn đang họp: được giao việc ngay (kèm lệnh curl báo tiến độ), không bị bảo "dừng lại"
  const l1 = m.leave('Lam');
  assert.match(l1, /Đã ghi việc: #1/); // kèm tin chưa đọc
  assert.match(l1, /Bạn đã rời phần thảo luận/); assert.match(l1, /chưa xong:\n- #1 viết parser \(phụ trách: Lam\) \(hạn: hôm nay\): chưa làm\n\n/);
  assert.match(l1, /curl -s -X POST "http:\/\/x\/a\/id\/progress" --data-urlencode "name=Lam"/);
  assert.equal(m.state, 'LIVE');
  const l2 = m.leave('Minh'); // người cuối rời: phòng sang WORK thay vì kết thúc
  assert.equal(m.state, 'WORK'); assert.equal(m.workReason, 'mọi agent đã rời phòng');
  assert.match(l2, /GIAI ĐOẠN THỰC HIỆN/); assert.match(l2, /#2 viết test/); assert.match(l2, /progress\(name="Minh"/);
  assert.deepEqual(events, ['work']);
  assert.deepEqual(m.snapshot().agents.map(a => a.status), ['working', 'working']);
  // gọi nhầm wait/say trong WORK: không chặn, nhắc lại việc
  assert.match(await m.wait('Lam'), /đừng gọi wait\/say nữa[\s\S]*#1 viết parser/);
  assert.match(m.say('Minh', 'xin chào'), /#2 viết test/);
  assert.equal(m.log.filter(x => x.type === 'chat').length, 1);
  assert.match(m.join('Lam', 'Opus 5.5', { base: 'http://y/a/id' }), /#1 viết parser[\s\S]*http:\/\/y\/a\/id\/progress/); // mở lại phiên vẫn được nhắc việc
  assert.match(m.join('Moi', 'x'), /không nhận thành viên mới/);
  assert.match(m.progress('Lam', '1', 'xong', 'commit abc'), /Đã cập nhật việc #1: xong\. Bạn đã báo xong mọi việc ghi tên mình/);
  assert.match(m.progress('Minh', '2', 'đang làm'), /Việc của bạn còn lại: #2 \(đang làm\)/);
  assert.equal(m.hostTask(2, 'xong', 'chủ trì kiểm tra'), true);
  assert.equal(m.state, 'WORK'); // còn việc #3 của người không có trong phòng
  assert.equal(m.snapshot().agents.find(a => a.name === 'Lam').status, 'finished');
  assert.match(m.leave('Minh'), /Mọi việc ghi tên bạn đã báo xong/);
  assert.match(m.progress('Lam', '3', 'xong', 'đã viết docs'), /phòng đã đóng/); // ai cũng báo được việc không ghi tên mình
  assert.equal(m.state, 'ENDED'); assert.equal(m.endReason, 'mọi việc đã báo xong');
  assert.deepEqual(events, ['work', 'task#1:done', 'task#2:doing', 'task#2:done', 'task#3:done', 'ended']);
});

test('Giữ phòng báo tiến độ: không có việc thì kết thúc như thường; chủ trì đóng phòng; hết giờ cũng sang WORK', async () => {
  const a = new Meeting({ ...fast, followUp: true });
  a.join('A', 'x'); a.start('x', ''); a.leave('A');
  assert.equal(a.state, 'ENDED');
  const b = new Meeting({ ...fast, followUp: true });
  b.join('A', 'x'); b.start('x', ''); b.say('A', 'VIỆC: A | làm | mai');
  b.stop(); assert.equal(b.state, 'WORK'); assert.equal(b.workReason, 'chủ trì kết thúc');
  b.stop('chủ trì đóng phòng'); assert.equal(b.state, 'ENDED'); assert.equal(b.endReason, 'chủ trì đóng phòng');
  const c = new Meeting({ ...fast, idleMs: 60000 });
  c.join('A', 'x'); c.start('x', '', { followUp: true, timeLimitMin: 1 });
  assert.equal(c.cfg.followUp, true);
  c.say('A', 'VIỆC: A | làm | mai');
  c.endsAt = Date.now(); c.timers.forEach(clearTimeout); c._armTimers();
  await sleep(20);
  assert.equal(c.state, 'WORK'); assert.equal(c.workReason, 'hết thời gian');
  const s = c.toState(), d = new Meeting(); d.restore(s);
  assert.equal(d.state, 'WORK'); assert.equal(d.cfg.followUp, true); assert.match(d.leave('A'), /#1 làm/);
});

test('Giữ phòng báo tiến độ: tên agent có dấu gạch, dấu chấm vẫn nhận đúng việc của mình', () => {
  const m = new Meeting({ ...fast, followUp: true });
  m.join('Haiku-Agent', 'x'); m.join('gpt.5', 'x'); m.start('x', '');
  m.say('Haiku-Agent', 'VIỆC: Haiku-Agent | sửa lỗi | mai\nVIỆC: gpt.5 | viết test | mai\nVIỆC: gpt-5 | không phải của gpt.5 | mai');
  assert.match(m.leave('Haiku-Agent'), /chưa xong:\n- #1 sửa lỗi/);
  const t = m.leave('gpt.5');
  assert.match(t, /chưa xong:\n- #2 viết test[^\n]*\n\n/);
  assert.equal(m.state, 'WORK');
  assert.deepEqual(m.snapshot().agents.map(a => a.status), ['working', 'working']);
});
