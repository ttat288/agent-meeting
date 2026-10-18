'use strict';
// Trang chủ trì tiếng Anh: mọi chuỗi tr('…') / tr`…` trong app.js và mọi đoạn chữ trong index.html phải có bản dịch,
// nếu không trang tiếng Anh sẽ lẫn tiếng Việt.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const UI = path.join(__dirname, '..', 'src', 'ui');
function loadI18n(lang) {
  const ctx = { window: {}, location: { search: '?lang=' + lang }, navigator: { language: 'vi' }, localStorage: { getItem: () => null, setItem() {} },
    document: { documentElement: {} }, URLSearchParams };
  vm.runInNewContext(fs.readFileSync(path.join(UI, 'i18n.js'), 'utf8'), ctx);
  return ctx.window.AgentMeetingI18n;
}
const VI = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵĐ]/i;

// khoá như tr tạo ra: chuỗi '…' đã giải mã; template thì ${…} → {0}, {1}…
function keysOf(src) {
  const keys = [];
  for (let i = src.indexOf('tr'); i >= 0; i = src.indexOf('tr', i + 2)) {
    if (/[\w.$]/.test(src[i - 1] || '')) continue;
    if (src.startsWith("tr('", i)) {
      let j = i + 4, s = '';
      while (src[j] !== "'") { if (src[j] === '\\') { s += src[j] + src[j + 1]; j += 2; } else s += src[j++]; }
      keys.push(JSON.parse('"' + s.replace(/\\'/g, "'").replace(/"/g, '\\"') + '"'));
    } else if (src[i + 2] === '`') {
      let j = i + 3, s = '', k = 0;
      while (src[j] !== '`') {
        if (src[j] === '\\') { s += src[j] + src[j + 1]; j += 2; continue; }
        if (src[j] === '$' && src[j + 1] === '{') { // bỏ qua biểu thức (có thể lồng chuỗi, template)
          let depth = 1; j += 2;
          while (depth) {
            const c = src[j];
            if (c === "'" || c === '"') { const q = c; j++; while (src[j] !== q) j += src[j] === '\\' ? 2 : 1; }
            else if (c === '`') { j++; while (src[j] !== '`') j += src[j] === '\\' ? 2 : 1; }
            else if (c === '{') depth++;
            else if (c === '}') depth--;
            j++;
          }
          s += '{' + k++ + '}'; continue;
        }
        s += src[j++];
      }
      keys.push(JSON.parse('"' + s.replace(/"/g, '\\"') + '"'));
    }
  }
  return keys;
}

test('mọi chuỗi tr() trong app.js có bản tiếng Anh', () => {
  const { EN } = loadI18n('en');
  const keys = keysOf(fs.readFileSync(path.join(UI, 'app.js'), 'utf8'));
  assert.ok(keys.length > 200, 'tìm được ' + keys.length + ' chuỗi');
  const missing = [...new Set(keys)].filter(k => !EN.has(k));
  assert.deepEqual(missing, []);
  // không còn chuỗi tiếng Việt nào chưa bọc tr (trừ chú thích)
  const bare = fs.readFileSync(path.join(UI, 'app.js'), 'utf8').split('\n').filter(l => !/^\s*\/\//.test(l) && !l.includes('/* i18n-ok'))
    .map(l => l.replace(/\s\/\/ .*$/, '').replace(/tr\('(?:[^'\\]|\\.)*'\)/g, '').replace(/tr`(?:[^`\\]|\\.)*`/g, ''))
    .filter(l => /'[^']*/.test(l) && (l.match(/'(?:[^'\\]|\\.)*'/g) || []).some(x => VI.test(x)));
  assert.deepEqual(bare, []);
});

test('mọi đoạn chữ / thuộc tính trong index.html có bản tiếng Anh', () => {
  const { EN } = loadI18n('en');
  const h = fs.readFileSync(path.join(UI, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  const texts = [...h.matchAll(/>([^<>]+)</g)].map(m => m[1].replace(/\s+/g, ' ').trim()).filter(t => VI.test(t));
  const attrs = [...h.matchAll(/(?:placeholder|title|aria-label)="([^"]+)"/g)].map(m => m[1]).filter(t => VI.test(t));
  const missing = [...new Set([...texts, ...attrs])].filter(t => !EN.has(t));
  assert.deepEqual(missing, []);
});

test('tr: tiếng Việt giữ nguyên, tiếng Anh dịch, template đổi được tham số', () => {
  const vi = loadI18n('vi'), en = loadI18n('en');
  assert.equal(vi.lang, 'vi'); assert.equal(en.lang, 'en');
  const n = 3;
  assert.equal(vi.tr`${n} agent đang chờ`, '3 agent đang chờ');
  assert.equal(en.tr`${n} agent đang chờ`, '3 agent(s) waiting');
  assert.equal(en.tr`Đã gộp việc #${1} vào #${2}`, 'Task #1 merged into #2');
  assert.equal(en.tr('Lưu'), 'Save');
  assert.equal(en.tr('câu chưa dịch'), 'câu chưa dịch');
  for (const [k, v] of en.EN) { // số tham số {n} của bản dịch không vượt bản gốc
    const max = (s) => Math.max(-1, ...[...s.matchAll(/\{(\d+)\}/g)].map(m => +m[1]));
    assert.ok(max(v) <= max(k), k);
  }
});

test('parseBrief / aiPrompt tiếng Anh', () => {
  const B = require('../src/brief');
  const r = B.parseBrief('{\n "context": 5,\n}', null, 'en');
  assert.match(r.errors[0].msg, /JSON syntax error at line 3, column 1: extra comma before \}/);
  assert.match(B.parseBrief('{"context": 5}', null, 'en').errors[0].msg, /must be a text string/);
  assert.match(B.parseBrief('{"context": 5}').errors[0].msg, /phải là chuỗi/); // mặc định vẫn tiếng Việt
  const p = B.aiPrompt(B.defaults(), 'en');
  assert.match(p, /ONE valid JSON block only/);
  assert.match(p, /My meeting:\n$/);
  assert.doesNotMatch(p, B.PLACEHOLDER);
  assert.doesNotMatch(p.replace(/KẾT LUẬN|VIỆC/g, ''), VI); // chỉ giữ từ khoá giao thức tiếng Việt
  const sample = p.slice(p.indexOf('{'), p.indexOf('\n}\n') + 2);
  assert.deepEqual(B.parseBrief(sample).warnings, []);
});
