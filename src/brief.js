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
  // Ngôn ngữ thông báo: đặt mỗi lần gọi parseBrief (hàm chạy đồng bộ nên một biến chung là đủ).
  let L = 'vi';
  const M = (vi, en) => (L === 'en' ? en : vi);
  const FIELD_EN = {
    context: 'context', endCondition: 'end condition', 'settings.agenda': 'agenda', 'settings.followUp': 'progress reports',
    'settings.mode': 'speaking mode', 'settings.maxMsgs': 'message limit', 'settings.timeLimitMin': 'time limit (minutes)',
    'settings.idleSec': 'idle seconds before asking to wrap up', roles: 'roles',
  };
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
          if (n === 'u') { if (!/^[0-9a-fA-F]{4}$/.test(src.slice(i + 2, i + 6))) fail(M('mã \\u phải có đúng 4 chữ số hex', '\\u needs exactly 4 hex digits')); i += 6; continue; }
          if (!n || !'"\\/bfnrt'.includes(n)) fail(M(`ký tự thoát không hợp lệ "\\${n || ''}" (dùng \\n, \\", \\\\)`, `invalid escape "\\${n || ''}" (use \\n, \\", \\\\)`));
          i += 2; continue;
        }
        if (c === '\n' || c === '\r') fail(M('chuỗi không được xuống dòng thật: viết \\n, hoặc thiếu dấu " đóng chuỗi', 'a string cannot contain a real line break: write \\n, or a closing " is missing'));
        if (c < ' ') fail(M('chuỗi chứa ký tự điều khiển (tab…): viết \\t', 'a string contains a control character (tab…): write \\t'));
        i++;
      }
      fail(M('chuỗi chưa có dấu " đóng', 'a string is missing its closing "'));
    };
    const container = (close, item) => {
      i++; ws();
      if (src[i] === close) { i++; return; }
      for (;;) {
        ws(); item(); ws();
        if (src[i] === ',') { i++; ws(); if (src[i] === close) fail(M(`thừa dấu phẩy trước ${close}`, `extra comma before ${close}`)); continue; }
        if (src[i] === close) { i++; return; }
        fail(src[i] === undefined ? M(`JSON bị cắt cụt: thiếu ${close}`, `the JSON is cut off: missing ${close}`) : src[i] === '"' ? M('thiếu dấu phẩy giữa hai phần tử', 'missing comma between two items') : M(`cần dấu , hoặc ${close}`, `expected , or ${close}`));
      }
    };
    const value = () => {
      ws();
      const c = src[i];
      if (c === '{') return container('}', () => {
        if (src[i] !== '"') fail(src[i] === "'" ? M("tên khoá phải trong ngoặc kép \"…\", không dùng '…'", "keys need double quotes \"…\", not '…'") : M('cần tên khoá trong ngoặc kép "…"', 'expected a key in double quotes "…"'));
        string(); ws();
        if (src[i] !== ':') fail(M('thiếu dấu : sau tên khoá', 'missing : after the key'));
        i++; value();
      });
      if (c === '[') return container(']', value);
      if (c === '"') return string();
      const num = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(src.slice(i, i + 40));
      if (num && num[0] !== '-') { i += num[0].length; return; }
      for (const w of ['true', 'false', 'null']) if (src.startsWith(w, i)) { i += w.length; return; }
      if (c === undefined) fail(M('JSON bị cắt cụt (thiếu phần cuối)', 'the JSON is cut off (the end is missing)'));
      if ('“”„'.includes(c)) fail(M('dùng ngoặc kép thẳng " thay cho ngoặc cong “ ”', 'use straight quotes " instead of curly quotes “ ”'));
      if (c === "'") fail(M("chuỗi phải trong ngoặc kép \"…\", không dùng '…'", "strings need double quotes \"…\", not '…'"));
      fail(M(`ký tự không hợp lệ "${c}"`, `unexpected character "${c}"`));
    };
    try {
      value(); ws();
      if (i < src.length) fail(M('có nội dung thừa sau JSON', 'unexpected content after the JSON'));
    } catch (e) { if (e && typeof e.pos === 'number') return e; throw e; }
    return { pos: 0, msg: M('JSON không hợp lệ', 'invalid JSON') }; // JSON.parse báo lỗi mà bộ dò không thấy (không nên xảy ra)
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
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) { err('', M('JSON phải là một object {…} (không phải danh sách hay chuỗi).', 'The JSON must be an object {…} (not a list or a string).')); return out; }
    let settings = obj.settings;
    if (settings !== undefined && settings !== null && (typeof settings !== 'object' || Array.isArray(settings))) { err('settings', M('"settings" phải là object {…}.', '"settings" must be an object {…}.')); settings = {}; }
    settings = { ...(settings || {}) };
    for (const k of Object.keys(obj)) {
      if (TOP_KEYS.includes(k)) continue;
      if (SETTING_KEYS.includes(k)) {
        if (settings[k] === undefined) { settings[k] = obj[k]; warn(k, M(`"${k}" phải nằm trong "settings": đã chuyển vào đó.`, `"${k}" belongs inside "settings": moved there.`)); }
        else warn(k, M(`"${k}" ở ngoài "settings" bị bỏ qua (đã có trong "settings").`, `"${k}" outside "settings" is ignored (already set inside "settings").`));
      } else warn(k, M(`Khoá lạ "${k}" bị bỏ qua.`, `Unknown key "${k}" ignored.`));
    }
    for (const k of Object.keys(settings)) if (!SETTING_KEYS.includes(k)) warn('settings.' + k, M(`Khoá lạ "settings.${k}" bị bỏ qua.`, `Unknown key "settings.${k}" ignored.`));
    if (obj.schema !== undefined && obj.schema !== SCHEMA) warn('schema', M(`"schema" nên là "${SCHEMA}".`, `"schema" should be "${SCHEMA}".`));

    const text = (key, v, max) => {
      if (v === undefined || v === null) return undefined;
      if (typeof v !== 'string') { err(key, M(`"${key}" (${FIELD[key]}) phải là chuỗi văn bản "…".`, `"${key}" (${FIELD_EN[key]}) must be a text string "…".`)); return undefined; }
      v = v.replace(/\r\n?/g, '\n').trim();
      if (v.length > max) { warn(key, M(`"${key}" dài ${v.length} ký tự, đã cắt còn ${max}.`, `"${key}" is ${v.length} characters long, cut to ${max}.`)); v = v.slice(0, max).trim(); }
      return v;
    };
    const list = (key, v, maxN, maxLen, keepEmpty) => {
      if (v === undefined || v === null) return undefined;
      if (typeof v === 'string') v = v.split('\n');
      if (!Array.isArray(v)) { err(key, M(`"${key}" (${FIELD[key]}) phải là danh sách ["…", "…"].`, `"${key}" (${FIELD_EN[key]}) must be a list ["…", "…"].`)); return undefined; }
      const bad = v.findIndex(x => typeof x !== 'string' && typeof x !== 'number');
      if (bad >= 0) { err(key, M(`Phần tử thứ ${bad + 1} của "${key}" phải là chuỗi "…".`, `Item ${bad + 1} of "${key}" must be a string "…".`)); return undefined; }
      let r = v.map(x => String(x).replace(/\s+/g, ' ').trim());
      if (key === 'settings.agenda') r = r.map(x => x.replace(/^(\d+[.)]|[-*•])\s*/, '').trim());
      if (!keepEmpty) r = r.filter(Boolean);
      else while (r.length && !r[r.length - 1]) r.pop();
      if (r.length > maxN) { warn(key, M(`"${key}" có ${r.length} mục, chỉ giữ ${maxN} mục đầu.`, `"${key}" has ${r.length} items, only the first ${maxN} are kept.`)); r = r.slice(0, maxN); }
      if (r.some(x => x.length > maxLen)) { warn(key, M(`Có mục của "${key}" dài quá ${maxLen} ký tự, đã cắt.`, `Some items of "${key}" were longer than ${maxLen} characters and were cut.`)); r = r.map(x => x.slice(0, maxLen).trim()); }
      return r;
    };
    const number = (key, v, [lo, hi]) => {
      if (v === undefined || v === null || v === '') return undefined;
      const n = typeof v === 'number' ? v : typeof v === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(v) ? Number(v) : NaN;
      if (!Number.isFinite(n)) { err(key, M(`"${key}" (${FIELD[key]}) phải là số, trong khoảng ${lo}-${hi}.`, `"${key}" (${FIELD_EN[key]}) must be a number between ${lo} and ${hi}.`)); return undefined; }
      const c = Math.min(hi, Math.max(lo, Math.round(n)));
      if (c !== n) warn(key, Math.round(n) === c ? M(`"${key}" làm tròn thành ${c}.`, `"${key}" rounded to ${c}.`) : M(`"${key}" = ${n} ngoài khoảng ${lo}-${hi}, đã dùng ${c}.`, `"${key}" = ${n} is outside ${lo}-${hi}, using ${c}.`));
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
    else if (fu === 'true' || fu === 'false') { s.followUp = fu === 'true'; warn('settings.followUp', M('"settings.followUp" nên là true/false (không có ngoặc kép).', '"settings.followUp" should be true/false (without quotes).')); }
    else if (fu !== undefined && fu !== null) err('settings.followUp', M('"settings.followUp" (giữ phòng báo tiến độ) phải là true hoặc false.', '"settings.followUp" (progress reports) must be true or false.'));
    if (settings.mode !== undefined && settings.mode !== null) {
      if (MODES.includes(settings.mode)) s.mode = settings.mode;
      else err('settings.mode', M('"settings.mode" (chế độ phát biểu) phải là "free" (tự do) hoặc "turns" (lần lượt).', '"settings.mode" (speaking mode) must be "free" or "turns".'));
    }
    for (const k of ['maxMsgs', 'timeLimitMin', 'idleSec']) {
      const n = number('settings.' + k, settings[k], LIMITS[k]);
      if (n !== undefined) s[k] = n;
    }
    const roles = list('roles', obj.roles, LIMITS.roles, LIMITS.role, true);
    if (roles) out.roles = roles;

    if (!out.context) warn('context', M('Chưa có bối cảnh ("context" trống): các agent sẽ không biết cần bàn gì.', 'No context yet ("context" is empty): the agents will not know what to discuss.'));
    for (const [key, v] of [['context', out.context], ['endCondition', out.endCondition], ['settings.agenda', s.agenda.join('\n')], ['roles', out.roles.join('\n')]])
      if (PLACEHOLDER.test(v)) warn(key, M(`"${key}" có đoạn ${PLACEHOLDER.exec(v)[0]} trông như chỗ trống của mẫu: nếu đúng thì hãy điền, nếu là nội dung thật thì bỏ qua lưu ý này.`, `"${key}" contains ${PLACEHOLDER.exec(v)[0]}, which looks like a template blank: fill it in, or ignore this note if it is real content.`));
    return out;
  }

  // text: JSON người dùng dán (có thể bọc ```json). base: giá trị mặc định cho trường bị thiếu.
  // → { ok, brief, errors: [{key, msg, line?, col?}], warnings: [...] }; brief chỉ có khi ok.
  // lang: 'vi' (mặc định) | 'en' cho thông báo lỗi/lưu ý
  function parseBrief(text, base, lang) {
    L = lang === 'en' ? 'en' : 'vi';
    const report = { errors: [], warnings: [] };
    const done = (brief) => ({ ok: !report.errors.length, brief: report.errors.length ? null : brief, ...report });
    if (typeof text !== 'string' || !text.trim()) { report.errors.push({ key: '', msg: M('Chưa có nội dung JSON.', 'There is no JSON yet.') }); return done(null); }
    if (text.length > LIMITS.text) { report.errors.push({ key: '', msg: M(`JSON quá lớn (${Math.round(text.length / 1024)} KB, tối đa ${LIMITS.text / 1024} KB).`, `The JSON is too large (${Math.round(text.length / 1024)} KB, max ${LIMITS.text / 1024} KB).`) }); return done(null); }
    const ex = extract(text);
    if (ex.wrapped === 'prose') report.warnings.push({ key: '', msg: M('Đã bỏ phần chữ nằm ngoài khối JSON {…}.', 'Text outside the JSON block {…} was ignored.') });
    let obj;
    try { obj = JSON.parse(ex.src); } catch {
      const e = syntaxError(ex.src), pos = ex.at + e.pos;
      report.errors.push({ key: '', msg: M(`Lỗi cú pháp JSON ở dòng ${lineAt(text, pos)}, cột ${colAt(text, pos)}: ${e.msg}.`, `JSON syntax error at line ${lineAt(text, pos)}, column ${colAt(text, pos)}: ${e.msg}.`), line: lineAt(text, pos), col: colAt(text, pos) });
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

  // Ví dụ cố ý không có số liệu/chi tiết riêng: Haiku từng chép "200 người dùng, đội 3 lập trình viên" của ví dụ cũ
  // sang một cuộc họp không liên quan.
  const EXAMPLE = {
    schema: SCHEMA,
    context: 'Hai bạn cùng chọn thư viện vẽ biểu đồ cho trang báo cáo. Mỗi bạn đề xuất một lựa chọn, phản biện lựa chọn còn lại bằng lập luận cụ thể, rồi thống nhất một lựa chọn. Cuối cùng gửi KẾT LUẬN kèm các dòng VIỆC, ghi đúng tên agent phụ trách.',
    endCondition: '',
    settings: { agenda: ['So sánh các lựa chọn', 'Chốt lựa chọn và chia việc'], followUp: false, mode: 'free', maxMsgs: 60, timeLimitMin: 0, idleSec: 40 },
    roles: ['đề xuất', 'phản biện'],
  };
  // Prompt tiếng Việt để người dùng dán cho ChatGPT/Claude… kèm mô tả cuộc họp, AI trả lại đúng một khối JSON.
  function aiPrompt(brief, lang) {
    if (lang === 'en') return aiPromptEn(brief);
    const draft = brief && (brief.context || brief.settings?.agenda?.length || brief.roles?.length);
    return [
      'Hãy viết giúp tôi "bản brief" dạng JSON cho một cuộc họp trên Agent Meeting: nhiều AI agent (Claude Code, Codex, Gemini CLI…, mỗi agent có thể chạy trên một máy khác) vào cùng một phòng, đọc bối cảnh, thảo luận với nhau rồi chốt bằng tin "KẾT LUẬN:" kèm các dòng "VIỆC: người phụ trách | việc | hạn". Tôi là chủ trì. Mô tả cuộc họp tôi muốn nằm ở cuối tin này.',
      '',
      'Chỉ trả về DUY NHẤT một khối JSON hợp lệ (không giải thích, không chú thích trong JSON), đúng cấu trúc và tên khoá như sau:',
      '',
      stringify(draft ? brief : EXAMPLE),
      '',
      draft ? '(Trên là bản nháp hiện tại của tôi: giữ những gì còn đúng, sửa và bổ sung theo mô tả.)' : '(Trên chỉ là ví dụ minh hoạ cấu trúc: hãy thay toàn bộ nội dung theo mô tả của tôi, không giữ lại chi tiết hay số liệu nào của ví dụ.)',
      '',
      'Ý nghĩa và giới hạn từng trường:',
      `- "schema": giữ nguyên "${SCHEMA}".`,
      `- "context" (bắt buộc, tối đa ${LIMITS.context} ký tự): lời dặn trực tiếp cho các agent: mục tiêu, thông tin nền (repo, đường dẫn, ràng buộc, số liệu), các bước cần làm, và kết quả mong muốn. Viết rõ ràng, cụ thể, xuống dòng bằng \\n.`,
      '  Các agent tự đặt tên khi vào phòng nên không biết trước tên: đừng gọi agent bằng tên riêng; nếu cần phân công thì dặn "mỗi dòng VIỆC ghi đúng tên agent phụ trách".',
      '  Nếu sau họp các agent phải đi làm thật (sửa code, viết tài liệu…), nói rõ bằng chứng cần báo khi xong (mã commit, kết quả test, link PR).',
      `- "endCondition" (tối đa ${LIMITS.endCondition} ký tự, có thể để ""): khi nào thì dừng phần thảo luận. "" nghĩa là các agent tự bàn đến khi chốt được kết luận (thường nên để "").`,
      `- "settings.agenda": chương trình họp, các mục được bàn lần lượt (tối đa ${LIMITS.agenda} mục, mỗi mục tối đa ${LIMITS.item} ký tự, không đánh số). [] nếu chỉ có một chủ đề.`,
      '- "settings.followUp": true nếu sau khi chốt, các agent rời họp đi làm việc được giao rồi quay lại báo tiến độ kèm bằng chứng (phòng được giữ tới khi mọi việc xong); false nếu chỉ cần bàn và chốt.',
      '  Khi followUp là true: việc làm và báo tiến độ diễn ra SAU khi chốt, ngoài cuộc họp (hệ thống tự hướng dẫn agent). Vì vậy "agenda" và "endCondition" chỉ nói về phần bàn bạc (phân tích, chia việc, chốt); đừng đưa "làm việc", "báo tiến độ" hay "đã commit xong" vào đó.',
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

  // Bản tiếng Anh cho trang chủ trì tiếng Anh. Cùng các bài học như bản tiếng Việt (ví dụ không có số liệu để chép; khi
  // followUp thì agenda/endCondition chỉ là phần bàn bạc). Từ khoá giao thức (KẾT LUẬN, VIỆC) giữ nguyên tiếng Việt.
  const EXAMPLE_EN = {
    schema: SCHEMA,
    context: 'The two of you pick a charting library for the reports page. Each of you proposes one option and challenges the other with concrete arguments, then agree on one option. Finish with a KẾT LUẬN message and VIỆC lines, each naming the agent responsible.',
    endCondition: '',
    settings: { agenda: ['Compare the options', 'Pick one and split the work'], followUp: false, mode: 'free', maxMsgs: 60, timeLimitMin: 0, idleSec: 40 },
    roles: ['proposer', "devil's advocate"],
  };
  function aiPromptEn(brief) {
    const draft = brief && (brief.context || brief.settings?.agenda?.length || brief.roles?.length);
    return [
      'Please write a JSON "brief" for a meeting on Agent Meeting: several AI agents (Claude Code, Codex, Gemini CLI…, possibly each on a different machine) join one room, read the context, discuss with each other and conclude with a message starting with "KẾT LUẬN:" (conclusion) plus task lines "VIỆC: owner | task | due" (these two keywords stay in Vietnamese, they are part of the protocol). I chair the meeting. The meeting I want is described at the end of this message.',
      '',
      'Reply with ONE valid JSON block only (no explanation, no comments inside the JSON), with exactly this structure and these keys:',
      '',
      stringify(draft ? brief : EXAMPLE_EN),
      '',
      draft ? '(Above is my current draft: keep what is still right, fix and complete it from my description.)' : '(Above is only an example of the structure: replace all of it from my description, keep none of its details.)',
      '',
      'Meaning and limits of each field:',
      `- "schema": keep "${SCHEMA}".`,
      `- "context" (required, up to ${LIMITS.context} characters): direct instructions to the agents: goal, background (repo, paths, constraints, figures), the steps, and the expected output. Be clear and specific; use \\n for line breaks. Write it in the language the agents should use.`,
      '  Agents pick their own names when they join, so names are unknown in advance: do not address agents by name; to assign work, say "each VIỆC line names the agent responsible".',
      '  If the agents must do real work after the meeting (change code, write docs…), say what evidence to report when done (commit hash, test results, PR link).',
      `- "endCondition" (up to ${LIMITS.endCondition} characters, may be ""): when to stop the discussion. "" means the agents discuss until they reach a conclusion (usually best left "").`,
      `- "settings.agenda": items discussed in order (up to ${LIMITS.agenda} items, ${LIMITS.item} characters each, no numbering). [] for a single topic.`,
      '- "settings.followUp": true if, after the conclusion, the agents leave to do their tasks and come back to report progress with evidence (the room stays open until every task is done); false if they only need to discuss and decide.',
      '  When followUp is true, the work and the progress reports happen AFTER the conclusion, outside the meeting (the system guides the agents). So "agenda" and "endCondition" only cover the discussion (analysis, splitting the work, deciding); do not put "do the work", "report progress" or "everything committed" in them.',
      '- "settings.mode": "free" (anyone with something new speaks; recommended) or "turns" (in join order).',
      `- "settings.maxMsgs": message limit for the whole meeting, ${LIMITS.maxMsgs[0]}-${LIMITS.maxMsgs[1]} (usually 40-150; keeps costs down).`,
      `- "settings.timeLimitMin": time limit in minutes, ${LIMITS.timeLimitMin[0]}-${LIMITS.timeLimitMin[1]}; 0 = none.`,
      `- "settings.idleSec": ${LIMITS.idleSec[0]}-${LIMITS.idleSec[1]} seconds, only used in "free" mode: after this much silence the system asks one agent whether to conclude (usually 40).`,
      `- "roles": roles in JOIN ORDER: the first agent to join gets the first role… (up to ${LIMITS.roles} roles, ${LIMITS.role} characters each). [] if not needed; "" leaves one agent without a role.`,
      '',
      'Do not leave fill-in blanks in angle brackets. If my description lacks information, make reasonable assumptions and state them in "context".',
      '',
      'My meeting:',
      '',
    ].join('\n');
  }

  return { SCHEMA, LIMITS, defaults, parseBrief, toBrief, stringify, aiPrompt, PLACEHOLDER };
});
