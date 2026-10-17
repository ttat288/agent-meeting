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
  const STATUS = { listening: 'đang nghe', thinking: 'đang soạn tin…', idle: 'có mặt', turn: 'tới lượt phát biểu', left: 'đã rời', kicked: 'bị mời ra', ended: 'đã kết thúc' };
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
  let modalResolve = null;
  function confirmBox(title, text, yes = 'Đồng ý') {
    $('modalTitle').textContent = title; $('modalText').textContent = text; $('modalYes').textContent = yes;
    $('modal').hidden = false; $('modalYes').focus();
    return new Promise(r => { modalResolve = r; });
  }
  const closeModal = (v) => { $('modal').hidden = true; if (modalResolve) { modalResolve(v); modalResolve = null; } };
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
  let inviteBuilt = false, formInit = false, endedBuilt = false, lastView = '';
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
    const combined = (cmd) => `Hãy tham gia một cuộc họp nhiều agent.\n\nCách 1 (MCP): chạy lệnh shell sau để cài MCP "agent-meeting":\n${cmd}\nNếu công cụ của bạn cần mở lại phiên để nạp MCP thì báo tôi mở lại, rồi gọi join(name="<tên bạn tự đặt, tuỳ thích>", model="<model bạn đang chạy, ví dụ Opus 5.5>"). Nếu bị báo trùng tên thì đặt tên khác. Sau đó làm đúng giao thức nó trả về và lặp wait/say cho đến khi cuộc họp kết thúc.\n\nCách 2 (dùng ngay, không cần cài, nếu MCP chưa dùng được): ${curlSteps}`;
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
  ];
  const MODE_HINT = {
    free: 'Tự do: ai có ý mới thì nói. Khi im lặng đủ lâu, một agent được hỏi có muốn chốt và rời phòng không.',
    turns: 'Lần lượt: agent phát biểu theo thứ tự slot; tới lượt mà không có gì mới thì bỏ lượt. Cả vòng đều bỏ lượt thì cuộc họp tự kết thúc.',
  };
  function initForm(s) {
    if (formInit) return; formInit = true;
    $('ctx').value = store.get(draftKey('ctx')) ?? '';
    $('endc').value = store.get(draftKey('endc')) ?? '';
    $('mode').value = s.settings.mode; $('maxMsgs').value = s.settings.maxMsgs;
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
        el('div', { class: 'st' }, `slot ${a.slot} · ${STATUS[a.status] || a.status}` + (opts.said && a.said ? ` · ${a.said} tin` : ''))),
      opts.kick && !gone ? el('button', { class: 'icon kick', type: 'button', title: 'Mời ra khỏi phòng', 'aria-label': 'Mời ' + a.name + ' ra khỏi phòng', onclick: () => kick(a.name) }, '⨯') : null);
  }
  function renderSetup(s) {
    initForm(s);
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
      await post('start', { context, endCondition: $('endc').value.trim(), settings: { mode: $('mode').value, maxMsgs: +$('maxMsgs').value, timeLimitMin: +$('timeLimit').value, idleSec: +$('idleSec').value } });
    } catch (e) { toast('Không bắt đầu được: ' + e.message, true); }
    b.disabled = false;
  };

  // ---------- màn cuộc họp ----------
  const QUICK = [
    ['Yêu cầu chốt', 'Đã đủ thảo luận. Hãy thống nhất và gửi một tin bắt đầu bằng "KẾT LUẬN:" tóm tắt quyết định cuối cùng, rồi rời phòng.'],
    ['Tóm tắt', 'Hãy tóm tắt ngắn các quan điểm đã nêu và những điểm còn bất đồng.'],
    ['Quay lại chủ đề', 'Hãy quay lại đúng chủ đề ban đầu và bỏ qua các ý lan man.'],
    ['Ngắn gọn hơn', 'Từ giờ mỗi tin hãy ngắn gọn, tối đa 3-4 câu.'],
  ];
  QUICK.forEach(([label, text]) => $('quick').append(el('button', { class: 'chip', type: 'button', title: text, onclick: () => hostSay(text, label) }, label)));
  async function hostSay(text, label) {
    try { await post('say', { text }); toast(label ? `Đã gửi: ${label}` : 'Đã gửi tới các agent'); return true; }
    catch (e) { toast('Không gửi được: ' + e.message, true); return false; }
  }
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

  async function kick(name) {
    if (!(await confirmBox(`Mời ${name} ra khỏi phòng?`, `${name} sẽ được báo dừng và không vào lại được bằng tên này.`, 'Mời ra'))) return;
    try { await post('kick', { name }); toast(`Đã mời ${name} ra khỏi phòng`); } catch (e) { toast(e.message, true); }
  }
  $('btnStop').onclick = async () => {
    if (!(await confirmBox('Kết thúc cuộc họp?', 'Các agent sẽ được báo dừng ngay. Bạn vẫn tải được biên bản sau đó.', 'Kết thúc'))) return;
    try { await post('stop'); } catch (e) { toast(e.message, true); }
  };

  function renderInfo(s) {
    const start = s.startedAt || serverNow();
    const end = s.endedAt || serverNow();
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
    if (m.type === 'sys') return el('div', { class: 'sys' }, el('time', {}, fmtTime(m.t)), m.text);
    const host = m.type === 'host', name = host ? 'Chủ trì' : m.name, color = host ? 'var(--accent)' : colorOf(m.name);
    const first = !prev || prev.type === 'sys' || prev.type !== m.type || prev.name !== m.name || m.t - prev.t > 5 * 60000;
    return el('div', { class: 'msg' + (first ? ' first' : '') + (host ? ' host' : '') + (m.conclusion ? ' conclusion' : '') },
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

  function conclusions() { return log.filter(m => m.conclusion); }
  function renderEnded(s) {
    if (endedBuilt) return; endedBuilt = true;
    const v = conclusions().at(-1);
    $('ended').replaceChildren(el('div', { class: 'endcard-in' },
      el('h3', {}, 'Cuộc họp đã kết thúc'),
      el('div', { class: 'stats' },
        el('span', {}, 'Lý do: ', el('b', {}, s.endReason || '—')),
        el('span', {}, 'Thời lượng: ', el('b', {}, fmtDur((s.endedAt || serverNow()) - (s.startedAt || s.createdAt)))),
        el('span', {}, 'Tin nhắn: ', el('b', {}, String(s.chatCount))),
        el('span', {}, 'Thành viên: ', el('b', {}, String(s.agents.length)))),
      v ? el('div', { class: 'verdict' }, el('b', {}, `Kết luận (${v.name}): `), v.text.replace(/^\s*(\*\*)?\s*KẾT LUẬN\s*(\*\*)?\s*:\s*/i, '')) : null,
      el('div', { class: 'row' },
        el('button', { class: 'btn primary', type: 'button', onclick: downloadMinutes }, 'Tải biên bản .md'),
        el('button', { class: 'btn ghost', type: 'button', onclick: () => copy(minutes(), 'Đã sao chép biên bản') }, 'Sao chép biên bản'),
        el('button', { class: 'btn ghost', type: 'button', onclick: newMeeting }, 'Cuộc họp mới'))));
  }
  async function newMeeting() {
    try { const { hostKey } = await post('new'); location.href = '/m/' + hostKey; }
    catch (e) { toast('Không tạo được cuộc họp mới: ' + e.message, true); }
  }

  function renderRoom(s, fresh) {
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
    $('ended').hidden = s.state !== 'ENDED';
    if (s.state === 'ENDED') renderEnded(s);
    renderFeed(stick);
    renderTyping(s);
  }

  // ---------- biên bản ----------
  function minutes() {
    const s = snap; if (!s) return '';
    const dt = (t) => t ? new Date(t).toLocaleString('vi-VN') : '—';
    const L = ['# Biên bản cuộc họp agent', '',
      `- **Bắt đầu:** ${dt(s.startedAt)}`, `- **Kết thúc:** ${s.endedAt ? dt(s.endedAt) + ' (' + s.endReason + ')' : 'đang họp'}`,
      `- **Thời lượng:** ${s.startedAt ? fmtDur((s.endedAt || serverNow()) - s.startedAt) : '—'}`,
      `- **Chế độ:** ${s.settings.mode === 'turns' ? 'lần lượt' : 'tự do'} · tối đa ${s.settings.maxMsgs} tin${s.settings.timeLimitMin ? ' · ' + s.settings.timeLimitMin + ' phút' : ''}`,
      `- **Thành viên:** ${s.agents.map(a => `${a.name} (${a.model || '?'}, slot ${a.slot}, ${a.said} tin)`).join(', ') || '—'}`, '',
      '## Bối cảnh', '', s.context || '—', ''];
    if (s.endCondition) L.push(`**Điều kiện kết thúc:** ${s.endCondition}`, '');
    const cs = conclusions();
    if (cs.length) { L.push('## Kết luận', ''); cs.forEach(c => L.push(`**${c.name}:** ${c.text}`, '')); }
    L.push('## Diễn biến', '');
    for (const m of log) {
      if (m.type === 'sys') L.push(`*${fmtTime(m.t)} · ${m.text}*`, '');
      else L.push(`**${m.type === 'host' ? 'Chủ trì' : m.name}**${m.type === 'chat' && modelOf(m.name) ? ` (${modelOf(m.name)})` : ''} · ${fmtTime(m.t)}`, '', m.text, '');
    }
    return L.join('\n');
  }
  function downloadMinutes() {
    const a = el('a', { href: URL.createObjectURL(new Blob([minutes()], { type: 'text/markdown;charset=utf-8' })),
      download: `bien-ban-hop-${new Date(snap.startedAt || Date.now()).toISOString().slice(0, 16).replace(/[:T]/g, '-')}.md` });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Đã tải biên bản');
  }
  $('btnMinutes').onclick = downloadMinutes;

  // ---------- ngăn kéo mời agent (khi đang họp) ----------
  const openDrawer = () => { $('drawerBody').append($('invite')); $('drawer').hidden = $('scrim').hidden = false; };
  const closeDrawer = () => { $('drawer').hidden = $('scrim').hidden = true; $('inviteHome').append($('invite')); };
  $('btnInvite').onclick = openDrawer; $('drawerClose').onclick = closeDrawer; $('scrim').onclick = closeDrawer;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('modal').hidden) closeModal(false); else if (!$('drawer').hidden) closeDrawer(); } });

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
    st.className = 'badge ' + (s.state === 'LIVE' ? 'live' : s.state === 'ENDED' ? 'ended' : '');
    st.textContent = s.state === 'LOBBY' ? 'Chuẩn bị' : s.state === 'LIVE' ? 'Đang họp' : 'Đã kết thúc';
    const view = s.state === 'LOBBY' ? 'setup' : 'room', fresh = view !== lastView;
    $('setup').hidden = view !== 'setup'; $('room').hidden = view !== 'room';
    $('btnInvite').hidden = s.state !== 'LIVE';
    $('btnMinutes').hidden = s.state === 'LOBBY';
    $('btnStop').hidden = s.state !== 'LIVE';
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
