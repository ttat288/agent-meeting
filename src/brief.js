'use strict';
// "Bản brief": bối cảnh + tuỳ chọn của một cuộc họp dạng JSON, khớp thân POST /api/host/<k>/start
// (thêm `schema` và `roles` theo thứ tự slot), để người dùng nhờ AI viết hộ rồi dán lại.
// Dùng chung cho Node (CLI --brief-file, test) và trình duyệt (/assets/brief.js, window.AgentMeetingBrief).
// Dữ liệu dán vào là DỮ LIỆU: chỉ JSON.parse, không eval; trang chủ trì gán bằng .value/textContent.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AgentMeetingBrief = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const SCHEMA = 'agent-meeting/brief@1';
  // Phải khớp BOUNDS / MAX_AGENDA / start() / setRole() trong src/meeting.js (có test so sánh).
  const LIMITS = {
    text: 65536, context: 8000, endCondition: 1000, agenda: 20, item: 200, roles: 20, role: 200,
    maxMsgs: [2, 1000], timeLimitMin: [0, 600], idleSec: [10, 600],
  };
  const MODES = ['free', 'turns'];
  const SETTING_KEYS = ['agenda', 'followUp', 'mode', 'maxMsgs', 'timeLimitMin', 'idleSec'];
  const TOP_KEYS = ['schema', 'context', 'endCondition', 'settings', 'roles'];
  const PLACEHOLDER = /<[^>\n]{1,40}>/;
  const FIELD = {
    context: 'bối cảnh', endCondition: 'điều kiện kết thúc', 'settings.agenda': 'chương trình họp',
    'settings.followUp': 'giữ phòng báo tiến độ', 'settings.mode': 'chế độ phát biểu', 'settings.maxMsgs': 'giới hạn số tin',
    'settings.timeLimitMin': 'giới hạn thời gian (phút)', 'settings.idleSec': 'im lặng bao lâu thì hỏi chốt (giây)', roles: 'vai trò',
  };

  const defaults = () => ({
    schema: SCHEMA, context: '', endCondition: '',
    settings: { agenda: [], followUp: false, mode: 'free', maxMsgs: 120, timeLimitMin: 0, idleSec: 40 },
    roles: [],
  });
  // base: giá trị khi trường bị thiếu (trang chủ trì: tuỳ chọn mặc định của server, ví dụ --max, --follow-up)
  const withBase = (base) => {
    const d = defaults(), b = base || {}, s = b.settings || {};
    for (const k of ['context', 'endCondition']) if (typeof b[k] === 'string') d[k] = b[k];
    if (Array.isArray(b.roles)) d.roles = b.roles.slice();
    if (Array.isArray(s.agenda)) d.settings.agenda = s.agenda.slice();
    if (typeof s.followUp === 'boolean') d.settings.followUp = s.followUp;
    if (MODES.includes(s.mode)) d.settings.mode = s.mode;
    for (const k of ['maxMsgs', 'timeLimitMin', 'idleSec']) if (Number.isFinite(s[k])) d.settings[k] = s[k];
    return d;
  };

  // ---------- tìm vị trí lỗi cú pháp (thông báo tiếng Việt, giống nhau ở Node và mọi trình duyệt) ----------
  function syntaxError(src) {
    let i = 0;
    const fail = (msg) => { throw { pos: i, msg }; };
    const ws = () => { while (i < src.length && ' \t\n\r'.includes(src[i])) i++; };
    const string = () => {
      i++;
      while (i < src.length) {
        const c = src[i];
        if (c === '"') { i++; return; }
        if (c === '\\') {
          const n = src[i + 1];
          if (n === 'u') { if (!/^[0-9a-fA-F]{4}$/.test(src.slice(i + 2, i + 6))) fail('mã \\u phải có đúng 4 chữ số hex'); i += 6; continue; }
          if (!n || !'"\\/bfnrt'.includes(n)) fail(`ký tự thoát không hợp lệ "\\${n || ''}" (dùng \\n, \\", \\\\)`);
          i += 2; continue;
        }
        if (c === '\n' || c === '\r') fail('chuỗi không được xuống dòng thật: viết \\n, hoặc thiếu dấu " đóng chuỗi');
        if (c < ' ') fail('chuỗi chứa ký tự điều khiển (tab…): viết \\t');
        i++;
      }
      fail('chuỗi chưa có dấu " đóng');
    };
    const container = (close, item) => {
      i++; ws();
      if (src[i] === close) { i++; return; }
      for (;;) {
        ws(); item(); ws();
        if (src[i] === ',') { i++; ws(); if (src[i] === close) fail(`thừa dấu phẩy trước ${close}`); continue; }
        if (src[i] === close) { i++; return; }
        fail(src[i] === undefined ? `JSON bị cắt cụt: thiếu ${close}` : src[i] === '"' ? 'thiếu dấu phẩy giữa hai phần tử' : `cần dấu , hoặc ${close}`);
      }
    };
    const value = () => {
      ws();
      const c = src[i];
      if (c === '{') return container('}', () => {
        if (src[i] !== '"') fail(src[i] === "'" ? "tên khoá phải trong ngoặc kép \"…\", không dùng '…'" : 'cần tên khoá trong ngoặc kép "…"');
        string(); ws();
        if (src[i] !== ':') fail('thiếu dấu : sau tên khoá');
        i++; value();
      });
      if (c === '[') return container(']', value);
      if (c === '"') return string();
      const num = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(src.slice(i, i + 40));
      if (num && num[0] !== '-') { i += num[0].length; return; }
      for (const w of ['true', 'false', 'null']) if (src.startsWith(w, i)) { i += w.length; return; }
      if (c === undefined) fail('JSON bị cắt cụt (thiếu phần cuối)');
      if ('“”„'.includes(c)) fail('dùng ngoặc kép thẳng " thay cho ngoặc cong “ ”');
      if (c === "'") fail("chuỗi phải trong ngoặc kép \"…\", không dùng '…'");
      fail(`ký tự không hợp lệ "${c}"`);
    };
    try {
      value(); ws();
      if (i < src.length) fail('có nội dung thừa sau JSON');
    } catch (e) { if (e && typeof e.pos === 'number') return e; throw e; }
    return { pos: 0, msg: 'JSON không hợp lệ' }; // JSON.parse báo lỗi mà bộ dò không thấy (không nên xảy ra)
  }

  // AI hay bọc JSON trong ```json … ``` hoặc thêm câu dẫn: lấy phần JSON và nhớ vị trí để báo đúng dòng
  function extract(text) {
    const fence = /```[ \t]*(?:json|JSON)?[ \t]*\r?\n([\s\S]*?)```/.exec(text);
    if (fence) return { src: fence[1], at: fence.index + fence[0].indexOf(fence[1]), wrapped: 'fence' };
    const t = text.trim(), a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (t[0] !== '{' && t[0] !== '[' && a >= 0 && b > a) return { src: text.slice(a, b + 1), at: a, wrapped: 'prose' };
    return { src: text, at: 0, wrapped: '' };
  }
  const lineAt = (text, pos) => { let n = 1; for (let k = 0; k < pos && k < text.length; k++) if (text[k] === '\n') n++; return n; };
  const colAt = (text, pos) => pos - text.lastIndexOf('\n', pos - 1);

  // ---------- chuẩn hoá: kiểm kiểu từng trường, kẹp số, cắt độ dài ----------
  function normalize(obj, base, report) {
    const out = withBase(base);
    const err = (key, msg) => report.errors.push({ key, msg });
    const warn = (key, msg) => report.warnings.push({ key, msg });
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) { err('', 'JSON phải là một object {…} (không phải danh sách hay chuỗi).'); return out; }
    let settings = obj.settings;
    if (settings !== undefined && settings !== null && (typeof settings !== 'object' || Array.isArray(settings))) { err('settings', '"settings" phải là object {…}.'); settings = {}; }
    settings = { ...(settings || {}) };
    for (const k of Object.keys(obj)) {
      if (TOP_KEYS.includes(k)) continue;
      if (SETTING_KEYS.includes(k)) {
        if (settings[k] === undefined) { settings[k] = obj[k]; warn(k, `"${k}" phải nằm trong "settings": đã chuyển vào đó.`); }
        else warn(k, `"${k}" ở ngoài "settings" bị bỏ qua (đã có trong "settings").`);
      } else warn(k, `Khoá lạ "${k}" bị bỏ qua.`);
    }
    for (const k of Object.keys(settings)) if (!SETTING_KEYS.includes(k)) warn('settings.' + k, `Khoá lạ "settings.${k}" bị bỏ qua.`);
    if (obj.schema !== undefined && obj.schema !== SCHEMA) warn('schema', `"schema" nên là "${SCHEMA}".`);

    const text = (key, v, max) => {
      if (v === undefined || v === null) return undefined;
      if (typeof v !== 'string') { err(key, `"${key}" (${FIELD[key]}) phải là chuỗi văn bản "…".`); return undefined; }
      v = v.replace(/\r\n?/g, '\n').trim();
      if (v.length > max) { warn(key, `"${key}" dài ${v.length} ký tự, đã cắt còn ${max}.`); v = v.slice(0, max).trim(); }
      return v;
    };
    const list = (key, v, maxN, maxLen, keepEmpty) => {
      if (v === undefined || v === null) return undefined;
      if (typeof v === 'string') v = v.split('\n');
      if (!Array.isArray(v)) { err(key, `"${key}" (${FIELD[key]}) phải là danh sách ["…", "…"].`); return undefined; }
      const bad = v.findIndex(x => typeof x !== 'string' && typeof x !== 'number');
      if (bad >= 0) { err(key, `Phần tử thứ ${bad + 1} của "${key}" phải là chuỗi "…".`); return undefined; }
      let r = v.map(x => String(x).replace(/\s+/g, ' ').trim());
      if (key === 'settings.agenda') r = r.map(x => x.replace(/^(\d+[.)]|[-*•])\s*/, '').trim());
      if (!keepEmpty) r = r.filter(Boolean);
      else while (r.length && !r[r.length - 1]) r.pop();
      if (r.length > maxN) { warn(key, `"${key}" có ${r.length} mục, chỉ giữ ${maxN} mục đầu.`); r = r.slice(0, maxN); }
      if (r.some(x => x.length > maxLen)) { warn(key, `Có mục của "${key}" dài quá ${maxLen} ký tự, đã cắt.`); r = r.map(x => x.slice(0, maxLen).trim()); }
      return r;
    };
    const number = (key, v, [lo, hi]) => {
      if (v === undefined || v === null || v === '') return undefined;
      const n = typeof v === 'number' ? v : typeof v === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(v) ? Number(v) : NaN;
      if (!Number.isFinite(n)) { err(key, `"${key}" (${FIELD[key]}) phải là số, trong khoảng ${lo}-${hi}.`); return undefined; }
      const c = Math.min(hi, Math.max(lo, Math.round(n)));
      if (c !== n) warn(key, Math.round(n) === c ? `"${key}" làm tròn thành ${c}.` : `"${key}" = ${n} ngoài khoảng ${lo}-${hi}, đã dùng ${c}.`);
      return c;
    };

    const ctx = text('context', obj.context, LIMITS.context);
    if (ctx !== undefined) out.context = ctx;
    const endc = text('endCondition', obj.endCondition, LIMITS.endCondition);
    if (endc !== undefined) out.endCondition = endc;
    const s = out.settings;
    const ag = list('settings.agenda', settings.agenda, LIMITS.agenda, LIMITS.item);
    if (ag) s.agenda = ag;
    const fu = settings.followUp;
    if (typeof fu === 'boolean') s.followUp = fu;
    else if (fu === 'true' || fu === 'false') { s.followUp = fu === 'true'; warn('settings.followUp', '"settings.followUp" nên là true/false (không có ngoặc kép).'); }
    else if (fu !== undefined && fu !== null) err('settings.followUp', '"settings.followUp" (giữ phòng báo tiến độ) phải là true hoặc false.');
    if (settings.mode !== undefined && settings.mode !== null) {
      if (MODES.includes(settings.mode)) s.mode = settings.mode;
      else err('settings.mode', '"settings.mode" (chế độ phát biểu) phải là "free" (tự do) hoặc "turns" (lần lượt).');
    }
    for (const k of ['maxMsgs', 'timeLimitMin', 'idleSec']) {
      const n = number('settings.' + k, settings[k], LIMITS[k]);
      if (n !== undefined) s[k] = n;
    }
    const roles = list('roles', obj.roles, LIMITS.roles, LIMITS.role, true);
    if (roles) out.roles = roles;

    if (!out.context) warn('context', 'Chưa có bối cảnh ("context" trống): các agent sẽ không biết cần bàn gì.');
    for (const [key, v] of [['context', out.context], ['endCondition', out.endCondition], ['settings.agenda', s.agenda.join('\n')], ['roles', out.roles.join('\n')]])
      if (PLACEHOLDER.test(v)) warn(key, `"${key}" còn chỗ trống dạng <…> chưa điền: ${PLACEHOLDER.exec(v)[0]}`);
    return out;
  }

  // text: JSON người dùng dán (có thể bọc ```json). base: giá trị mặc định cho trường bị thiếu.
  // → { ok, brief, errors: [{key, msg, line?, col?}], warnings: [...] }; brief chỉ có khi ok.
  function parseBrief(text, base) {
    const report = { errors: [], warnings: [] };
    const done = (brief) => ({ ok: !report.errors.length, brief: report.errors.length ? null : brief, ...report });
    if (typeof text !== 'string' || !text.trim()) { report.errors.push({ key: '', msg: 'Chưa có nội dung JSON.' }); return done(null); }
    if (text.length > LIMITS.text) { report.errors.push({ key: '', msg: `JSON quá lớn (${Math.round(text.length / 1024)} KB, tối đa ${LIMITS.text / 1024} KB).` }); return done(null); }
    const ex = extract(text);
    if (ex.wrapped === 'prose') report.warnings.push({ key: '', msg: 'Đã bỏ phần chữ nằm ngoài khối JSON {…}.' });
    let obj;
    try { obj = JSON.parse(ex.src); } catch {
      const e = syntaxError(ex.src), pos = ex.at + e.pos;
      report.errors.push({ key: '', msg: `Lỗi cú pháp JSON ở dòng ${lineAt(text, pos)}, cột ${colAt(text, pos)}: ${e.msg}.`, line: lineAt(text, pos), col: colAt(text, pos) });
      return done(null);
    }
    const brief = normalize(obj, base, report);
    // gắn số dòng cho lỗi/cảnh báo theo trường: dòng đầu tiên có "tên khoá":
    for (const x of [...report.errors, ...report.warnings]) {
      if (!x.key || x.line) continue;
      const k = x.key.split('.').pop(), m = new RegExp('"' + k + '"\\s*:').exec(ex.src);
      if (m) x.line = lineAt(text, ex.at + m.index);
    }
    return done(brief);
  }

  // form: { context, endCondition, agenda, followUp, mode, maxMsgs, timeLimitMin, idleSec, roles } → bản brief chuẩn
  function toBrief(form, base) {
    const f = form || {};
    return normalize({
      schema: SCHEMA, context: f.context ?? '', endCondition: f.endCondition ?? '', roles: f.roles ?? [],
      settings: { agenda: f.agenda ?? [], followUp: !!f.followUp, mode: f.mode, maxMsgs: f.maxMsgs, timeLimitMin: f.timeLimitMin, idleSec: f.idleSec },
    }, base, { errors: [], warnings: [] });
  }
  const stringify = (brief) => JSON.stringify(brief, null, 2);

  const EXAMPLE = {
    schema: SCHEMA,
    context: 'Hai bạn cùng chọn kiến trúc cho app quản lý công việc nội bộ (khoảng 200 người dùng, đội 3 lập trình viên, ngân sách hạ tầng thấp). Mỗi bạn đề xuất một phương án, phản biện phương án còn lại bằng lập luận cụ thể (chi phí, rủi ro, thời gian), rồi thống nhất một kiến trúc. Cuối cùng gửi KẾT LUẬN kèm các dòng VIỆC, ghi đúng tên agent phụ trách.',
    endCondition: '',
    settings: { agenda: ['Chọn database', 'Chọn cách đăng nhập', 'Chia việc và hạn chót'], followUp: false, mode: 'free', maxMsgs: 80, timeLimitMin: 0, idleSec: 40 },
    roles: ['đề xuất phương án', 'phản biện'],
  };
  // Prompt tiếng Việt để người dùng dán cho ChatGPT/Claude… kèm mô tả cuộc họp, AI trả lại đúng một khối JSON.
  function aiPrompt(brief) {
    const draft = brief && (brief.context || brief.settings?.agenda?.length || brief.roles?.length);
    return [
      'Hãy viết giúp tôi "bản brief" dạng JSON cho một cuộc họp trên Agent Meeting: nhiều AI agent (Claude Code, Codex, Gemini CLI…, mỗi agent có thể chạy trên một máy khác) vào cùng một phòng, đọc bối cảnh, thảo luận với nhau rồi chốt bằng tin "KẾT LUẬN:" kèm các dòng "VIỆC: người phụ trách | việc | hạn". Tôi là chủ trì. Mô tả cuộc họp tôi muốn nằm ở cuối tin này.',
      '',
      'Chỉ trả về DUY NHẤT một khối JSON hợp lệ (không giải thích, không chú thích trong JSON), đúng cấu trúc và tên khoá như sau:',
      '',
      stringify(draft ? brief : EXAMPLE),
      '',
      draft ? '(Trên là bản nháp hiện tại của tôi: giữ những gì còn đúng, sửa và bổ sung theo mô tả.)' : '(Trên chỉ là ví dụ minh hoạ cấu trúc: hãy thay toàn bộ nội dung theo mô tả của tôi.)',
      '',
      'Ý nghĩa và giới hạn từng trường:',
      `- "schema": giữ nguyên "${SCHEMA}".`,
      `- "context" (bắt buộc, tối đa ${LIMITS.context} ký tự): lời dặn trực tiếp cho các agent: mục tiêu, thông tin nền (repo, đường dẫn, ràng buộc, số liệu), các bước cần làm, và kết quả mong muốn. Viết rõ ràng, cụ thể, xuống dòng bằng \\n.`,
      '  Các agent tự đặt tên khi vào phòng nên không biết trước tên: đừng gọi agent bằng tên riêng; nếu cần phân công thì dặn "mỗi dòng VIỆC ghi đúng tên agent phụ trách".',
      '  Nếu sau họp các agent phải đi làm thật (sửa code, viết tài liệu…), nói rõ bằng chứng cần báo khi xong (mã commit, kết quả test, link PR).',
      `- "endCondition" (tối đa ${LIMITS.endCondition} ký tự, có thể để ""): khi nào thì dừng họp. "" nghĩa là các agent tự bàn đến khi chốt được kết luận.`,
      `- "settings.agenda": chương trình họp, các mục được bàn lần lượt (tối đa ${LIMITS.agenda} mục, mỗi mục tối đa ${LIMITS.item} ký tự, không đánh số). [] nếu chỉ có một chủ đề.`,
      '- "settings.followUp": true nếu sau khi chốt, các agent rời họp đi làm việc được giao rồi quay lại báo tiến độ kèm bằng chứng (phòng được giữ tới khi mọi việc xong); false nếu chỉ cần bàn và chốt.',
      '- "settings.mode": "free" (tự do: ai có ý thì nói, nên dùng) hoặc "turns" (lần lượt theo thứ tự vào phòng).',
      `- "settings.maxMsgs": số tin tối đa của cả cuộc họp, ${LIMITS.maxMsgs[0]}-${LIMITS.maxMsgs[1]} (thường 40-150; để chống tốn tiền).`,
      `- "settings.timeLimitMin": giới hạn thời gian theo phút, ${LIMITS.timeLimitMin[0]}-${LIMITS.timeLimitMin[1]}; 0 = không giới hạn.`,
      `- "settings.idleSec": ${LIMITS.idleSec[0]}-${LIMITS.idleSec[1]} giây, chỉ dùng khi mode là "free": phòng im lặng bấy lâu thì hệ thống hỏi một agent có muốn chốt không (thường 40).`,
      `- "roles": vai trò theo THỨ TỰ agent vào phòng: agent vào thứ nhất nhận vai trò thứ nhất… (tối đa ${LIMITS.roles} vai trò, mỗi vai trò tối đa ${LIMITS.role} ký tự). [] nếu không cần; "" để bỏ trống vai trò của một agent.`,
      '',
      'Không để chỗ trống chờ điền kiểu dấu ngoặc nhọn. Nếu mô tả của tôi thiếu thông tin, hãy tự giả định hợp lý và ghi giả định đó vào "context".',
      '',
      'Mô tả cuộc họp của tôi:',
      '',
    ].join('\n');
  }

  return { SCHEMA, LIMITS, defaults, parseBrief, toBrief, stringify, aiPrompt, PLACEHOLDER };
});
