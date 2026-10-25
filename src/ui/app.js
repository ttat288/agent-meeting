'use strict';
(() => {
  const key = location.pathname.split('/').pop();
  const { tr, lang: LANG } = window.AgentMeetingI18n; // dịch câu tiếng Việt sang ngôn ngữ đang chọn (bảng ở src/ui/i18n.js)
  const LOCALE = LANG === 'en' ? 'en-GB' : 'vi-VN';
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  window.AgentMeetingI18n.apply(document.body);
  $('btnLang').textContent = LANG === 'en' ? 'VI' : 'EN';
  $('btnLang').title = LANG === 'en' ? 'Tiếng Việt' : 'English'; /* i18n-ok: tên ngôn ngữ */
  $('btnLang').setAttribute('aria-label', $('btnLang').title);
  $('btnLang').onclick = () => window.AgentMeetingI18n.setLang(LANG === 'en' ? 'vi' : 'en');

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
  const STATUS = { listening: tr('đang nghe'), thinking: tr('đang soạn tin…'), idle: tr('có mặt'), turn: tr('tới lượt phát biểu'), away: tr('vắng (có thể đang chờ người dùng duyệt)'), left: tr('đã rời'), kicked: tr('bị mời ra'), ended: tr('đã kết thúc'), working: tr('đang làm việc được giao'), finished: tr('đã báo xong việc') };
  const fmtTime = (t) => new Date(t).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
  const fmtDur = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  };
  const fmtSize = (n) => n < 1024 ? `${n} B` : `${(n / (n < 1048576 ? 1024 : 1048576)).toFixed(1).replace('.', ',')} ${n < 1048576 ? 'KB' : 'MB'}`;
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
    const stack = $('toasts'); stack.append(t); stack.scrollTop = stack.scrollHeight;
    setTimeout(() => t.remove(), 2600);
  }
  // Disclosures keep native button/link semantics; modal surfaces isolate the background.
  let overlayReturn = null, inerted = [];
  const focusables = root => [...root.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex="0"]')].filter(e => {
    if (e.disabled || e.tabIndex < 0 || !e.getClientRects().length || e.closest('[hidden],[inert]')) return false;
    if (e.checkVisibility && !e.checkVisibility()) return false;
    for (let parent = e.parentElement; parent && parent !== root; parent = parent.parentElement) {
      if (parent.matches('details:not([open])') && !parent.querySelector(':scope > summary')?.contains(e)) return false;
    }
    return true;
  });
  function restoreBackground() { inerted.forEach(([e, value]) => { e.inert = value; }); inerted = []; }
  function isolate(root) {
    restoreBackground();
    for (let current = root; current && current !== document.body; current = current.parentElement) {
      for (const sibling of current.parentElement.children) if (sibling !== current && !['SCRIPT','LINK'].includes(sibling.tagName)) { inerted.push([sibling, sibling.inert]); sibling.inert = true; }
    }
  }
  function returnFocus() { restoreBackground(); if ($('side').classList.contains('open') && matchMedia('(max-width:1000px)').matches) isolate($('side')); const target = overlayReturn?.getClientRects().length ? overlayReturn : $('btnOptions'); target?.focus(); }
  function closeMenus(focus = false) {
    for (const [trigger, panel] of [['btnOptions','optionsPanel'],['btnQuick','quick']]) {
      if (!$(panel).hidden) { $(panel).hidden = true; $(trigger).setAttribute('aria-expanded','false'); if (focus) $(trigger).focus(); }
    }
  }
  for (const [trigger, panel] of [['btnOptions','optionsPanel'],['btnQuick','quick']]) {
    $(trigger).onclick = () => { const open = $(panel).hidden; closeMenus(); $(panel).hidden = !open; $(trigger).setAttribute('aria-expanded',String(open)); if (open) focusables($(panel))[0]?.focus(); };
    $(panel).addEventListener('click', e => { if (e.target.closest('button,a')) { closeMenus(false); $(trigger).focus(); } }, true);
  }
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.utility')) closeMenus(); });
  document.addEventListener('focusin', e => { if (!e.target.closest('.utility')) closeMenus(); });
  window.addEventListener('hashchange', () => { closeMenus(); if ($('side').classList.contains('open')) setPanel(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && (!$('optionsPanel').hidden || !$('quick').hidden)) { e.preventDefault(); closeMenus(true); return; }
    const root = !$('modal').hidden ? $('modal') : !$('drawer').hidden ? $('drawer') : $('side').classList.contains('open') && matchMedia('(max-width:1000px)').matches ? $('side') : null;
    if (root && e.key === 'Tab') { const items = focusables(root), first = items[0], last = items.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
  });
  let modalResolve = null, modalAsk = false;
  function confirmBox(title, text, yes = tr('Đồng ý'), ask) {
    $('modalTitle').textContent = title; $('modalText').textContent = text; $('modalYes').textContent = yes;
    modalAsk = ask !== undefined;
    $('modalInput').hidden = !modalAsk; $('modalInput').value = ask ?? '';
    $('modalYes').className = 'btn ' + (modalAsk ? 'primary' : 'danger');
    overlayReturn = document.activeElement; isolate($('modal'));
    $('modal').hidden = false; (modalAsk ? $('modalInput') : $('modalYes')).focus();
    return new Promise(r => { modalResolve = r; });
  }
  const promptBox = (title, text, value, yes = tr('Lưu')) => confirmBox(title, text, yes, value);
  const closeModal = (v) => {
    $('modal').hidden = true; returnFocus();
    if (modalResolve) { modalResolve(modalAsk ? (v ? $('modalInput').value.trim() : null) : v); modalResolve = null; }
  };
  $('modalInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); closeModal(true); } });
  $('modalYes').onclick = () => closeModal(true);
  $('modalNo').onclick = () => closeModal(false);
  $('modal').onclick = (e) => { if (e.target === $('modal')) closeModal(false); };

  async function copy(text, what = tr('Đã sao chép')) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else { const a = el('textarea', { style: 'position:fixed;opacity:0' }); a.value = text; document.body.append(a); a.select(); document.execCommand('copy'); a.remove(); }
      toast(what + ' ✓');
    } catch { toast(tr('Không sao chép được, hãy bôi đen và sao chép thủ công'), true); }
  }
  async function post(act, body) {
    const r = await fetch(`/api/host/${key}/${act}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || tr('Lỗi ') + r.status);
    return d;
  }

  // ---------- trạng thái ----------
  let sharedTasks = [];
  let snap = null, log = [], version = -1, rendered = 0, clockOffset = 0, unread = 0;
  let formInit = false, endedBuilt = '', lastView = '';
  const serverNow = () => Date.now() + clockOffset;
  const draftKey = (k) => `agent-meeting:${key}:${k}`;

  // ---------- mời agent ----------
  function codeBlock(caption, text, primary) {
    return el('div', { class: 'blk' },
      el('div', { class: 'cap' }, caption),
      el('div', { class: 'code' }, el('pre', {}, text),
        el('button', { class: 'btn sm ' + (primary ? 'primary' : 'ghost'), type: 'button', onclick: () => copy(text, primary ? tr('Đã sao chép prompt') : tr('Đã sao chép lệnh')) }, tr('Sao chép'))));
  }
  // Thẻ mời. Agent ở đâu: "máy này" dùng http://localhost (dữ liệu không rời máy); "máy khác" dùng địa chỉ công khai
  // (tunnel bật khi chủ trì bấm, hoặc --public-url). Đường chính là "Đã kết nối": người dùng tự chạy lệnh connect một lần
  // (hoặc bấm nút trên máy này) để cài MCP + cấp quyền đúng tool, nên prompt dán vào không cần URL hay mã nào.
  let where = 'local', connAgent = 'claude', inviteTab = 0, connLog = '';
  const CONN = [['claude', 'Claude Code'], ['codex', 'Codex CLI'], ['gemini', 'Gemini CLI']];
  function buildInvite(s) {
    const local = s.local, pub = s.public;
    if (!local) where = 'remote'; // trang không mở trên máy chạy server (--public-url): chỉ mời qua địa chỉ công khai
    if (!changed('invite', [where, local, pub, s.tunnel, connAgent, inviteTab, connLog, s.agentId])) return;
    const o = where === 'local' ? local : pub, id = s.agentId;
    const seg = local ? el('div', { class: 'seg where', role: 'radiogroup', 'aria-label': tr('Agent ở đâu?') },
      ...[['local', tr('Trên máy này')], ['remote', tr('Máy khác')]].map(([k, label]) =>
        el('button', { type: 'button', class: where === k ? 'on' : '', role: 'radio', 'aria-checked': String(where === k), onclick: () => { where = k; buildInvite(snap); } }, label))) : null;
    const whereHint = el('p', { class: 'hint' }, where === 'local'
      ? tr`Agent chạy trên chính máy này dùng ${local}: dữ liệu không đi qua Internet.`
      : pub ? tr`Agent ở máy khác dùng địa chỉ công khai ${pub}.` : '');
    if (where === 'remote' && !pub) {
      const btn = el('button', { class: 'btn primary', type: 'button', disabled: s.tunnel?.starting || !s.tunnel?.can, onclick: async () => {
        btn.disabled = true; btn.textContent = tr('Đang bật… (tới 1-2 phút)');
        try { await post('tunnel'); toast(tr('Đã bật địa chỉ công khai')); } catch (e) { toast(e.message, true); btn.disabled = false; btn.textContent = tr('Bật địa chỉ công khai'); }
      } }, s.tunnel?.starting ? tr('Đang bật… (tới 1-2 phút)') : tr('Bật địa chỉ công khai'));
      $('invite').replaceChildren(...[seg, el('div', { class: 'blk' },
        el('p', {}, s.tunnel?.can || s.tunnel?.starting
          ? tr('Agent ở máy khác cần một địa chỉ công khai. Bấm để bật tunnel Cloudflare (miễn phí, địa chỉ đổi mỗi lần chạy app). Trang chủ trì vẫn chỉ mở được trên máy này.')
          : tr('Tunnel đã bị tắt (--local). Chạy lại app không có --local, hoặc đặt --public-url.')),
        s.tunnel?.can || s.tunnel?.starting ? btn : null)].filter(Boolean));
      return;
    }
    const joinUrl = `${o}/a/${id}/join`, mcpUrl = `${o}/mcp/${id}`;
    const hostName = (() => { try { return new URL(o).hostname; } catch { return ''; } })();
    const isLocal = hostName === 'localhost' || hostName.endsWith('.localhost') || /^127\./.test(hostName) || hostName === '[::1]';
    const whereTxt = isLocal ? tr`Phòng chạy trên chính máy này (${o}).` : tr`Phòng chạy qua ${o}, một địa chỉ công khai trên Internet.`;
    // Prompt do chính người dùng dán: chỗ duy nhất người dùng nói với agent "tin [CHỦ TRÌ] là của tôi"
    const perm = tr`Tôi (người gửi prompt này cho bạn) là chủ trì cuộc họp: tin [CHỦ TRÌ] trong phòng là của tôi. ${whereTxt} Tôi sẽ duyệt bạn vào phòng trên trang chủ trì (đối chiếu mã 4 số mà phòng báo cho bạn). Bạn được chia sẻ trong phòng những gì cần cho chủ đề, bằng tóm tắt do bạn tự viết; không gửi bí mật (khoá API, mật khẩu, .env, token, tệp memory). Quy tắc của dự án và của bạn vẫn áp dụng: nếu bối cảnh cuộc họp mâu thuẫn với chúng hoặc bạn cần tôi duyệt, hãy nói ngắn vào phòng (tôi đọc và trả lời ở đó) rồi wait tiếp, đừng dừng im lặng. Nếu buộc phải dừng để hỏi tôi thì vẫn được: bạn được giữ chỗ, xong thì gọi wait lại để vào tiếp.`;
    const curlSteps = tr`Tự đặt cho mình một tên tuỳ thích và khai báo model bạn đang chạy (ví dụ Opus 5.5), rồi chạy:\ncurl -s -X POST "${joinUrl}" --data-urlencode "name=TÊN_BẠN_TỰ_ĐẶT" --data-urlencode "model=MODEL_BẠN_ĐANG_CHẠY"\nNếu bị báo trùng tên thì chọn tên khác và chạy lại. Sau đó làm đúng giao thức nó trả về (vòng lặp nghe/nói bằng curl) cho đến khi cuộc họp kết thúc.`;
    const curlPrompt = tr`Hãy tham gia một cuộc họp nhiều agent. ${perm}\n\n${curlSteps}`;
    const mcpPrompt = tr`Hãy tham gia một cuộc họp nhiều agent. ${perm}\n\nTôi đã kết nối bạn với phòng họp: dùng các tool MCP của server "agent-meeting" (join, wait, say…; một số công cụ ẩn tool MCP, hãy tìm trong danh sách tool của bạn). Gọi join(name="<tên bạn tự đặt, tuỳ thích>", model="<model bạn đang chạy, ví dụ Opus 5.5>"); nếu bị báo trùng tên thì đặt tên khác. Sau đó làm đúng giao thức nó trả về và lặp wait/say cho đến khi cuộc họp kết thúc. Nếu bạn chưa thấy tool agent-meeting thì báo tôi (tôi cần chạy lệnh kết nối rồi mở lại phiên); đừng tự cài hay tự tìm địa chỉ khác.`;
    const cmd = `npx github:ttat288/agent-meeting connect ${connAgent}${where === 'remote' ? ` --room ${joinUrl}` : ''}`;
    const agentName = CONN.find(c => c[0] === connAgent)[1];
    const connTab = () => {
      const btn = where === 'local' ? el('button', { class: 'btn primary', type: 'button', onclick: async () => {
        btn.disabled = true;
        try { const r = await post('connect', { agent: connAgent }); connLog = r.log || ''; toast(r.ok ? tr`Đã kết nối ${agentName}` : tr('Chưa xong hết: xem chi tiết bên dưới'), !r.ok); }
        catch (e) { connLog = e.message; toast(e.message, true); }
        btn.disabled = false; buildInvite(snap);
      } }, tr`Kết nối ${agentName} trên máy này`) : null;
      return [
        el('div', { class: 'blk' }, el('div', { class: 'cap' }, tr('Bước 1, một lần cho mỗi máy: kết nối agent với agent-meeting.')),
          el('div', { class: 'seg' }, ...CONN.map(([k, label]) => el('button', { type: 'button', class: connAgent === k ? 'on' : '', 'aria-pressed': String(connAgent === k), onclick: () => { connAgent = k; connLog = ''; buildInvite(snap); } }, label)))),
        codeBlock(where === 'local' ? tr('Chạy trong terminal (hoặc bấm nút bên dưới):') : tr('Chạy trong terminal của máy có agent:'), cmd),
        btn ? el('div', { class: 'blk' }, btn) : null,
        connLog ? el('div', { class: 'blk' }, el('pre', { class: 'connlog' }, connLog)) : null,
        el('p', { class: 'hint' }, tr`Lệnh này đăng ký MCP "agent-meeting" bằng chính CLI của ${agentName} và cho phép các tool họp chạy không cần hỏi (cả khi Claude Code ở auto mode). Gửi tệp vẫn được hỏi từng lần. Gỡ: thay connect bằng disconnect.`),
        codeBlock(tr('Bước 2: mở lại phiên agent rồi dán prompt này (không chứa địa chỉ hay mã):'), mcpPrompt, true),
      ].filter(Boolean);
    };
    const tabs = [
      [tr('Đã kết nối (MCP)'), connTab],
      [tr('Dán là vào ngay'), () => [codeBlock(tr('Dùng với mọi agent chạy được shell/curl. Không cần cài.'), curlPrompt, true),
        el('p', { class: 'hint' }, tr('Claude Code ở auto mode có thể chặn vòng lặp curl tới phòng họp (đúng thiết kế an toàn của nó): khi đó dùng tab "Đã kết nối".'))]],
      [tr('Khác'), () => [codeBlock(tr('Thêm một MCP server dạng HTTP (Streamable HTTP) với URL:'), mcpUrl), codeBlock(tr('Hoặc dùng API văn bản (curl):'), joinUrl)]],
    ];
    const bar = el('div', { class: 'tabs', role: 'tablist' }), body = el('div');
    tabs.forEach(([name, make], i) => {
      const t = el('button', { class: 'tab' + (i === inviteTab ? ' on' : ''), type: 'button', role: 'tab', 'aria-selected': String(i === inviteTab) }, name);
      t.onclick = () => { inviteTab = i; buildInvite(snap); };
      bar.append(t);
    });
    body.replaceChildren(...tabs[inviteTab][1]());
    $('invite').replaceChildren(...[seg, whereHint.textContent ? whereHint : null, bar, body,
      el('p', { class: 'note' }, '🔒', tr('Prompt có mã mời: ai có prompt cũng chỉ xin vào được; bạn duyệt từng agent (đối chiếu mã 4 số). Link trang này (chủ trì) thì đừng gửi cho ai.'))].filter(Boolean));
  }

  // ---------- màn chuẩn bị: bản brief (bối cảnh + tuỳ chọn) là nguồn chung cho form và JSON ----------
  const BR = window.AgentMeetingBrief;
  const svgIcon = (d) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 20 20'); s.setAttribute('aria-hidden', 'true'); const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); s.append(p); return s; };
  const TEMPLATES = [
    [tr('Tranh luận'), tr('Mỗi agent bảo vệ một quan điểm, phản biện rồi thống nhất.'), 'M10 3v14M6 17h8M4 6h12M4 6l-2 5a2 2 0 0 0 4 0zM16 6l-2 5a2 2 0 0 0 4 0z',
      tr('Tranh luận về: <chủ đề>.\nMỗi agent bảo vệ một quan điểm khác nhau, phản biện lẫn nhau bằng lập luận cụ thể, rồi cả nhóm thống nhất một kết luận có lý do.')],
    ['Brainstorm', tr('Mỗi lượt 1-2 ý mới, cuối cùng chọn 3 ý tốt nhất.'), 'M7.5 14.5h5M8.5 17.5h3M10 2.5a5 5 0 0 0-3 9c.6.5 1 1.3 1 2.2V14h4v-.3c0-.9.4-1.7 1-2.2a5 5 0 0 0-3-9z',
      tr('Cùng brainstorm ý tưởng cho: <chủ đề>.\nMỗi lượt đưa 1-2 ý mới, không lặp lại ý đã có. Cuối cùng chọn ra 3 ý tốt nhất và giải thích vì sao.')],
    [tr('Review thiết kế'), tr('Chỉ ra rủi ro, đề xuất cải tiến, chốt danh sách việc.'), 'M8.5 3.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12.2 12.2 16.5 16.5',
      tr('Review thiết kế/kiến trúc sau: <dán mô tả hoặc nội dung>.\nChỉ ra rủi ro, đề xuất cải tiến, rồi thống nhất danh sách việc cần làm theo thứ tự ưu tiên.')],
    [tr('Lập kế hoạch'), tr('Chia bước, phân công, ước lượng thời gian.'), 'M8.5 5h8M8.5 10h8M8.5 15h8M3 5l1.2 1.2L6.5 4M3 10l1.2 1.2L6.5 9M3.5 15h2',
      tr('Lập kế hoạch cho: <mục tiêu>.\nChia nhỏ thành các bước, phân công agent nào phụ trách phần nào, ước lượng thời gian, và chốt kế hoạch cuối cùng.')],
    [tr('Ra quyết định'), tr('So sánh phương án theo chi phí, rủi ro, thời gian.'), 'M10 2.5v15M10 4.5h5l2 2-2 2h-5M10 10.5H5l-2 2 2 2h5',
      tr('Cần chọn giữa: <phương án A> và <phương án B>.\nPhân tích ưu nhược điểm theo chi phí, rủi ro và thời gian, rồi chọn một phương án và nêu điều kiện để đổi ý.')],
    [tr('Review tiến độ'), tr('Rà soát việc của cuộc họp trước (dùng với Họp tiếp).'), 'M3.5 16.5h13M6 13.5v-3M10 13.5v-7M14 13.5v-5',
      tr('Họp rà soát tiến độ các việc từ cuộc họp trước (hệ thống tự gửi kèm danh sách việc và quyết định).\nMỗi agent báo trạng thái thật của việc mình phụ trách bằng dòng TIẾN ĐỘ VIỆC (ví dụ "TIẾN ĐỘ VIỆC 2: xong | commit abc123, test xanh"), nêu vướng mắc, rồi thống nhất việc tiếp theo (dòng VIỆC).')],
  ];
  const MODE_HINT = {
    free: tr('Ai có ý mới thì nói. Khi phòng im lặng đủ lâu, một agent được hỏi có muốn chốt và rời phòng không.'),
    turns: tr('Agent phát biểu theo thứ tự slot; tới lượt mà không có gì mới thì bỏ lượt. Cả vòng đều bỏ lượt thì cuộc họp tự kết thúc.'),
  };
  let draft = null, base = null, step = 1, placeholderOk = '';
  const fmtN = (n) => n.toLocaleString(LOCALE);
  const saveDraft = () => store.set(draftKey('brief'), BR.stringify(draft));

  // danh sách sửa được (chương trình họp, vai trò): Enter thêm dòng dưới, Backspace ở dòng trống thì xoá, Alt+↑/↓ đổi chỗ
  function listEditor(root, o) {
    const items = () => [...root.querySelectorAll('input')];
    const add = el('button', { class: 'btn ghost sm add', type: 'button' }, '+ ' + o.addText);
    const empty = el('li', { class: 'items-empty' }, o.empty);
    const renum = () => {
      const ins = items();
      ins.forEach((inp, i) => {
        const li = inp.closest('li');
        li.querySelector('.ix').textContent = i + 1;
        inp.setAttribute('aria-label', `${o.label} ${i + 1}`);
        li.querySelector('.up').disabled = i === 0; li.querySelector('.down').disabled = i === ins.length - 1;
        li.querySelector('.up').setAttribute('aria-label', tr`Đưa ${o.label.toLowerCase()} ${i + 1} lên`);
        li.querySelector('.down').setAttribute('aria-label', tr`Đưa ${o.label.toLowerCase()} ${i + 1} xuống`);
        li.querySelector('.del').setAttribute('aria-label', tr`Xoá ${o.label.toLowerCase()} ${i + 1}`);
      });
      empty.hidden = ins.length > 0; add.disabled = ins.length >= o.max;
      if (o.count) o.count(ins.length);
    };
    const row = (v) => {
      const inp = el('input', { maxlength: o.maxLen, placeholder: o.placeholder, autocomplete: 'off' }); inp.value = v;
      const li = el('li', { class: 'item' }, el('span', { class: 'ix', 'aria-hidden': 'true' }), inp,
        el('button', { class: 'icon up', type: 'button', title: tr('Lên'), onclick: () => move(li, -1) }, '↑'),
        el('button', { class: 'icon down', type: 'button', title: tr('Xuống'), onclick: () => move(li, 1) }, '↓'),
        el('button', { class: 'icon del', type: 'button', title: tr('Xoá'), onclick: () => remove(li) }, '✕'));
      inp.addEventListener('input', o.onChange);
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); if (items().length < o.max) insert('', li); }
        else if (e.key === 'Backspace' && !inp.value && items().length) { e.preventDefault(); remove(li); }
        else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); move(li, e.key === 'ArrowUp' ? -1 : 1); inp.focus(); }
      });
      return li;
    };
    const insert = (v, after) => { const li = row(v); (after ? after.after(li) : empty.before(li)); renum(); li.querySelector('input').focus(); o.onChange(); };
    const remove = (li) => {
      const ins = items(), i = ins.indexOf(li.querySelector('input'));
      li.remove(); renum(); o.onChange();
      const next = items()[Math.max(0, i - 1)]; (next || add).focus();
    };
    const move = (li, d) => {
      const sib = d < 0 ? li.previousElementSibling : li.nextElementSibling;
      if (!sib || !sib.classList.contains('item')) return;
      d < 0 ? sib.before(li) : sib.after(li); renum(); o.onChange();
      li.querySelector(d < 0 ? '.up' : '.down').focus();
    };
    add.onclick = () => insert('');
    root.after(add);
    return {
      get: () => items().map(i => i.value),
      set: (arr) => { root.replaceChildren(...arr.map(row), empty); renum(); },
    };
  }
  let agendaEd, rolesEd;

  function readForm() {
    return BR.toBrief({
      context: $('ctx').value, endCondition: $('endc').value, agenda: agendaEd.get(), roles: rolesEd.get(),
      followUp: $('followUp').checked, mode: document.querySelector('input[name=mode]:checked')?.value,
      maxMsgs: $('maxMsgs').value, timeLimitMin: $('timeLimit').value, idleSec: $('idleSec').value,
    }, base);
  }
  function writeForm(b) {
    $('ctx').value = b.context; $('endc').value = b.endCondition;
    agendaEd.set(b.settings.agenda); rolesEd.set(b.roles);
    $('followUp').checked = b.settings.followUp;
    for (const r of document.querySelectorAll('input[name=mode]')) r.checked = r.value === b.settings.mode;
    $('maxMsgs').value = b.settings.maxMsgs; $('timeLimit').value = b.settings.timeLimitMin; $('idleSec').value = b.settings.idleSec;
    formSideEffects();
  }
  function formSideEffects() {
    const n = $('ctx').value.length;
    $('ctxCount').textContent = `${fmtN(n)} / ${fmtN(BR.LIMITS.context)}`;
    $('ctxCount').classList.toggle('warn', n > BR.LIMITS.context * .9);
    const mode = document.querySelector('input[name=mode]:checked')?.value || 'free';
    $('modeHint').textContent = MODE_HINT[mode]; $('idleField').hidden = mode !== 'free';
    renderChecks();
  }
  // form đổi → bản brief + JSON cập nhật (JSON đang sai dở dang cũng bị thay: form là bản mới nhất)
  function formChanged() {
    draft = readForm(); saveDraft(); formSideEffects();
    $('ctxErr').hidden = true; $('ctxField').classList.remove('invalid');
    if (document.activeElement !== $('jsonText')) showJson(true);
  }
  function showJson(reset) {
    if (reset) $('jsonText').value = BR.stringify(draft);
    renderIssues(reset ? { ok: true, errors: [], warnings: [] } : null);
  }
  function renderIssues(r) {
    const st = $('jsonStat');
    if (!r) return;
    st.className = 'jstat ' + (r.ok ? 'ok' : 'bad');
    st.textContent = r.ok ? (r.warnings.length ? tr`✓ Hợp lệ · ${r.warnings.length} lưu ý` : tr('✓ Hợp lệ, khớp với form')) : tr`✕ ${r.errors.length} lỗi, chưa áp dụng`;
    const line = (x) => x.line ? el('button', { class: 'ln', type: 'button', title: tr('Tới dòng ') + x.line, onclick: () => gotoLine(x.line) }, tr('dòng ') + x.line) : null;
    $('jsonIssues').replaceChildren(...r.errors.map(x => el('li', { class: 'bad' }, line(x), x.msg)), ...r.warnings.map(x => el('li', { class: 'warn' }, line(x), x.msg)));
  }
  function gotoLine(n) {
    const t = $('jsonText'), lines = t.value.split('\n'), at = lines.slice(0, n - 1).reduce((a, l) => a + l.length + 1, 0);
    t.focus(); t.setSelectionRange(at, at + (lines[n - 1] || '').length);
    t.scrollTop = Math.max(0, (n - 4) * parseFloat(getComputedStyle(t).lineHeight || '18'));
  }
  // JSON hợp lệ → áp ngay vào form (không định dạng lại chữ người dùng đang gõ)
  let jsonTimer = 0;
  function jsonChanged(now) {
    clearTimeout(jsonTimer);
    const run = () => {
      const r = BR.parseBrief($('jsonText').value, base, LANG);
      renderIssues(r);
      if (r.ok) { draft = r.brief; saveDraft(); writeForm(draft); }
      return r;
    };
    if (now) return run();
    jsonTimer = setTimeout(run, 250);
  }
  function setTab(t, focus) {
    const json = t === 'json';
    for (const b of $('briefTabs').children) { const on = b.dataset.tab === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; }
    $('formView').hidden = json; $('jsonView').hidden = !json;
    store.set('agent-meeting:briefTab', t);
    if (json && focus) $('jsonText').focus();
  }

  function initForm(s) {
    if (formInit) return; formInit = true;
    base = { settings: { ...s.settings, agenda: [] } };
    const stored = store.get(draftKey('brief'));
    const parsed = stored && BR.parseBrief(stored, base, LANG);
    if (parsed && parsed.ok) draft = parsed.brief;
    else if (store.get(draftKey('ctx')) !== null || store.get(draftKey('agenda')) !== null) // bản nháp kiểu cũ (≤ v3.2)
      draft = BR.toBrief({ ...s.settings, context: store.get(draftKey('ctx')) ?? '', endCondition: store.get(draftKey('endc')) ?? '',
        agenda: store.get(draftKey('agenda')) ?? s.agenda, followUp: (store.get(draftKey('followUp')) ?? String(s.settings.followUp)) === 'true' }, base);
    else draft = s.preset ? BR.toBrief({ ...s.preset.settings, ...s.preset }, base) : BR.toBrief({ ...s.settings, agenda: s.agenda }, base);
    const common = { onChange: formChanged };
    agendaEd = listEditor($('agendaEd'), { ...common, max: BR.LIMITS.agenda, maxLen: BR.LIMITS.item, label: tr('Mục'), addText: tr('Thêm mục'),
      placeholder: tr('Ví dụ: Chọn database'), empty: tr('Chưa có mục nào: cả cuộc họp bàn một chủ đề.'),
      count: (n) => { $('agendaNum').textContent = n ? tr`${n}/${BR.LIMITS.agenda} mục` : ''; } });
    rolesEd = listEditor($('rolesEd'), { ...common, max: BR.LIMITS.roles, maxLen: BR.LIMITS.role, label: tr('Vai trò'), addText: tr('Thêm vai trò'),
      placeholder: tr('Ví dụ: phản biện'), empty: tr('Không đặt vai trò: các agent bàn ngang hàng.') });
    const tpl = $('templates');
    TEMPLATES.forEach(([name, desc, icon, text]) => tpl.append(el('button', { class: 'tpl', type: 'button', onclick: () => useTemplate(text) },
      el('span', { class: 'tpl-i' }, svgIcon(icon)), el('span', { class: 'tpl-t' }, el('b', {}, name), el('small', {}, desc)))));
    for (const id of ['ctx', 'endc', 'maxMsgs', 'timeLimit', 'idleSec']) $(id).addEventListener('input', formChanged);
    $('followUp').addEventListener('change', formChanged);
    for (const r of document.querySelectorAll('input[name=mode]')) r.addEventListener('change', formChanged);
    writeForm(draft); showJson(true);
    $('jsonText').addEventListener('input', () => jsonChanged());
    $('jsonText').addEventListener('blur', () => { if (BR.parseBrief($('jsonText').value, base, LANG).ok) jsonChanged(true); });
    setTab(store.get('agent-meeting:briefTab') === 'json' ? 'json' : 'form');
  }
  for (const b of $('briefTabs').children) b.onclick = () => setTab(b.dataset.tab);
  $('briefTabs').addEventListener('keydown', (e) => { // tablist: mũi tên trái/phải
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const t = $('tabForm').classList.contains('on') ? 'json' : 'form'; setTab(t); $(t === 'json' ? 'tabJson' : 'tabForm').focus();
  });
  $('btnAiPrompt').onclick = () => copy(BR.aiPrompt(draft, LANG), tr('Đã sao chép prompt: dán vào ChatGPT/Claude kèm mô tả cuộc họp'));
  $('btnToJson').onclick = () => { setTab('json', true); $('jsonText').select(); };
  $('jsonApply').onclick = () => {
    const r = jsonChanged(true);
    if (!r.ok) { if (r.errors[0].line) gotoLine(r.errors[0].line); toast(tr('JSON còn lỗi: ') + r.errors[0].msg, true); return; }
    showJson(true); renderIssues(r); setTab('form'); toast(tr('Đã áp dụng bản brief vào form'));
  };
  $('jsonCopy').onclick = () => copy(BR.stringify(draft), tr('Đã sao chép JSON'));
  $('jsonDownload').onclick = () => {
    const slug = (draft.context.split('\n')[0] || 'cuoc-hop').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'cuoc-hop';
    const url = URL.createObjectURL(new Blob([BR.stringify(draft) + '\n'], { type: 'application/json' }));
    const a = el('a', { href: url, download: `brief-${slug}.json` }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('jsonOpen').onclick = () => $('jsonFile').click();
  $('jsonFile').onchange = () => { // đọc ngay trong trình duyệt, không gửi lên server
    const f = $('jsonFile').files[0]; $('jsonFile').value = '';
    if (!f) return;
    if (f.size > BR.LIMITS.text) { toast(tr`Tệp quá lớn (${fmtSize(f.size)}), tối đa ${BR.LIMITS.text / 1024} KB`, true); return; }
    const rd = new FileReader();
    rd.onload = () => { setTab('json'); $('jsonText').value = String(rd.result); const r = jsonChanged(true); toast(r.ok ? tr`Đã mở ${f.name}` : tr`${f.name}: JSON còn lỗi`, !r.ok); };
    rd.onerror = () => toast(tr('Không đọc được tệp'), true);
    rd.readAsText(f);
  };
  async function useTemplate(text) {
    const cur = $('ctx').value.trim();
    if (cur && cur !== text && !(await confirmBox(tr('Dùng mẫu này?'), tr('Nội dung "Lời dặn cho các agent" hiện tại sẽ được thay bằng mẫu.'), tr('Thay bằng mẫu')))) return;
    $('ctx').value = text; formChanged();
    const i = text.indexOf('<'), j = text.indexOf('>', i);
    $('ctx').focus(); if (i >= 0 && j > i) $('ctx').setSelectionRange(i, j + 1);
  }
  // bối cảnh phải có chữ; còn <…> của mẫu thì hỏi lại (một lần cho mỗi nội dung)
  async function briefReady(yes) {
    if (!draft.context) {
      goStep(1); setTab('form');
      $('ctxErr').hidden = false; $('ctxField').classList.add('invalid'); $('ctx').focus(); return false;
    }
    if (BR.PLACEHOLDER.test(draft.context) && placeholderOk !== draft.context) {
      if (!(await confirmBox(tr('Bối cảnh còn chỗ trống'), tr`Bối cảnh có đoạn ${BR.PLACEHOLDER.exec(draft.context)[0]} trông như chỗ trống của mẫu chưa điền. ${yes}?`, yes))) {
        goStep(1); setTab('form'); const i = draft.context.search(BR.PLACEHOLDER); $('ctx').focus(); $('ctx').setSelectionRange(i, draft.context.indexOf('>', i) + 1); return false;
      }
      placeholderOk = draft.context;
    }
    return true;
  }
  function goStep(n, focus) {
    if (step === n) return;
    step = n;
    if (location.hash !== (n === 2 ? '#moi-agent' : '#boi-canh')) history.pushState(null, '', n === 2 ? '#moi-agent' : '#boi-canh');
    if (snap) render();
    $('setup').scrollTop = 0;
    if (focus) $(n === 2 ? 'inviteTitle' : 'briefTitle').focus({ preventScroll: true });
  }
  window.addEventListener('popstate', () => { step = location.hash === '#moi-agent' ? 2 : 1; if (snap) render(); });
  window.addEventListener('hashchange', () => { step = location.hash === '#moi-agent' ? 2 : 1; if (snap) render(); });
  $('btnNextStep').onclick = async () => { if (await briefReady(tr('Vẫn tiếp tục'))) goStep(2, true); };
  $('btnBack').onclick = $('btnEditBrief').onclick = () => goStep(1, true);
  for (const b of $('steps').querySelectorAll('button[data-go]')) b.onclick = async () => {
    if (!snap || snap.state !== 'LOBBY') return;
    if (+b.dataset.go === 2) { if (step !== 2 && await briefReady(tr('Vẫn tiếp tục'))) goStep(2, true); } else goStep(1, true);
  };

  const presentAgents = () => snap.agents.filter(a => a.status !== 'left' && a.status !== 'kicked');
  // brief có N vai trò thì phải có ít nhất N agent (tính cả agent vắng) mới được bắt đầu
  const missing = () => { const need = BR.rolesNeeded(draft.roles), have = presentAgents().length; return have < need ? { need, have } : null; };
  function renderChecks() {
    if (!snap || !draft) return;
    const n = presentAgents().length, ctx = draft.context.length, miss = missing(), wait = (snap.pending || []).length;
    $('checks1').replaceChildren(
      el('span', { class: ctx ? 'ok' : '' }, ctx ? tr`Đã có bối cảnh (${fmtN(ctx)} ký tự)` : tr('Chưa có bối cảnh')),
      el('span', { class: n ? 'ok' : '' }, n ? tr`${n} agent đang chờ ở phòng chờ` : tr('Chưa có agent: mời ở bước 2')));
    $('checks2').replaceChildren(...[wait ? el('span', { class: 'bad' }, tr`${wait} agent chờ bạn duyệt`) : null, miss
      ? el('span', { class: 'bad' }, tr`Cần ${miss.need} agent theo vai trò (đang có ${miss.have})`)
      : el('span', { class: n ? 'ok' : '' }, n ? tr`${n} agent đang chờ` : tr('Chưa có agent (vẫn bắt đầu được, ai vào sau đọc lại từ đầu)'))].filter(Boolean));
    const b = $('btnStart');
    if (!b.dataset.busy) b.disabled = !!miss;
    b.title = miss ? tr`Bản brief có ${miss.need} vai trò: mời thêm agent hoặc bớt vai trò ở bước 1` : '';
  }
  function person(a, opts = {}) {
    const color = colorOf(a.name), gone = a.status === 'left' || a.status === 'kicked';
    return el('li', { class: 'person' + (gone ? ' gone' : '') },
      el('span', { class: 'av s-' + a.status, style: `background:${color}` }, initials(a.name), el('i')),
      el('div', { class: 'who' },
        el('div', { class: 'nm' }, a.name, a.model ? el('span', { class: 'model' }, a.model) : null, a.status === 'turn' ? el('span', { class: 'tag' }, tr('đang lượt')) : null),
        a.role ? el('div', { class: 'role', title: a.role }, '🎭 ' + a.role)
          : opts.planned ? el('div', { class: 'role planned', title: tr('Theo thứ tự vào phòng trong bản brief, giao khi bắt đầu') }, '🎭 ' + opts.planned + tr(' · theo bản brief')) : null,
        el('div', { class: 'st' }, `slot ${a.slot} · ${STATUS[a.status] || a.status}` + (opts.said && a.said ? tr` · ${a.said} tin` : ''))),
      opts.kick && !gone ? el('button', { class: 'icon edit', type: 'button', title: tr('Giao vai trò'), 'aria-label': tr('Giao vai trò cho ') + a.name, onclick: () => editRole(a) }, '✎') : null,
      opts.kick && !gone ? el('button', { class: 'icon kick', type: 'button', title: tr('Mời ra khỏi phòng'), 'aria-label': tr('Mời ') + a.name + tr(' ra khỏi phòng'), onclick: () => kick(a.name) }, '⨯') : null);
  }
  // agent đang xin vào: chủ trì đối chiếu mã 4 số (agent cũng thấy mã này) rồi cho vào hoặc từ chối
  const VIA = { local: tr('máy này'), tunnel: tr('qua tunnel'), public: tr('qua địa chỉ công khai'), lan: tr('mạng LAN') };
  function pendingItem(p) {
    const act = async (allow) => {
      try { await post('admit', { name: p.name, allow }); toast(allow ? tr`Đã cho ${p.name} vào phòng` : tr`Đã từ chối ${p.name}`); }
      catch (e) { toast(e.message, true); }
    };
    return el('li', { class: 'person pending' },
      el('span', { class: 'av', style: `background:${colorOf(p.name)}` }, initials(p.name)),
      el('div', { class: 'who' },
        el('div', { class: 'nm' }, p.name, p.model ? el('span', { class: 'model' }, p.model) : null, p.rejoin ? el('span', { class: 'tag' }, tr('xin vào lại')) : null),
        el('div', { class: 'st' }, tr('xin vào · mã đối chiếu '), el('b', { class: 'code4' }, p.code), ` · ${VIA[p.via] || p.via || ''}${p.ip && p.via !== 'local' ? ' ' + p.ip : ''}`)),
      el('div', { class: 'acts' },
        el('button', { class: 'btn sm primary', type: 'button', 'aria-label': tr('Cho vào: ') + p.name, onclick: () => act(true) }, tr('Cho vào')),
        el('button', { class: 'btn sm ghost', type: 'button', 'aria-label': tr('Từ chối: ') + p.name, onclick: () => act(false) }, tr('Từ chối'))));
  }
  // báo chủ trì khi có agent mới xin vào / tin bị chặn vì có dạng bí mật
  const seenPending = new Set(); let seenBlocked = -1;
  function notifyNew(s) {
    for (const p of s.pending || []) if (!seenPending.has(p.name + p.t)) { seenPending.add(p.name + p.t); toast(tr`${p.name} xin vào phòng (mã ${p.code})`); }
    const b = s.blocked || [];
    if (seenBlocked >= 0) for (const x of b.slice(seenBlocked)) toast(tr`Đã chặn ${x.what} của ${x.name}: có dạng ${x.kind}`, true);
    seenBlocked = b.length;
  }
  const blockedNote = (s) => (s.blocked || []).length ? el('li', { class: 'person empty blocked' },
    tr`⚠ Đã chặn ${s.blocked.length} tin/tệp có dạng bí mật (gần nhất: ${s.blocked.at(-1).name}, ${s.blocked.at(-1).kind}). Nội dung không vào phòng.`) : null;

  // "Họp tiếp": việc chưa xong và quyết định mang từ cuộc họp trước (hệ thống tự gửi kèm khi bắt đầu)
  function renderCarry(s) {
    const c = s.carry; $('carryCard').hidden = !c;
    if (!c || !changed('carry', [c, s.actions, s.files, s.state === 'ENDED'])) return;
    const open = s.actions.filter(x => x.status !== 'done');
    $('carry').replaceChildren(...[
      el('p', { class: 'hint' }, tr`Từ: ${c.topic || tr('cuộc họp trước')}${c.from ? ' · ' + new Date(c.from).toLocaleString(LOCALE) : ''}. Danh sách này được gửi kèm bối cảnh khi bắt đầu; số việc giữ nguyên.`),
      c.decisions.length ? el('div', {}, el('h4', {}, tr`Quyết định (${c.decisions.length})`), el('ul', {}, ...c.decisions.map(d => el('li', {}, d.item ? el('b', {}, tr`Mục ${d.item}: `) : null, el('span', { html: inline(d.text) }))))) : null,
      el('div', {}, el('h4', {}, tr`Việc chưa xong (${open.length})`), open.length ? el('ul', { class: 'tasks' }, ...open.map(taskItem)) : el('p', { class: 'muted' }, tr('Mọi việc mang sang đã báo xong.'))),
      s.files.length ? el('div', {}, el('h4', {}, tr`Tệp (${s.files.length})`), el('ul', {}, ...s.files.map(f => el('li', {}, f.name, el('span', { class: 'who' }, ` · ${f.from} → ${f.to || tr('cả phòng')} · ${fmtSize(f.size)}`))))) : null,
      c.done.length ? el('div', {}, el('h4', {}, tr`Đã xong (${c.done.length})`), el('ul', {}, ...c.done.map(t => el('li', {}, `#${t.n} `, el('span', { html: inline(t.task) }), t.note ? el('span', { class: 'who' }, ' · ' + t.note) : null)))) : null].filter(Boolean)); // replaceChildren(null) in ra chữ "null"
  }
  // bước 2: tóm tắt chỉ đọc đúng bản brief sẽ gửi khi bắt đầu
  function renderSummary(s) {
    const b = draft, st = b.settings;
    if (!changed('summary', [b, !!s.carry])) return;
    const fact = (k, v) => [el('dt', {}, k), el('dd', {}, v)];
    $('briefSummary').replaceChildren(...[
      b.context ? el('div', { class: 'ctx sum-ctx' }, b.context) : el('p', { class: 'err' }, tr('Chưa có bối cảnh: bấm "Sửa bối cảnh" để viết.')),
      b.endCondition ? el('p', { class: 'hint' }, tr('Điều kiện kết thúc: ') + b.endCondition) : null,
      st.agenda.length ? el('ol', { class: 'sum-list' }, ...st.agenda.map(x => el('li', {}, x))) : null,
      el('dl', { class: 'info sum' }, ...[
        fact(tr('Chương trình'), st.agenda.length ? tr`${st.agenda.length} mục` : tr('một chủ đề')),
        fact(tr('Giữ phòng báo tiến độ'), st.followUp ? tr('có') : tr('không')),
        fact(tr('Chế độ'), st.mode === 'turns' ? tr('lần lượt') : tr('tự do')),
        fact(tr('Giới hạn'), tr`${st.maxMsgs} tin` + `${st.timeLimitMin ? tr` · ${st.timeLimitMin} phút` : ''}`),
        b.roles.some(Boolean) ? fact(tr('Vai trò theo thứ tự'), b.roles.map((r, i) => `${i + 1}. ${r || '—'}`).join(' · ')) : null,
        s.carry ? fact(tr('Từ cuộc họp trước'), tr('gửi kèm việc + quyết định')) : null].flat().filter(Boolean))].filter(Boolean));
  }
  function renderSetup(s) {
    initForm(s); renderCarry(s);
    $('paneBrief').hidden = step !== 1; $('paneInvite').hidden = step !== 2;
    const present = presentAgents(), planned = new Map(present.sort((x, y) => x.slot - y.slot).map((a, i) => [a.name, draft.roles[i] || '']));
    $('lobby').replaceChildren(...[...(s.pending || []).map(pendingItem), ...s.agents.map(a => person(a, { kick: true, planned: planned.get(a.name) })),
      el('li', { class: 'person empty' }, tr`Slot ${s.agents.length + 1} · đang chờ agent vào…`), blockedNote(s)].filter(Boolean));
    $('lobbyCount').textContent = present.length ? `${present.length} agent` : '';
    renderSummary(s); renderChecks();
  }
  $('btnStart').onclick = async () => {
    if (missing() || !(await briefReady(tr('Vẫn bắt đầu')))) return;
    const b = $('btnStart'); b.disabled = true; b.dataset.busy = '1';
    try { await post('start', draft); } catch (e) { toast(tr('Không bắt đầu được: ') + e.message, true); }
    delete b.dataset.busy; renderChecks();
  };

  // ---------- màn cuộc họp ----------
  const QUICK = [
    [tr('Yêu cầu chốt'), tr('Đã đủ thảo luận. Hãy thống nhất và gửi một tin bắt đầu bằng "KẾT LUẬN:" tóm tắt quyết định cuối cùng, kèm việc cần làm (mỗi việc một dòng "VIỆC: <người phụ trách> | <việc> | <hạn>"), rồi rời phòng.')],
    [tr('Giao việc'), tr('Hãy liệt kê các việc cần làm từ những gì đã thống nhất, mỗi việc một dòng "VIỆC: <người phụ trách> | <việc> | <hạn>".')],
    [tr('Tóm tắt'), tr('Hãy tóm tắt ngắn các quan điểm đã nêu và những điểm còn bất đồng.')],
    [tr('Quay lại chủ đề'), tr('Hãy quay lại đúng chủ đề ban đầu và bỏ qua các ý lan man.')],
    [tr('Ngắn gọn hơn'), tr('Từ giờ mỗi tin hãy ngắn gọn, tối đa 3-4 câu.')],
  ];
  QUICK.forEach(([label, text]) => $('quick').append(el('button', { class: 'btn ghost', type: 'button', title: text, onclick: () => { $('btnQuick').focus(); hostSay(text, label); } }, label)));
  async function hostSay(text, label) {
    const to = $('sendTo').value;
    try { await post('say', { text, to }); toast(label ? tr`Đã gửi: ${label}${to ? tr(' (riêng ') + to + ')' : ''}` : to ? tr`Đã gửi riêng cho ${to}` : tr('Đã gửi tới các agent')); return true; }
    catch (e) { toast(tr('Không gửi được: ') + e.message, true); return false; }
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
    const role = await promptBox(tr`Vai trò của ${a.name}`, snap.state === 'LIVE'
      ? tr('Agent sẽ nhận vai trò mới qua một tin nhắn riêng.') : tr('Vai trò được gửi cho cả nhóm khi bắt đầu cuộc họp. Ví dụ: phản biện, thư ký, chuyên gia bảo mật.'), a.role || '');
    if (role === null) return;
    try { await post('role', { name: a.name, role }); toast(role ? tr`Đã giao vai trò cho ${a.name}` : tr`Đã bỏ vai trò của ${a.name}`); } catch (e) { toast(e.message, true); }
  }
  async function kick(name) {
    if (!(await confirmBox(tr`Mời ${name} ra khỏi phòng?`, tr`${name} sẽ được báo dừng và không vào lại được bằng tên này.`, tr('Mời ra')))) return;
    try { await post('kick', { name }); toast(tr`Đã mời ${name} ra khỏi phòng`); } catch (e) { toast(e.message, true); }
  }
  $('btnStop').onclick = async () => {
    const [title, text, yes] = snap.state === 'WORK'
      ? [tr('Đóng phòng theo dõi?'), tr('Agent sẽ không báo tiến độ vào phòng này được nữa. Bạn vẫn tải được biên bản và tự đổi trạng thái việc.'), tr('Đóng phòng')]
      : snap.settings.followUp && snap.actions.some(x => x.status !== 'done')
        ? [tr('Chốt cuộc họp?'), tr('Các agent dừng thảo luận và đi làm việc được giao; phòng được giữ lại để chờ agent báo tiến độ.'), tr('Chốt')]
        : [tr('Kết thúc cuộc họp?'), tr('Các agent sẽ được báo dừng ngay. Bạn vẫn tải được biên bản sau đó.'), tr('Kết thúc')];
    if (!(await confirmBox(title, text, yes))) return;
    try { await post('stop'); } catch (e) { toast(e.message, true); }
  };

  function renderInfo(s) {
    const start = s.startedAt || serverNow();
    const end = s.workSince || s.endedAt || serverNow();
    const left = s.endsAt && s.state === 'LIVE' ? s.endsAt - serverNow() : null;
    const ratio = Math.min(1, s.chatCount / s.settings.maxMsgs);
    $('info').replaceChildren(...[
      el('dt', {}, tr('Thời lượng')), el('dd', { id: 'infoElapsed' }, fmtDur(end - start)),
      left != null ? el('dt', {}, tr('Còn lại')) : null, left != null ? el('dd', { id: 'infoLeft' }, fmtDur(left)) : null,
      el('dt', {}, tr('Chế độ')), el('dd', {}, s.settings.mode === 'turns' ? tr('Lần lượt') : tr('Tự do')),
      el('dt', {}, tr('Tin nhắn')), el('dd', {}, `${s.chatCount} / ${s.settings.maxMsgs}`),
      el('div', { class: 'bar' + (ratio > .8 ? ' warn' : '') }, el('i', { style: `width:${ratio * 100}%` }))].filter(Boolean));
  }
  setInterval(() => {
    if (!snap || snap.state !== 'LIVE') return;
    const e = $('infoElapsed'); if (e) e.textContent = fmtDur(serverNow() - snap.startedAt);
    const l = $('infoLeft'); if (l && snap.endsAt) l.textContent = fmtDur(snap.endsAt - serverNow());
  }, 1000);

  const modelOf = (name) => snap?.agents.find(a => a.name === name)?.model || '';
  const fileUrl = (f) => `/api/host/${key}/file/${f.id}`;
  function entry(m, prev) {
    const f = m.file && snap?.files.find(x => x.id === m.file), text = LANG === 'en' && m.en ? m.en : m.text; // m.en: bản hiển thị tiếng Anh của tin do server sinh
    if (m.file) return el('div', { class: 'sys filemsg' }, el('time', {}, fmtTime(m.t)), el('span', {}, '📎 ' + text),
      f && !f.gone ? el('a', { href: fileUrl(f), download: f.name }, tr('Tải')) : null);
    if (m.type === 'sys') return el('div', { class: 'sys' + (m.progress ? ' prog s-' + m.progress.status : '') }, el('time', {}, fmtTime(m.t)), m.progress ? el('span', { html: linkify(esc(text)) }) : text);
    const host = m.type === 'host', name = host ? (m.to ? tr`Chủ trì → ${m.to} (riêng)` : tr('Chủ trì')) : m.name, color = host ? 'var(--accent)' : colorOf(m.name);
    const first = !prev || prev.type === 'sys' || prev.type !== m.type || prev.name !== m.name || m.t - prev.t > 5 * 60000;
    return el('div', { class: 'msg' + (first ? ' first' : '') + (host ? ' host' : '') + (m.conclusion || m.itemsDone ? ' conclusion' : '') + (m.itemsDone && !m.conclusion ? ' itemdone' : '') + (m.to ? ' private' : '') },
      el('span', { class: 'av', style: `background:${color}` }, host ? '★' : initials(m.name)),
      el('div', { class: 'hd' }, el('b', { style: `color:${color}`, 'data-tag': m.conclusion ? tr('Kết luận') : m.itemsDone ? tr('Xong mục') : null }, name), !host && modelOf(m.name) ? el('span', { class: 'model' }, modelOf(m.name)) : null, el('time', { datetime: new Date(m.t).toISOString() }, fmtTime(m.t))),
      el('div', { class: 'bubble', html: md(text) }));
  }
  const nearBottom = () => { const f = $('feed'); return f.scrollHeight - f.scrollTop - f.clientHeight < 90; };
  function renderFeed(fresh) {
    const f = $('feed'), inner = $('feedIn'), stick = fresh || nearBottom();
    let added = 0, real = 0;
    for (; rendered < log.length; rendered++, added++) {
      const message = entry(log[rendered], log[rendered - 1]);
      message.id = 'message-' + log[rendered].i; inner.append(message);
      if (log[rendered].type !== 'sys') real++;
    }
    if (!added) return;
    if (document.hidden && real) { unread += real; document.title = `(${unread}) Foxul`; }
    if (stick) { f.style.scrollBehavior = 'auto'; f.scrollTop = f.scrollHeight; f.style.scrollBehavior = ''; }
    else $('newPill').hidden = false;
  }
  $('feed').addEventListener('scroll', () => { if (nearBottom()) $('newPill').hidden = true; });
  $('newPill').onclick = () => { $('feed').scrollTop = $('feed').scrollHeight; $('newPill').hidden = true; };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { unread = 0; document.title = 'Foxul'; } });

  function renderTyping(s) {
    let txt = '';
    if (s.state === 'LIVE') {
      const th = s.agents.filter(a => a.status === 'thinking').map(a => a.name);
      if (s.settings.mode === 'turns' && s.turn) txt = tr`Đang chờ ${s.turn} phát biểu…`;
      else if (th.length) txt = tr`✎ ${th.join(', ')} đang soạn tin…`;
    }
    $('typing').textContent = txt;
  }

  function renderEnded(s) {
    if (endedBuilt === s.state) return; endedBuilt = s.state;
    delete sigs.endActs;
    const work = s.state === 'WORK';
    $('ended').replaceChildren(el('div', { class: 'endcard-in' },
      el('div', { class: 'end-overview' },
        el('h3', {}, work ? tr('Đã chốt: đang chờ agent làm và báo tiến độ') : s.workSince ? tr('Đã đóng phòng theo dõi tiến độ') : tr('Cuộc họp đã kết thúc')),
        el('a', { class: 'btn ghost sm', href: '#plan' }, tr('Kế hoạch →'))),
      el('div', { id: 'endActs', class: 'stats' }),
      el('details', { class: 'end-details' }, el('summary', {}, tr('Biên bản và cuộc họp tiếp')),
        work ? el('p', { class: 'hint' }, tr('Các agent đã rời họp để làm việc được giao và sẽ báo tiến độ vào đây (tool progress). Phòng tự đóng khi mọi việc báo xong; bạn cũng có thể tự đổi trạng thái hoặc bấm "Đóng phòng".')) : null,
        el('div', { class: 'stats' },
          el('span', {}, work ? tr('Chốt vì: ') : tr('Lý do: '), el('b', {}, tr((work ? s.workReason : s.endReason) || '—'))),
          el('span', {}, tr('Thảo luận: '), el('b', {}, fmtDur(s.startedAt ? (s.workSince || s.endedAt || serverNow()) - s.startedAt : 0))),
          el('span', {}, tr('Tin nhắn: '), el('b', {}, String(s.chatCount))),
          el('span', {}, tr('Thành viên: '), el('b', {}, String(s.agents.length)))),
        el('div', { class: 'row' },
          el('button', { class: 'btn primary', type: 'button', onclick: downloadMinutes }, tr('Tải biên bản .md')),
          el('button', { class: 'btn ghost', type: 'button', onclick: async () => copy(await (await fetch(`/api/host/${key}/minutes.md`)).text(), tr('Đã sao chép biên bản')) }, tr('Sao chép biên bản')),
          el('a', { class: 'btn ghost', href: `/api/host/${key}/minutes.json`, download: 'bien-ban-hop.json' }, tr('Tải JSON')),
          carryable(s) ? el('button', { class: 'btn ghost', type: 'button', id: 'btnCarry', title: tr('Cuộc họp mới nhận sẵn các việc chưa xong (giữ số) và quyết định của cuộc này, để họp review tiến độ'), onclick: () => newMeeting(true) }, carryLabel(s)) : null,
          el('button', { class: 'btn ghost', type: 'button', title: tr('Cuộc họp mới hoàn toàn trống'), onclick: () => newMeeting(false) }, tr('Cuộc họp mới'))))));
  }
  function renderEndActs(s) {
    const box = $('endActs'); if (!box || !changed('endActs', [s.actions, s.state])) return;
    if ($('btnCarry')) $('btnCarry').textContent = carryLabel(s);
    const done = s.actions.filter(x => x.status === 'done').length;
    box.replaceChildren(el('span', {}, tr`Tiến độ tự báo (${done}/${s.actions.length} xong)`));
  }
  const carryLabel = (s) => { const open = s.actions.filter(x => x.status !== 'done').length; return open ? tr`Họp tiếp (mang ${open} việc dở)` : tr('Họp tiếp (mang quyết định)'); };
  const carryable = (s) => s.actions.some(x => x.status !== 'done') || decisions().length > 0;
  async function newMeeting(carry) {
    if (snap.state === 'WORK' && !(await confirmBox(tr('Đóng phòng theo dõi?'), tr`Phòng hiện tại sẽ đóng. ${carry ? tr('Các việc chưa xong được mang sang cuộc họp mới: agent vẫn báo tiến độ được ở đó.') : tr('Việc chưa xong sẽ không được theo dõi tiếp.')}`, carry ? tr('Họp tiếp') : tr('Cuộc họp mới')))) return;
    try { const { hostKey } = await post('new', { carry }); location.href = '/m/' + hostKey; }
    catch (e) { toast(tr('Không tạo được cuộc họp mới: ') + e.message, true); }
  }

  function renderAgenda(s) {
    $('agendaSec').hidden = !s.agenda.length;
    if (!s.agenda.length) return;
    const summaries = new Map(log.flatMap(m => m.itemsDone || []).map(d => [d.item, d.summary]));
    $('agendaCount').textContent = `${Math.min(s.agendaIndex, s.agenda.length)}/${s.agenda.length}`;
    $('agendaList').replaceChildren(...s.agenda.map((t, i) => el('li', { class: i < s.agendaIndex ? 'done' : i === s.agendaIndex && s.state === 'LIVE' ? 'now' : '' },
      el('div', {}, t, summaries.get(i) ? el('small', { html: inline(summaries.get(i)) }) : null))));
    $('btnNext').hidden = s.state !== 'LIVE' || s.agendaIndex >= s.agenda.length;
    $('btnNext').textContent = s.agendaIndex === s.agenda.length - 1 ? tr('Kết thúc chương trình →') : tr('Mục tiếp theo →');
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
  const TASK_STATUS = { todo: tr('chưa làm'), doing: tr('đang làm'), done: tr('xong'), blocked: tr('vướng') };
  const sigs = {};
  // chỉ vẽ lại khi dữ liệu đổi: tránh đóng ô chọn trạng thái đang mở mỗi lần long-poll trả về
  const changed = (k, v) => { const j = JSON.stringify(v); if (sigs[k] === j) return false; sigs[k] = j; return true; };
  async function setTask(x, status, note) {
    try { await post('task', { n: x.n, status, note }); toast(tr`Việc #${x.n}: ${TASK_STATUS[status]}`); }
    catch (e) { toast(tr('Không cập nhật được: ') + e.message, true); }
  }
  function statusSelect(x) {
    const sel = el('select', { class: 'tstat s-' + x.status, title: x.updatedBy ? tr`Cập nhật bởi ${x.updatedBy}${x.updatedAt ? tr(' lúc ') + fmtTime(x.updatedAt) : ''}` : tr('Đổi trạng thái'), 'aria-label': tr`Tiến độ tự báo việc #${x.n}` },
      ...Object.entries(TASK_STATUS).map(([k, v]) => el('option', { value: k, selected: k === x.status }, v)));
    sel.onchange = () => setTask(x, sel.value);
    return sel;
  }
  const noteBtn = (x) => el('button', { class: 'icon edit', type: 'button', title: tr('Sửa bằng chứng / ghi chú'), 'aria-label': tr`Sửa ghi chú việc #${x.n}`, onclick: async () => {
    const note = await promptBox(tr`Bằng chứng / ghi chú cho việc #${x.n}`, tr('Ví dụ: link commit hoặc PR, kết quả test, đang vướng gì. Để trống để xoá.'), x.note || '');
    if (note !== null) setTask(x, x.status, note);
  } }, '✎');
  // việc trùng (hai agent chốt cùng một việc bằng câu chữ khác nhau): gộp vào việc giữ lại, hoặc xoá hẳn
  const dropBtn = (x) => el('button', { class: 'icon drop', type: 'button', title: tr('Gộp hoặc xoá việc'), 'aria-label': tr`Gộp hoặc xoá việc #${x.n}`, onclick: async () => {
    const others = snap.actions.filter(y => y.n !== x.n).map(y => '#' + y.n);
    const v = await promptBox(tr`Gộp hoặc xoá việc #${x.n}`, (others.length ? tr`Nhập số việc giữ lại (${others.join(', ')}) để gộp việc này vào đó, bằng chứng được nối sang. ` : '')
      + tr('Để trống để xoá hẳn. Agent nhắc lại việc này sẽ không tạo lại việc mới.'), '', tr('Gộp / xoá'));
    if (v === null) return;
    const into = v.trim().replace(/^#/, '');
    try {
      const r = await post('task', { n: x.n, remove: true, into: into || undefined });
      toast(r.ok ? (into ? tr`Đã gộp việc #${x.n} vào #${into}` : tr`Đã xoá việc #${x.n}`) : tr`Không có việc #${into} để gộp vào`, !r.ok);
    } catch (e) { toast(tr('Không cập nhật được: ') + e.message, true); }
  } }, '×');
  const verifyNote = () => el('p', { class: 'note verify' }, 'ⓘ', tr('Tiến độ ở đây do agent hoặc chủ trì khai báo. Kết quả chạy đã kiểm chứng và tích hợp được hiển thị riêng.'));
  const taskItem = (x) => {
    const shared = sharedTasks.find(t => t.origin?.number === x.n && t.origin?.timestamp === x.t && t.sourceCurrent !== false);
    const execution = shared && ({ planned: tr('Đã lên kế hoạch'), ready: tr('Chờ kiểm tra điều kiện'), running: tr('Đang chạy'), verifying: tr('Chờ kiểm chứng'), integrating: tr('Chờ tích hợp'), done: tr('Đã tích hợp'), stale: tr('Yêu cầu đã thay đổi'), failed: tr('Thất bại'), cancelled: tr('Đã hủy'), interrupted: tr('Bị gián đoạn') }[shared.status] || shared.status);
    return el('li', { class: 'task s-' + x.status },
      el('div', {}, el('a', { class: 'tn', href: '#plan', title: shared?.id || tr('Kế hoạch') }, '#' + x.n), ' ', el('span', { html: inline(x.task) })),
      el('div', { class: 'tnote' }, x.owner),
      el('details', { class: 'task-progress' }, el('summary', {}, TASK_STATUS[x.status]),
        el('div', { class: 'tmeta' }, statusSelect(x), noteBtn(x), snap.state !== 'ENDED' ? dropBtn(x) : null),
        x.due ? el('div', { class: 'tnote' }, tr('hạn ') + x.due) : null),
      shared ? el('div', { class: 'tnote' }, el('a', { href: '#execute', title: shared.id }, tr('Thực hiện') + ': ' + execution)) : null,
      x.note ? el('div', { class: 'tnote', html: linkify(inline(x.note)) }) : null);
  };
  window.addEventListener('am-work-state', event => { sharedTasks = event.detail.tasks || []; if (snap) renderResults(snap); });


  function renderResults(s) {
    const ds = decisions();
    if (!changed('results', [ds, s.actions, sharedTasks, s.agenda.length, s.state === 'ENDED'])) return;
    if (!ds.length && !s.actions.length) { $('results').replaceChildren(el('div', { class: 'empty' }, tr('Chưa có quyết định hay việc cần làm. Tin "KẾT LUẬN:" và dòng "VIỆC:" sẽ hiện ở đây.'))); return; }
    $('results').replaceChildren(...[
      ds.length ? el('div', {}, el('h4', {}, tr`Quyết định (${ds.length})`), el('ul', {}, ...ds.map(d => el('li', {},
        d.item != null && s.agenda.length ? el('b', {}, tr`Mục ${d.item + 1}: `) : null,
        el('span', { html: inline(d.text.split('\n').find(l => l.trim()).slice(0, 160)) }), ' ', el('span', { class: 'who' }, '· ' + d.name))))) : null,
      s.actions.length ? el('div', {}, el('h4', {}, tr`Tiến độ tự báo (${s.actions.filter(x => x.status === 'done').length}/${s.actions.length} xong)`),
        el('ul', { class: 'tasks' }, ...s.actions.map(taskItem)), verifyNote()) : null].filter(Boolean));
  }
  // tệp agent gửi nhau: chủ trì xem ai gửi ai, cỡ, sha256, ai đã tải, và tải về (luôn là tệp đính kèm, không mở trong trang)
  function renderFiles(s) {
    $('filesSec').hidden = !s.files.length;
    if (!s.files.length || !changed('files', s.files)) return;
    $('filesCount').textContent = String(s.files.length);
    $('files').replaceChildren(...s.files.map(f => el('li', { class: 'file' + (f.gone ? ' fgone' : '') },
      el('div', { class: 'fhd' }, el('b', { class: 'fname' }, f.name), el('span', { class: 'who' }, fmtSize(f.size)),
        f.gone ? el('span', { class: 'muted' }, tr('đã xoá')) : el('a', { class: 'btn sm ghost', href: fileUrl(f), download: f.name, title: tr('Tải về ') + f.name }, tr('Tải'))),
      el('div', { class: 'who' }, `${f.from} → ${f.to ? f.to + tr(' (riêng)') : tr('cả phòng')} · ${fmtTime(f.t)}${f.carried ? tr(' · từ cuộc trước') : ''} · ${f.got.length ? tr('đã tải: ') + f.got.join(', ') : tr('chưa ai tải')}`),
      f.note ? el('div', { class: 'tnote' }, f.note) : null,
      el('code', { class: 'sha', title: 'sha256: ' + f.sha256 }, 'sha256 ' + f.sha256.slice(0, 16) + '…'))));
  }
  function renderSendTo(s) {
    const sel = $('sendTo'), cur = sel.value;
    const names = s.agents.filter(a => !['left', 'kicked', 'ended'].includes(a.status)).map(a => a.name);
    const want = ['', ...names].join('\u0001');
    if (sel.dataset.names !== want) {
      sel.dataset.names = want;
      sel.replaceChildren(el('option', { value: '' }, tr('Tất cả')), ...names.map(n => el('option', { value: n }, tr('Riêng: ') + n)));
    }
    sel.value = names.includes(cur) ? cur : '';
  }

  // Desktop details collapse in place; narrow screens use an isolated sheet.
  const setPanel = (open, focus = true) => {
    const mobile = matchMedia('(max-width:1000px)').matches;
    $('side').classList.toggle('open', mobile && open);
    $('room').classList.toggle('details-hidden', !open);
    $('btnPanel').setAttribute('aria-expanded', String(open));
    if (mobile && open) { overlayReturn = $('btnPanel'); $('side').setAttribute('role','dialog'); $('side').setAttribute('aria-modal','true'); isolate($('side')); $('sideClose').focus(); }
    else { $('side').removeAttribute('role'); $('side').removeAttribute('aria-modal'); overlayReturn = $('btnPanel'); if (focus) returnFocus(); else restoreBackground(); }
  };
  function renderPanelBtn() { $('btnPanel').textContent = tr('Chi tiết'); }
  $('btnPanel').onclick = () => setPanel($('btnPanel').getAttribute('aria-expanded') !== 'true');
  $('sideClose').onclick = () => setPanel(false);
  matchMedia('(max-width:1000px)').addEventListener('change', e => { const wasOpen = $('side').classList.contains('open'); setPanel(!e.matches, wasOpen); closeMenus(); });
  $('btnPanel').setAttribute('aria-expanded', String(!matchMedia('(max-width:1000px)').matches));

  function renderRoom(s, fresh) {
    renderAgenda(s); renderResults(s); renderFiles(s); renderSendTo(s); renderPanelBtn();
    $('members').replaceChildren(...[...(s.state === 'LIVE' || s.state === 'WORK' ? (s.pending || []).map(pendingItem) : []),
      ...s.agents.map(a => person(a, { kick: s.state === 'LIVE', said: true })), blockedNote(s)].filter(Boolean));
    const present = s.agents.filter(a => !['left', 'kicked', 'ended'].includes(a.status)).length;
    $('memberCount').textContent = s.state === 'LIVE' ? `${present}/${s.agents.length}` : String(s.agents.length);
    renderInfo(s);
    $('ctxView').textContent = s.context + (s.endCondition ? tr`\n\nĐiều kiện kết thúc: ${s.endCondition}` : '');
    if (!log.length && !$('feedIn').children.length) $('feedIn').append(el('div', { class: 'empty-feed' }, tr('Chưa có tin nào.')));
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
    toast(tr('Đang tải biên bản'));
  }
  $('btnMinutes').onclick = downloadMinutes;

  // ---------- ngăn kéo mời agent (khi đang họp) ----------
  const openDrawer = () => { overlayReturn = $('btnOptions'); $('drawerBody').append($('invite')); $('drawer').hidden = $('scrim').hidden = false; $('drawer').setAttribute('role','dialog'); $('drawer').setAttribute('aria-modal','true'); isolate($('drawer')); $('drawerClose').focus(); };
  const closeDrawer = () => { $('drawer').hidden = $('scrim').hidden = true; $('inviteHome').append($('invite')); returnFocus(); };
  $('btnInvite').onclick = openDrawer; $('drawerClose').onclick = closeDrawer; $('scrim').onclick = closeDrawer;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('modal').hidden) closeModal(false); else if (!$('drawer').hidden) closeDrawer(); else if ($('side').classList.contains('open')) setPanel(false); } });

  // ---------- khung chung ----------
  function renderSteps() {
    if (!snap) return;
    const lobby = snap.state === 'LOBBY', cur = lobby ? step : snap.state === 'LIVE' ? 3 : 4;
    for (const li of $('steps').children) {
      const n = +li.dataset.step, btn = li.querySelector('button');
      li.classList.toggle('on', n === cur); li.classList.toggle('done', n < cur);
      if (btn) { btn.disabled = !lobby; btn.setAttribute('aria-current', n === cur ? 'step' : 'false'); }
      else li.firstElementChild.setAttribute('aria-current', n === cur ? 'step' : 'false');
    }
  }
  function setConn(kind) {
    const c = $('conn'); c.className = 'conn ' + kind;
    c.querySelector('span').textContent = kind === 'ok' ? tr('Đã kết nối') : kind === 'bad' ? tr('Mất kết nối, đang thử lại…') : tr('Đang kết nối');
  }
  function render() {
    const s = snap;
    buildInvite({ ...s, local: s.local === undefined ? location.origin : s.local });
    notifyNew(s);
    const st = $('status');
    st.className = 'badge ' + ({ LIVE: 'live', WORK: 'work', ENDED: 'ended' }[s.state] || '');
    st.textContent = { LOBBY: tr('Chuẩn bị'), LIVE: tr('Đang họp'), WORK: tr('Đang thực hiện'), ENDED: tr('Đã kết thúc') }[s.state];
    const view = s.state === 'LOBBY' ? 'setup' : 'room', fresh = view !== lastView;
    if (fresh && view === 'setup') step = location.hash === '#moi-agent' ? 2 : 1;
    const workView = ['#plan', '#execute', '#results'].includes(location.hash);
    document.body.dataset.sessionView = workView ? location.hash.slice(1) : 'conversation';
    $('setup').hidden = workView || view !== 'setup'; $('room').hidden = workView || view !== 'room';
    $('btnPanel').hidden = workView || view !== 'room';
    $('btnInvite').hidden = s.state !== 'LIVE';
    $('btnMinutes').hidden = s.state === 'LOBBY';
    $('btnStop').hidden = s.state !== 'LIVE' && s.state !== 'WORK';
    $('btnStop').querySelector('span').textContent = s.state === 'WORK' ? tr('Đóng phòng') : tr('Kết thúc');
    if (s.state !== 'LIVE' && !$('drawer').hidden) closeDrawer();
    if (view === 'setup') renderSetup(s); else renderRoom(s, fresh);
    renderSteps();
    lastView = view;
    window.dispatchEvent(new CustomEvent('am-meeting-state', { detail: s }));
    if (location.hash.startsWith('#message-')) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'center' });
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
        if (snap && s.createdAt !== snap.createdAt) { location.replace(location.pathname); return; } // về bước 1 của cuộc mới
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
