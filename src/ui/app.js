'use strict';
(() => {
  const key = location.pathname.split('/').pop();
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ---------- tiện ích DOM ----------
  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : String(c));
    return e;
  }
  const COLORS = ['#4f46e5', '#0891b2', '#c026d3', '#ea580c', '#059669', '#db2777', '#7c3aed', '#0d9488', '#b45309', '#2563eb'];
  const colorOf = (name) => { let h = 0; for (const c of name) h = (h * 31 + c.codePointAt(0)) >>> 0; return COLORS[h % COLORS.length]; };
  const initials = (name) => { const w = name.split(/[\s\-_.]+/).filter(Boolean); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : (w[0] || '')[1] || '')).toUpperCase(); };
  const STATUS = { listening: 'đang nghe', thinking: 'đang soạn tin…', idle: 'có mặt', turn: 'tới lượt phát biểu', left: 'đã rời', kicked: 'bị mời ra', ended: 'đã kết thúc', working: 'đang làm việc được giao', finished: 'đã báo xong việc' };
  const fmtTime = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const fmtDur = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  };
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };

  // ---------- Markdown tối giản và an toàn (escape trước, rồi mới định dạng) ----------
  const esc = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inline = (s) => esc(s)
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  // link commit/PR trong bằng chứng: bấm được (văn bản đã escape trước)
  const linkify = (h) => h.replace(/https?:\/\/[^\s<]+?(?=&quot;|&#39;|[.,;:!?)]*(?:\s|<|$))/g, u => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
  function blocks(text) {
    const out = []; let para = [], list = null;
    const flushPara = () => { if (para.length) out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; };
    const flushList = () => { if (list) out.push(`<${list.tag}>` + list.items.map(i => '<li>' + inline(i) + '</li>').join('') + `</${list.tag}>`); list = null; };
    for (const line of text.split('\n')) {
      let mm;
      if (!line.trim()) { flushPara(); flushList(); continue; }
      if ((mm = line.match(/^\s*[-*•]\s+(.*)$/)) || (mm = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
        const tag = /^\s*\d/.test(line) ? 'ol' : 'ul';
        flushPara(); if (list && list.tag !== tag) flushList();
        (list ||= { tag, items: [] }).items.push(mm[1]); continue;
      }
      if ((mm = line.match(/^\s*#{1,6}\s+(.*)$/))) { flushPara(); flushList(); out.push('<h4>' + inline(mm[1]) + '</h4>'); continue; }
      flushList(); para.push(line);
    }
    flushPara(); flushList();
    return out.join('');
  }
  function md(src) {
    return String(src).split('```').map((part, i) => i % 2
      ? '<pre><code>' + esc(part.replace(/^[\w+.-]*\n/, '').replace(/\n$/, '')) + '</code></pre>'
      : blocks(part)).join('');
  }

  // ---------- thông báo, hộp xác nhận ----------
  function toast(msg, bad) {
    const t = el('div', { class: 'toast' + (bad ? ' bad' : '') }, msg);
    $('toasts').append(t); setTimeout(() => t.remove(), 2600);
  }
  let modalResolve = null, modalAsk = false;
  function confirmBox(title, text, yes = 'Đồng ý', ask) {
    $('modalTitle').textContent = title; $('modalText').textContent = text; $('modalYes').textContent = yes;
    modalAsk = ask !== undefined;
    $('modalInput').hidden = !modalAsk; $('modalInput').value = ask ?? '';
    $('modalYes').className = 'btn ' + (modalAsk ? 'primary' : 'danger');
    $('modal').hidden = false; (modalAsk ? $('modalInput') : $('modalYes')).focus();
    return new Promise(r => { modalResolve = r; });
  }
  const promptBox = (title, text, value, yes = 'Lưu') => confirmBox(title, text, yes, value);
  const closeModal = (v) => {
    $('modal').hidden = true;
    if (modalResolve) { modalResolve(modalAsk ? (v ? $('modalInput').value.trim() : null) : v); modalResolve = null; }
  };
  $('modalInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); closeModal(true); } });
  $('modalYes').onclick = () => closeModal(true);
  $('modalNo').onclick = () => closeModal(false);
  $('modal').onclick = (e) => { if (e.target === $('modal')) closeModal(false); };

  async function copy(text, what = 'Đã sao chép') {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else { const a = el('textarea', { style: 'position:fixed;opacity:0' }); a.value = text; document.body.append(a); a.select(); document.execCommand('copy'); a.remove(); }
      toast(what + ' ✓');
    } catch { toast('Không sao chép được, hãy bôi đen và sao chép thủ công', true); }
  }
  async function post(act, body) {
    const r = await fetch(`/api/host/${key}/${act}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Lỗi ' + r.status);
    return d;
  }

  // ---------- trạng thái ----------
  let snap = null, log = [], version = -1, rendered = 0, clockOffset = 0, unread = 0;
  let inviteBuilt = false, formInit = false, endedBuilt = '', lastView = '';
  const serverNow = () => Date.now() + clockOffset;
  const draftKey = (k) => `agent-meeting:${key}:${k}`;

  // ---------- mời agent ----------
  function codeBlock(caption, text, primary) {
    return el('div', { class: 'blk' },
      el('div', { class: 'cap' }, caption),
      el('div', { class: 'code' }, el('pre', {}, text),
        el('button', { class: 'btn sm ' + (primary ? 'primary' : 'ghost'), type: 'button', onclick: () => copy(text, primary ? 'Đã sao chép prompt' : 'Đã sao chép lệnh') }, 'Sao chép')));
  }
  function buildInvite(agentId, o) {
    const mcp = `${o}/mcp/${agentId}`, base = `${o}/a/${agentId}`;
    const curlSteps = `Tự đặt cho mình một tên tuỳ thích và khai báo model bạn đang chạy (ví dụ Opus 5.5), rồi chạy:\ncurl -s -X POST "${base}/join" --data-urlencode "name=TÊN_BẠN_TỰ_ĐẶT" --data-urlencode "model=MODEL_BẠN_ĐANG_CHẠY"\nNếu bị báo trùng tên thì chọn tên khác và chạy lại. Sau đó làm đúng giao thức nó trả về (vòng lặp nghe/nói bằng curl) cho đến khi cuộc họp kết thúc.`;
    const curlPrompt = `Hãy tham gia một cuộc họp nhiều agent. ${curlSteps}`;
    const combined = (cmd) => `Hãy tham gia một cuộc họp nhiều agent.\n\nCách 1 (MCP): nếu bạn đã có tool MCP của server "agent-meeting" (join, wait, say…; một số công cụ ẩn tool MCP, hãy tìm trong danh sách tool của bạn) thì dùng luôn, không cài lại. Nếu chưa có, chạy lệnh shell sau để cài:\n${cmd}\nNếu công cụ của bạn cần mở lại phiên để nạp MCP thì báo tôi mở lại. Rồi gọi join(name="<tên bạn tự đặt, tuỳ thích>", model="<model bạn đang chạy, ví dụ Opus 5.5>"). Nếu bị báo trùng tên thì đặt tên khác. Sau đó làm đúng giao thức nó trả về và lặp wait/say cho đến khi cuộc họp kết thúc.\n\nCách 2 (dùng ngay, không cần cài, nếu MCP chưa dùng được): ${curlSteps}`;
    const mcpTab = (cmd) => [
      codeBlock('Dán thẳng cho agent: nó tự cài MCP rồi vào họp, có đường lui bằng curl.', combined(cmd), true),
      codeBlock('Hoặc tự chạy lệnh cài trên máy có agent, rồi mở lại phiên agent:', cmd),
    ];
    const tabs = [
      ['Dán là vào ngay', () => [codeBlock('Dùng với mọi agent chạy được shell/curl. Không cần cài, không cần mở lại phiên.', curlPrompt, true)]],
      ['Claude Code', () => mcpTab(`claude mcp add --transport http agent-meeting ${mcp}`)],
      ['Codex CLI', () => mcpTab(`codex mcp add agent-meeting --url ${mcp}`)],
      ['Gemini CLI', () => mcpTab(`gemini mcp add --transport http agent-meeting ${mcp}`)],
      ['Khác', () => [codeBlock('Thêm một MCP server dạng HTTP (Streamable HTTP) với URL:', mcp), codeBlock('Hoặc dùng API văn bản (curl):', base + '/join')]],
    ];
    const bar = el('div', { class: 'tabs', role: 'tablist' }), body = el('div');
    tabs.forEach(([name, make], i) => {
      const t = el('button', { class: 'tab', type: 'button', role: 'tab' }, name);
      t.onclick = () => { [...bar.children].forEach(c => { c.classList.toggle('on', c === t); c.setAttribute('aria-selected', c === t); }); body.replaceChildren(...make()); };
      bar.append(t); if (!i) t.click();
    });
    $('invite').replaceChildren(bar, body,
      el('p', { class: 'note' }, '🔒', 'Prompt chứa mã tham gia phòng: ai có prompt đều vào họp được. Không chia sẻ công khai. Link trang này (chủ trì) thì đừng gửi cho ai.'));
  }

  // ---------- màn chuẩn bị ----------
  const TEMPLATES = [
    ['Tranh luận', 'Tranh luận về: <chủ đề>.\nMỗi agent bảo vệ một quan điểm khác nhau, phản biện lẫn nhau bằng lập luận cụ thể, rồi cả nhóm thống nhất một kết luận có lý do.'],
    ['Brainstorm', 'Cùng brainstorm ý tưởng cho: <chủ đề>.\nMỗi lượt đưa 1-2 ý mới, không lặp lại ý đã có. Cuối cùng chọn ra 3 ý tốt nhất và giải thích vì sao.'],
    ['Review thiết kế', 'Review thiết kế/kiến trúc sau: <dán mô tả hoặc nội dung>.\nChỉ ra rủi ro, đề xuất cải tiến, rồi thống nhất danh sách việc cần làm theo thứ tự ưu tiên.'],
    ['Lập kế hoạch', 'Lập kế hoạch cho: <mục tiêu>.\nChia nhỏ thành các bước, phân công agent nào phụ trách phần nào, ước lượng thời gian, và chốt kế hoạch cuối cùng.'],
    ['Ra quyết định', 'Cần chọn giữa: <phương án A> và <phương án B>.\nPhân tích ưu nhược điểm theo chi phí, rủi ro và thời gian, rồi chọn một phương án và nêu điều kiện để đổi ý.'],
    ['Review tiến độ', 'Họp rà soát tiến độ các việc từ cuộc họp trước (hệ thống tự gửi kèm danh sách việc và quyết định).\nMỗi agent báo trạng thái thật của việc mình phụ trách bằng dòng TIẾN ĐỘ VIỆC (ví dụ "TIẾN ĐỘ VIỆC 2: xong | commit abc123, test xanh"), nêu vướng mắc, rồi thống nhất việc tiếp theo (dòng VIỆC).'],
  ];
  const MODE_HINT = {
    free: 'Tự do: ai có ý mới thì nói. Khi im lặng đủ lâu, một agent được hỏi có muốn chốt và rời phòng không.',
    turns: 'Lần lượt: agent phát biểu theo thứ tự slot; tới lượt mà không có gì mới thì bỏ lượt. Cả vòng đều bỏ lượt thì cuộc họp tự kết thúc.',
  };
  function initForm(s) {
    if (formInit) return; formInit = true;
    $('ctx').value = store.get(draftKey('ctx')) ?? '';
    $('endc').value = store.get(draftKey('endc')) ?? '';
    $('agenda').value = store.get(draftKey('agenda')) ?? (s.agenda || []).map((x, i) => `${i + 1}. ${x}`).join('\n');
    $('agenda').addEventListener('input', () => store.set(draftKey('agenda'), $('agenda').value));
    $('mode').value = s.settings.mode; $('maxMsgs').value = s.settings.maxMsgs;
    $('followUp').checked = (store.get(draftKey('followUp')) ?? String(s.settings.followUp)) === 'true';
    $('followUp').addEventListener('change', () => store.set(draftKey('followUp'), String($('followUp').checked)));
    $('timeLimit').value = s.settings.timeLimitMin; $('idleSec').value = s.settings.idleSec;
    const tpl = $('templates');
    TEMPLATES.forEach(([name, text]) => tpl.append(el('button', { class: 'chip', type: 'button', onclick: () => useTemplate(text) }, name)));
    $('ctx').addEventListener('input', () => { store.set(draftKey('ctx'), $('ctx').value); $('ctxErr').hidden = true; $('ctx').parentElement.classList.remove('invalid'); renderChecks(); });
    $('endc').addEventListener('input', () => store.set(draftKey('endc'), $('endc').value));
    $('mode').addEventListener('change', modeChanged); modeChanged();
  }
  function modeChanged() { $('modeHint').textContent = MODE_HINT[$('mode').value]; $('idleField').hidden = $('mode').value !== 'free'; }
  async function useTemplate(text) {
    const cur = $('ctx').value.trim();
    if (cur && !(await confirmBox('Dùng mẫu này?', 'Nội dung bối cảnh hiện tại sẽ được thay bằng mẫu.', 'Thay bằng mẫu'))) return;
    $('ctx').value = text; $('ctx').dispatchEvent(new Event('input'));
    const i = text.indexOf('<'), j = text.indexOf('>', i);
    $('ctx').focus(); if (i >= 0 && j > i) $('ctx').setSelectionRange(i, j + 1);
  }
  function renderChecks() {
    if (!snap) return;
    const present = snap.agents.filter(a => a.status !== 'left' && a.status !== 'kicked').length;
    const hasCtx = !!$('ctx').value.trim();
    $('checks').replaceChildren(
      el('span', { class: hasCtx ? 'ok' : '' }, hasCtx ? 'Đã có bối cảnh' : 'Chưa có bối cảnh'),
      el('span', { class: present ? 'ok' : '' }, present ? `${present} agent đang chờ` : 'Chưa có agent (vẫn bắt đầu được, ai vào sau đọc lại từ đầu)'));
    renderSteps();
  }
  function person(a, opts = {}) {
    const color = colorOf(a.name), gone = a.status === 'left' || a.status === 'kicked';
    return el('li', { class: 'person' + (gone ? ' gone' : '') },
      el('span', { class: 'av s-' + a.status, style: `background:${color}` }, initials(a.name), el('i')),
      el('div', { class: 'who' },
        el('div', { class: 'nm' }, a.name, a.model ? el('span', { class: 'model' }, a.model) : null, a.status === 'turn' ? el('span', { class: 'tag' }, 'đang lượt') : null),
        a.role ? el('div', { class: 'role', title: a.role }, '🎭 ' + a.role) : null,
        el('div', { class: 'st' }, `slot ${a.slot} · ${STATUS[a.status] || a.status}` + (opts.said && a.said ? ` · ${a.said} tin` : ''))),
      opts.kick && !gone ? el('button', { class: 'icon edit', type: 'button', title: 'Giao vai trò', 'aria-label': 'Giao vai trò cho ' + a.name, onclick: () => editRole(a) }, '✎') : null,
      opts.kick && !gone ? el('button', { class: 'icon kick', type: 'button', title: 'Mời ra khỏi phòng', 'aria-label': 'Mời ' + a.name + ' ra khỏi phòng', onclick: () => kick(a.name) }, '⨯') : null);
  }
  // "Họp tiếp": việc chưa xong và quyết định mang từ cuộc họp trước (hệ thống tự gửi kèm khi bắt đầu)
  function renderCarry(s) {
    const c = s.carry; $('carryCard').hidden = !c;
    if (!c || !changed('carry', [c, s.actions, s.state === 'ENDED'])) return;
    const open = s.actions.filter(x => x.status !== 'done');
    $('carry').replaceChildren(...[
      el('p', { class: 'hint' }, `Từ: ${c.topic || 'cuộc họp trước'}${c.from ? ' · ' + new Date(c.from).toLocaleString('vi-VN') : ''}. Danh sách này được gửi kèm bối cảnh khi bắt đầu; số việc giữ nguyên.`),
      c.decisions.length ? el('div', {}, el('h4', {}, `Quyết định (${c.decisions.length})`), el('ul', {}, ...c.decisions.map(d => el('li', {}, d.item ? el('b', {}, `Mục ${d.item}: `) : null, el('span', { html: inline(d.text) }))))) : null,
      el('div', {}, el('h4', {}, `Việc chưa xong (${open.length})`), open.length ? el('ul', { class: 'tasks' }, ...open.map(taskItem)) : el('p', { class: 'muted' }, 'Mọi việc mang sang đã báo xong.')),
      c.done.length ? el('div', {}, el('h4', {}, `Đã xong (${c.done.length})`), el('ul', {}, ...c.done.map(t => el('li', {}, `#${t.n} `, el('span', { html: inline(t.task) }), t.note ? el('span', { class: 'who' }, ' · ' + t.note) : null)))) : null].filter(Boolean)); // replaceChildren(null) in ra chữ "null"
  }
  function renderSetup(s) {
    initForm(s); renderCarry(s);
    const lobby = $('lobby');
    lobby.replaceChildren(...s.agents.map(a => person(a, { kick: true })), el('li', { class: 'person empty' }, `Slot ${s.agents.length + 1} · đang chờ agent vào…`));
    const present = s.agents.filter(a => a.status !== 'left' && a.status !== 'kicked').length;
    $('lobbyCount').textContent = present ? `${present} agent` : '';
    renderChecks();
  }
  $('btnStart').onclick = async () => {
    const context = $('ctx').value.trim();
    if (!context) { $('ctxErr').hidden = false; $('ctx').parentElement.classList.add('invalid'); $('ctx').focus(); return; }
    if (/<[^>\n]{1,40}>/.test(context) && !(await confirmBox('Bối cảnh còn chỗ trống', 'Bối cảnh còn phần <…> của mẫu chưa điền. Vẫn bắt đầu?', 'Vẫn bắt đầu'))) return;
    const b = $('btnStart'); b.disabled = true;
    try {
      await post('start', { context, endCondition: $('endc').value.trim(), settings: { mode: $('mode').value, maxMsgs: +$('maxMsgs').value, timeLimitMin: +$('timeLimit').value, idleSec: +$('idleSec').value, agenda: $('agenda').value, followUp: $('followUp').checked } });
    } catch (e) { toast('Không bắt đầu được: ' + e.message, true); }
    b.disabled = false;
  };

  // ---------- màn cuộc họp ----------
  const QUICK = [
    ['Yêu cầu chốt', 'Đã đủ thảo luận. Hãy thống nhất và gửi một tin bắt đầu bằng "KẾT LUẬN:" tóm tắt quyết định cuối cùng, kèm việc cần làm (mỗi việc một dòng "VIỆC: <người phụ trách> | <việc> | <hạn>"), rồi rời phòng.'],
    ['Giao việc', 'Hãy liệt kê các việc cần làm từ những gì đã thống nhất, mỗi việc một dòng "VIỆC: <người phụ trách> | <việc> | <hạn>".'],
    ['Tóm tắt', 'Hãy tóm tắt ngắn các quan điểm đã nêu và những điểm còn bất đồng.'],
    ['Quay lại chủ đề', 'Hãy quay lại đúng chủ đề ban đầu và bỏ qua các ý lan man.'],
    ['Ngắn gọn hơn', 'Từ giờ mỗi tin hãy ngắn gọn, tối đa 3-4 câu.'],
  ];
  QUICK.forEach(([label, text]) => $('quick').append(el('button', { class: 'chip', type: 'button', title: text, onclick: () => hostSay(text, label) }, label)));
  async function hostSay(text, label) {
    const to = $('sendTo').value;
    try { await post('say', { text, to }); toast(label ? `Đã gửi: ${label}${to ? ' (riêng ' + to + ')' : ''}` : to ? `Đã gửi riêng cho ${to}` : 'Đã gửi tới các agent'); return true; }
    catch (e) { toast('Không gửi được: ' + e.message, true); return false; }
  }
  $('btnNext').onclick = async () => { try { await post('next'); } catch (e) { toast(e.message, true); } };
  $('composer').onsubmit = async (e) => {
    e.preventDefault();
    const t = $('hostMsg').value.trim(); if (!t) return;
    $('btnSend').disabled = true;
    if (await hostSay(t)) { $('hostMsg').value = ''; autoGrow(); }
    $('btnSend').disabled = false; $('hostMsg').focus();
  };
  const autoGrow = () => { const t = $('hostMsg'); t.style.height = 'auto'; t.style.height = Math.min(180, t.scrollHeight + 2) + 'px'; };
  $('hostMsg').addEventListener('input', autoGrow);
  $('hostMsg').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('composer').requestSubmit(); } });

  async function editRole(a) {
    const role = await promptBox(`Vai trò của ${a.name}`, snap.state === 'LIVE'
      ? 'Agent sẽ nhận vai trò mới qua một tin nhắn riêng.' : 'Vai trò được gửi cho cả nhóm khi bắt đầu cuộc họp. Ví dụ: phản biện, thư ký, chuyên gia bảo mật.', a.role || '');
    if (role === null) return;
    try { await post('role', { name: a.name, role }); toast(role ? `Đã giao vai trò cho ${a.name}` : `Đã bỏ vai trò của ${a.name}`); } catch (e) { toast(e.message, true); }
  }
  async function kick(name) {
    if (!(await confirmBox(`Mời ${name} ra khỏi phòng?`, `${name} sẽ được báo dừng và không vào lại được bằng tên này.`, 'Mời ra'))) return;
    try { await post('kick', { name }); toast(`Đã mời ${name} ra khỏi phòng`); } catch (e) { toast(e.message, true); }
  }
  $('btnStop').onclick = async () => {
    const [title, text, yes] = snap.state === 'WORK'
      ? ['Đóng phòng theo dõi?', 'Agent sẽ không báo tiến độ vào phòng này được nữa. Bạn vẫn tải được biên bản và tự đổi trạng thái việc.', 'Đóng phòng']
      : snap.settings.followUp && snap.actions.some(x => x.status !== 'done')
        ? ['Chốt cuộc họp?', 'Các agent dừng thảo luận và đi làm việc được giao; phòng được giữ lại để chờ agent báo tiến độ.', 'Chốt']
        : ['Kết thúc cuộc họp?', 'Các agent sẽ được báo dừng ngay. Bạn vẫn tải được biên bản sau đó.', 'Kết thúc'];
    if (!(await confirmBox(title, text, yes))) return;
    try { await post('stop'); } catch (e) { toast(e.message, true); }
  };

  function renderInfo(s) {
    const start = s.startedAt || serverNow();
    const end = s.workSince || s.endedAt || serverNow();
    const left = s.endsAt && s.state === 'LIVE' ? s.endsAt - serverNow() : null;
    const ratio = Math.min(1, s.chatCount / s.settings.maxMsgs);
    $('info').replaceChildren(...[
      el('dt', {}, 'Thời lượng'), el('dd', { id: 'infoElapsed' }, fmtDur(end - start)),
      left != null ? el('dt', {}, 'Còn lại') : null, left != null ? el('dd', { id: 'infoLeft' }, fmtDur(left)) : null,
      el('dt', {}, 'Chế độ'), el('dd', {}, s.settings.mode === 'turns' ? 'Lần lượt' : 'Tự do'),
      el('dt', {}, 'Tin nhắn'), el('dd', {}, `${s.chatCount} / ${s.settings.maxMsgs}`),
      el('div', { class: 'bar' + (ratio > .8 ? ' warn' : '') }, el('i', { style: `width:${ratio * 100}%` }))].filter(Boolean));
  }
  setInterval(() => {
    if (!snap || snap.state !== 'LIVE') return;
    const e = $('infoElapsed'); if (e) e.textContent = fmtDur(serverNow() - snap.startedAt);
    const l = $('infoLeft'); if (l && snap.endsAt) l.textContent = fmtDur(snap.endsAt - serverNow());
  }, 1000);

  const modelOf = (name) => snap?.agents.find(a => a.name === name)?.model || '';
  function entry(m, prev) {
    if (m.type === 'sys') return el('div', { class: 'sys' + (m.progress ? ' prog s-' + m.progress.status : '') }, el('time', {}, fmtTime(m.t)), m.progress ? el('span', { html: linkify(esc(m.text)) }) : m.text);
    const host = m.type === 'host', name = host ? (m.to ? `Chủ trì → ${m.to} (riêng)` : 'Chủ trì') : m.name, color = host ? 'var(--accent)' : colorOf(m.name);
    const first = !prev || prev.type === 'sys' || prev.type !== m.type || prev.name !== m.name || m.t - prev.t > 5 * 60000;
    return el('div', { class: 'msg' + (first ? ' first' : '') + (host ? ' host' : '') + (m.conclusion || m.itemsDone ? ' conclusion' : '') + (m.itemsDone && !m.conclusion ? ' itemdone' : '') + (m.to ? ' private' : '') },
      el('span', { class: 'av', style: `background:${color}` }, host ? '★' : initials(m.name)),
      el('div', { class: 'hd' }, el('b', { style: `color:${color}` }, name), !host && modelOf(m.name) ? el('span', { class: 'model' }, modelOf(m.name)) : null, el('time', { datetime: new Date(m.t).toISOString() }, fmtTime(m.t))),
      el('div', { class: 'bubble', html: md(m.text) }));
  }
  const nearBottom = () => { const f = $('feed'); return f.scrollHeight - f.scrollTop - f.clientHeight < 90; };
  function renderFeed(fresh) {
    const f = $('feed'), inner = $('feedIn'), stick = fresh || nearBottom();
    let added = 0, real = 0;
    for (; rendered < log.length; rendered++, added++) {
      inner.append(entry(log[rendered], log[rendered - 1]));
      if (log[rendered].type !== 'sys') real++;
    }
    if (!added) return;
    if (document.hidden && real) { unread += real; document.title = `(${unread}) Agent Meeting`; }
    if (stick) { f.style.scrollBehavior = 'auto'; f.scrollTop = f.scrollHeight; f.style.scrollBehavior = ''; }
    else $('newPill').hidden = false;
  }
  $('feed').addEventListener('scroll', () => { if (nearBottom()) $('newPill').hidden = true; });
  $('newPill').onclick = () => { $('feed').scrollTop = $('feed').scrollHeight; $('newPill').hidden = true; };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { unread = 0; document.title = 'Agent Meeting'; } });

  function renderTyping(s) {
    let txt = '';
    if (s.state === 'LIVE') {
      const th = s.agents.filter(a => a.status === 'thinking').map(a => a.name);
      if (s.settings.mode === 'turns' && s.turn) txt = `Đang chờ ${s.turn} phát biểu…`;
      else if (th.length) txt = `✎ ${th.join(', ')} đang soạn tin…`;
    }
    $('typing').textContent = txt;
  }

  function renderEnded(s) {
    if (endedBuilt === s.state) return; endedBuilt = s.state;
    delete sigs.endActs;
    const v = log.filter(m => m.conclusion && m.decision).at(-1), work = s.state === 'WORK';
    $('ended').replaceChildren(el('div', { class: 'endcard-in' },
      el('h3', {}, work ? 'Đã chốt: đang chờ agent làm và báo tiến độ' : s.workSince ? 'Đã đóng phòng theo dõi tiến độ' : 'Cuộc họp đã kết thúc'),
      work ? el('p', { class: 'hint' }, 'Các agent đã rời họp để làm việc được giao và sẽ báo tiến độ vào đây (tool progress). Phòng tự đóng khi mọi việc báo xong; bạn cũng có thể tự đổi trạng thái hoặc bấm "Đóng phòng".') : null,
      el('div', { class: 'stats' },
        el('span', {}, work ? 'Chốt vì: ' : 'Lý do: ', el('b', {}, (work ? s.workReason : s.endReason) || '—')),
        el('span', {}, 'Thảo luận: ', el('b', {}, fmtDur((s.workSince || s.endedAt || serverNow()) - (s.startedAt || s.createdAt)))),
        el('span', {}, 'Tin nhắn: ', el('b', {}, String(s.chatCount))),
        el('span', {}, 'Thành viên: ', el('b', {}, String(s.agents.length)))),
      el('div', { id: 'endActs' }),
      v ? el('div', { class: 'verdict' }, el('b', {}, `Kết luận (${v.name}${modelOf(v.name) ? ', ' + modelOf(v.name) : ''})`),
        el('div', { class: 'bubble-md', html: md(v.decision) })) : null,
      el('div', { class: 'row' },
        el('button', { class: 'btn primary', type: 'button', onclick: downloadMinutes }, 'Tải biên bản .md'),
        el('button', { class: 'btn ghost', type: 'button', onclick: async () => copy(await (await fetch(`/api/host/${key}/minutes.md`)).text(), 'Đã sao chép biên bản') }, 'Sao chép biên bản'),
        el('a', { class: 'btn ghost', href: `/api/host/${key}/minutes.json`, download: 'bien-ban-hop.json' }, 'Tải JSON'),
        carryable(s) ? el('button', { class: 'btn ghost', type: 'button', id: 'btnCarry', title: 'Cuộc họp mới nhận sẵn các việc chưa xong (giữ số) và quyết định của cuộc này, để họp review tiến độ', onclick: () => newMeeting(true) },
          carryLabel(s)) : null,
        el('button', { class: 'btn ghost', type: 'button', title: 'Cuộc họp mới hoàn toàn trống', onclick: () => newMeeting(false) }, 'Cuộc họp mới'))));
  }
  function renderEndActs(s) {
    const box = $('endActs'); if (!box || !changed('endActs', [s.actions, s.state])) return;
    if ($('btnCarry')) $('btnCarry').textContent = carryLabel(s); // số việc dở đổi khi agent báo xong hoặc chủ trì gộp/xoá
    const done = s.actions.filter(x => x.status === 'done').length;
    box.replaceChildren(...(s.actions.length ? [el('div', { class: 'tprog' }, el('b', {}, `${done}/${s.actions.length} việc xong`),
      el('div', { class: 'bar' + (done === s.actions.length ? ' full' : '') }, el('i', { style: `width:${done / s.actions.length * 100}%` }))),el('div', { class: 'acts-wrap' }, el('table', { class: 'acts' },
      el('thead', {}, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Việc cần làm · bằng chứng'), el('th', {}, 'Phụ trách'), el('th', {}, 'Hạn'), el('th', {}, 'Trạng thái'))),
      el('tbody', {}, ...s.actions.map(x => el('tr', { class: 's-' + x.status }, el('td', {}, '#' + x.n),
        el('td', {}, el('div', { html: inline(x.task) }), el('div', { class: 'tnote' }, x.note ? el('span', { html: linkify(inline(x.note)) }) : el('span', { class: 'muted' }, 'chưa có bằng chứng'), ' ', noteBtn(x))),
        el('td', {}, x.owner || '—'), el('td', {}, x.due || '—'), el('td', { class: 'tact' }, statusSelect(x), snap.state !== 'ENDED' ? dropBtn(x) : null)))))),
      verifyNote()] : []));
  }
  const carryLabel = (s) => { const open = s.actions.filter(x => x.status !== 'done').length; return open ? `Họp tiếp (mang ${open} việc dở)` : 'Họp tiếp (mang quyết định)'; };
  const carryable = (s) => s.actions.some(x => x.status !== 'done') || decisions().length > 0;
  async function newMeeting(carry) {
    if (snap.state === 'WORK' && !(await confirmBox('Đóng phòng theo dõi?', `Phòng hiện tại sẽ đóng. ${carry ? 'Các việc chưa xong được mang sang cuộc họp mới: agent vẫn báo tiến độ được ở đó.' : 'Việc chưa xong sẽ không được theo dõi tiếp.'}`, carry ? 'Họp tiếp' : 'Cuộc họp mới'))) return;
    try { const { hostKey } = await post('new', { carry }); location.href = '/m/' + hostKey; }
    catch (e) { toast('Không tạo được cuộc họp mới: ' + e.message, true); }
  }

  function renderAgenda(s) {
    $('agendaSec').hidden = !s.agenda.length;
    if (!s.agenda.length) return;
    const summaries = new Map(log.flatMap(m => m.itemsDone || []).map(d => [d.item, d.summary]));
    $('agendaCount').textContent = `${Math.min(s.agendaIndex, s.agenda.length)}/${s.agenda.length}`;
    $('agendaList').replaceChildren(...s.agenda.map((t, i) => el('li', { class: i < s.agendaIndex ? 'done' : i === s.agendaIndex && s.state === 'LIVE' ? 'now' : '' },
      el('div', {}, t, summaries.get(i) ? el('small', { html: inline(summaries.get(i)) }) : null))));
    $('btnNext').hidden = s.state !== 'LIVE' || s.agendaIndex >= s.agenda.length;
    $('btnNext').textContent = s.agendaIndex === s.agenda.length - 1 ? 'Kết thúc chương trình →' : 'Mục tiếp theo →';
  }
  // server đã tách sẵn: tóm tắt từng mục (XONG MỤC) và nội dung KẾT LUẬN (không gồm các dòng VIỆC)
  // (cùng quy tắc với src/minutes.js: mỗi mục chỉ giữ KẾT LUẬN mới nhất)
  const decisions = () => {
    const last = new Map();
    for (const m of log) if (m.conclusion && m.decision) last.set(m.item ?? null, m);
    return log.flatMap(m => [
      ...(m.itemsDone || []).map(d => ({ name: m.name, item: d.item, text: d.summary })),
      ...(last.get(m.item ?? null) === m ? [{ name: m.name, item: m.item, text: m.decision }] : []),
    ]).filter(d => d.text);
  };
  // ---------- việc cần làm: trạng thái do agent báo hoặc chủ trì đặt ----------
  const TASK_STATUS = { todo: 'chưa làm', doing: 'đang làm', done: 'xong', blocked: 'vướng' };
  const sigs = {};
  // chỉ vẽ lại khi dữ liệu đổi: tránh đóng ô chọn trạng thái đang mở mỗi lần long-poll trả về
  const changed = (k, v) => { const j = JSON.stringify(v); if (sigs[k] === j) return false; sigs[k] = j; return true; };
  async function setTask(x, status, note) {
    try { await post('task', { n: x.n, status, note }); toast(`Việc #${x.n}: ${TASK_STATUS[status]}`); }
    catch (e) { toast('Không cập nhật được: ' + e.message, true); }
  }
  function statusSelect(x) {
    const sel = el('select', { class: 'tstat s-' + x.status, title: x.updatedBy ? `Cập nhật bởi ${x.updatedBy}${x.updatedAt ? ' lúc ' + fmtTime(x.updatedAt) : ''}` : 'Đổi trạng thái', 'aria-label': `Trạng thái việc #${x.n}` },
      ...Object.entries(TASK_STATUS).map(([k, v]) => el('option', { value: k, selected: k === x.status }, v)));
    sel.onchange = () => setTask(x, sel.value);
    return sel;
  }
  const noteBtn = (x) => el('button', { class: 'icon edit', type: 'button', title: 'Sửa bằng chứng / ghi chú', 'aria-label': `Sửa ghi chú việc #${x.n}`, onclick: async () => {
    const note = await promptBox(`Bằng chứng / ghi chú cho việc #${x.n}`, 'Ví dụ: link commit hoặc PR, kết quả test, đang vướng gì. Để trống để xoá.', x.note || '');
    if (note !== null) setTask(x, x.status, note);
  } }, '✎');
  // việc trùng (hai agent chốt cùng một việc bằng câu chữ khác nhau): gộp vào việc giữ lại, hoặc xoá hẳn
  const dropBtn = (x) => el('button', { class: 'icon drop', type: 'button', title: 'Gộp hoặc xoá việc', 'aria-label': `Gộp hoặc xoá việc #${x.n}`, onclick: async () => {
    const others = snap.actions.filter(y => y.n !== x.n).map(y => '#' + y.n);
    const v = await promptBox(`Gộp hoặc xoá việc #${x.n}`, (others.length ? `Nhập số việc giữ lại (${others.join(', ')}) để gộp việc này vào đó, bằng chứng được nối sang. ` : '')
      + 'Để trống để xoá hẳn. Agent nhắc lại việc này sẽ không tạo lại việc mới.', '', 'Gộp / xoá');
    if (v === null) return;
    const into = v.trim().replace(/^#/, '');
    try {
      const r = await post('task', { n: x.n, remove: true, into: into || undefined });
      toast(r.ok ? (into ? `Đã gộp việc #${x.n} vào #${into}` : `Đã xoá việc #${x.n}`) : `Không có việc #${into} để gộp vào`, !r.ok);
    } catch (e) { toast('Không cập nhật được: ' + e.message, true); }
  } }, '×');
  const verifyNote = () => el('p', { class: 'note verify' }, 'ⓘ', 'Trạng thái "xong" do agent tự báo kèm bằng chứng (hoặc bạn tự đặt). Server KHÔNG tự kiểm chứng: hãy xem bằng chứng trước khi tin.');
  const taskItem = (x) => el('li', { class: 'task s-' + x.status },
    el('div', {}, el('b', { class: 'tn' }, '#' + x.n), ' ', el('span', { html: inline(x.task) })),
    el('div', { class: 'tmeta' }, statusSelect(x), el('span', { class: 'who' }, [x.owner, x.due && 'hạn ' + x.due].filter(Boolean).join(' · ')), noteBtn(x), snap.state !== 'ENDED' ? dropBtn(x) : null),
    x.note ? el('div', { class: 'tnote', html: linkify(inline(x.note)) }) : null);

  function renderResults(s) {
    const ds = decisions();
    if (!changed('results', [ds, s.actions, s.agenda.length, s.state === 'ENDED'])) return;
    if (!ds.length && !s.actions.length) { $('results').replaceChildren(el('div', { class: 'empty' }, 'Chưa có quyết định hay việc cần làm. Tin "KẾT LUẬN:" và dòng "VIỆC:" sẽ hiện ở đây.')); return; }
    $('results').replaceChildren(...[
      ds.length ? el('div', {}, el('h4', {}, `Quyết định (${ds.length})`), el('ul', {}, ...ds.map(d => el('li', {},
        d.item != null && s.agenda.length ? el('b', {}, `Mục ${d.item + 1}: `) : null,
        el('span', { html: inline(d.text.split('\n').find(l => l.trim()).slice(0, 160)) }), ' ', el('span', { class: 'who' }, '· ' + d.name))))) : null,
      s.actions.length ? el('div', {}, el('h4', {}, `Việc cần làm (${s.actions.filter(x => x.status === 'done').length}/${s.actions.length} xong)`),
        el('ul', { class: 'tasks' }, ...s.actions.map(taskItem)), verifyNote()) : null].filter(Boolean));
  }
  function renderSendTo(s) {
    const sel = $('sendTo'), cur = sel.value;
    const names = s.agents.filter(a => !['left', 'kicked', 'ended'].includes(a.status)).map(a => a.name);
    const want = ['', ...names].join('\u0001');
    if (sel.dataset.names !== want) {
      sel.dataset.names = want;
      sel.replaceChildren(el('option', { value: '' }, 'Tất cả'), ...names.map(n => el('option', { value: n }, 'Riêng: ' + n)));
    }
    sel.value = names.includes(cur) ? cur : '';
  }

  // ---------- màn hẹp: bảng chi tiết ----------
  const setPanel = (open) => { $('side').classList.toggle('open', open); $('btnPanel').setAttribute('aria-expanded', open); renderPanelBtn(); };
  function renderPanelBtn() {
    const b = $('btnPanel'); if (!snap) return;
    if ($('side').classList.contains('open')) { b.textContent = '✕ Đóng chi tiết'; b.classList.remove('has'); return; }
    const n = decisions().length + snap.actions.length;
    b.textContent = '☰ ' + [snap.agenda.length ? `Mục ${Math.min(snap.agendaIndex + 1, snap.agenda.length)}/${snap.agenda.length}` : '', n ? `Kết quả ${n}` : 'Chi tiết'].filter(Boolean).join(' · ');
    b.classList.toggle('has', n > 0);
  }
  $('btnPanel').onclick = () => setPanel(!$('side').classList.contains('open'));
  matchMedia('(max-width: 860px)').addEventListener('change', (e) => { if (!e.matches) setPanel(false); });

  function renderRoom(s, fresh) {
    renderAgenda(s); renderResults(s); renderSendTo(s); renderPanelBtn();
    $('members').replaceChildren(...s.agents.map(a => person(a, { kick: s.state === 'LIVE', said: true })));
    const present = s.agents.filter(a => !['left', 'kicked', 'ended'].includes(a.status)).length;
    $('memberCount').textContent = s.state === 'LIVE' ? `${present}/${s.agents.length}` : String(s.agents.length);
    renderInfo(s);
    $('ctxView').textContent = s.context + (s.endCondition ? `\n\nĐiều kiện kết thúc: ${s.endCondition}` : '');
    if (!log.length && !$('feedIn').children.length) $('feedIn').append(el('div', { class: 'empty-feed' }, 'Chưa có tin nào.'));
    else $('feedIn').querySelector('.empty-feed')?.remove();
    // đổi khung dưới (ô nhắn / tóm tắt) TRƯỚC khi thêm tin, để cuộn xuống cuối tính đúng chiều cao
    const stick = fresh || nearBottom();
    $('composer').hidden = s.state !== 'LIVE';
    $('ended').hidden = s.state !== 'ENDED' && s.state !== 'WORK';
    if (!$('ended').hidden) { renderEnded(s); renderEndActs(s); }
    renderFeed(stick);
    renderTyping(s);
  }

  // ---------- biên bản (server sinh: Markdown cho người đọc, JSON cho tích hợp) ----------
  function downloadMinutes() {
    const d = new Date(snap.startedAt || Date.now()), p = (n) => String(n).padStart(2, '0');
    const a = el('a', { href: `/api/host/${key}/minutes.md`, download: `bien-ban-hop-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.md` });
    document.body.append(a); a.click(); a.remove();
    toast('Đang tải biên bản');
  }
  $('btnMinutes').onclick = downloadMinutes;

  // ---------- ngăn kéo mời agent (khi đang họp) ----------
  const openDrawer = () => { $('drawerBody').append($('invite')); $('drawer').hidden = $('scrim').hidden = false; };
  const closeDrawer = () => { $('drawer').hidden = $('scrim').hidden = true; $('inviteHome').append($('invite')); };
  $('btnInvite').onclick = openDrawer; $('drawerClose').onclick = closeDrawer; $('scrim').onclick = closeDrawer;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('modal').hidden) closeModal(false); else if (!$('drawer').hidden) closeDrawer(); else if ($('side').classList.contains('open')) setPanel(false); } });

  // ---------- khung chung ----------
  function renderSteps() {
    if (!snap) return;
    const step = snap.state === 'LOBBY' ? ($('ctx').value.trim() ? 2 : 1) : snap.state === 'LIVE' ? 3 : 4;
    for (const li of $('steps').children) {
      const n = +li.dataset.step;
      li.classList.toggle('on', n === step); li.classList.toggle('done', n < step);
      li.setAttribute('aria-current', n === step ? 'step' : 'false');
    }
  }
  function setConn(kind) {
    const c = $('conn'); c.className = 'conn ' + kind;
    c.querySelector('span').textContent = kind === 'ok' ? 'Đã kết nối' : kind === 'bad' ? 'Mất kết nối, đang thử lại…' : 'Đang kết nối';
  }
  function render() {
    const s = snap;
    if (!inviteBuilt) { buildInvite(s.agentId, s.origin || location.origin); inviteBuilt = true; }
    const st = $('status');
    st.className = 'badge ' + ({ LIVE: 'live', WORK: 'work', ENDED: 'ended' }[s.state] || '');
    st.textContent = { LOBBY: 'Chuẩn bị', LIVE: 'Đang họp', WORK: 'Đang thực hiện', ENDED: 'Đã kết thúc' }[s.state];
    const view = s.state === 'LOBBY' ? 'setup' : 'room', fresh = view !== lastView;
    $('setup').hidden = view !== 'setup'; $('room').hidden = view !== 'room';
    $('btnInvite').hidden = s.state !== 'LIVE';
    $('btnMinutes').hidden = s.state === 'LOBBY';
    $('btnStop').hidden = s.state !== 'LIVE' && s.state !== 'WORK';
    $('btnStop').querySelector('span').textContent = s.state === 'WORK' ? 'Đóng phòng' : 'Kết thúc';
    if (s.state !== 'LIVE' && !$('drawer').hidden) closeDrawer();
    if (view === 'setup') renderSetup(s); else renderRoom(s, fresh);
    renderSteps();
    lastView = view;
  }

  (async function loop() {
    let fails = 0;
    for (;;) {
      try {
        const r = await fetch(`/api/host/${key}/state?v=${version}&from=${log.length}`, { cache: 'no-store' });
        if (r.status === 404) { $('gone').hidden = false; setConn('bad'); return; }
        if (!r.ok) throw new Error(r.status);
        const s = await r.json();
        // link chủ trì cố định (--host-key): cuộc họp mới thay cuộc cũ dưới cùng địa chỉ thì tải lại trang
        if (snap && s.createdAt !== snap.createdAt) { location.reload(); return; }
        if (s.logFrom === log.length) log = log.concat(s.log);
        else { log = s.log; rendered = 0; $('feedIn').replaceChildren(); }
        version = s.version; clockOffset = s.now - Date.now(); snap = s; fails = 0;
        setConn('ok'); render();
      } catch {
        fails++; setConn(fails > 1 ? 'bad' : 'wait');
        await sleep(Math.min(8000, 800 * fails));
      }
    }
  })();
})();
