'use strict';
// Biên bản cuộc họp: Markdown cho người đọc, JSON cho tích hợp, văn bản ngắn cho webhook.
// Không bao giờ đưa mã chủ trì / mã agent vào biên bản.

const fmtDate = (t) => t ? new Date(t).toLocaleString('vi-VN') : '—';
const fmtTime = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const fmtDur = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
  return h ? `${h} giờ ${m} phút` : m ? `${m} phút ${s % 60} giây` : `${s} giây`;
};
const cell = (x) => String(x ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ') || '—';
const { decisionText } = require('./meeting');

// Tóm tắt từng mục (XONG MỤC) + KẾT LUẬN. Agent hay gửi lại KẾT LUẬN nhiều lần: mỗi mục chỉ giữ bản mới nhất.
function decisions(log) {
  const last = new Map();
  for (const x of log) if (x.conclusion && (x.decision ?? decisionText(x.text))) last.set(x.item ?? null, x);
  return log.flatMap(x => [
    ...(x.itemsDone || []).map(d => ({ by: x.name, t: x.t, item: d.item + 1, text: d.summary })),
    ...(last.get(x.item ?? null) === x ? [{ by: x.name, t: x.t, item: x.item == null ? null : x.item + 1, text: x.decision ?? decisionText(x.text) }] : []),
  ]).filter(d => d.text);
}

function toJSON(m) {
  const msgs = m.log.filter(x => x.type === 'chat');
  return {
    schema: 'agent-meeting/minutes@1',
    state: m.state, endReason: m.endReason || null,
    createdAt: m.createdAt, startedAt: m.startedAt, endedAt: m.endedAt,
    durationMs: m.startedAt ? (m.endedAt || Date.now()) - m.startedAt : 0,
    context: m.context, endCondition: m.endCondition,
    settings: { mode: m.cfg.mode, maxMsgs: m.cfg.maxMsgs, timeLimitMin: m.cfg.timeLimitMin },
    agenda: m.agenda.map((title, i) => {
      const done = m.log.flatMap(x => x.itemsDone || []).find(d => d.item === i);
      return { index: i + 1, title, done: i < m.agendaIndex, summary: done?.summary || null };
    }),
    members: [...m.agents.values()].map(a => ({
      slot: a.slot, name: a.name, model: a.model, role: a.role || null, messages: a.said, kicked: !!a.kicked,
    })),
    decisions: decisions(m.log),
    actions: m.actions.map(a => ({ owner: a.owner || null, task: a.task, due: a.due || null, proposedBy: a.by, item: a.item !== null ? a.item + 1 : null })),
    stats: { messages: msgs.length, members: m.agents.size },
    transcript: m.log.map(x => ({ t: x.t, type: x.type, name: x.type === 'host' ? 'Chủ trì' : x.name, to: x.to || null, text: x.text })),
  };
}

function toMarkdown(m) {
  const j = toJSON(m);
  const L = ['# Biên bản cuộc họp agent', ''];
  L.push(`- **Bắt đầu:** ${fmtDate(j.startedAt)}`);
  L.push(`- **Kết thúc:** ${j.endedAt ? `${fmtDate(j.endedAt)} (${j.endReason})` : 'đang họp'}`);
  if (j.startedAt) L.push(`- **Thời lượng:** ${fmtDur(j.durationMs)}`);
  L.push(`- **Chế độ:** ${j.settings.mode === 'turns' ? 'lần lượt' : 'tự do'} · tối đa ${j.settings.maxMsgs} tin${j.settings.timeLimitMin ? ` · ${j.settings.timeLimitMin} phút` : ''}`);
  L.push(`- **Số tin:** ${j.stats.messages}`, '');

  L.push('## Thành viên', '', '| Slot | Tên | Model | Vai trò | Số tin |', '|---|---|---|---|---|');
  for (const a of j.members) L.push(`| ${a.slot} | ${cell(a.name)}${a.kicked ? ' (bị mời ra)' : ''} | ${cell(a.model)} | ${cell(a.role)} | ${a.messages} |`);
  L.push('', '## Bối cảnh', '', j.context || '—', '');
  if (j.endCondition) L.push(`**Điều kiện kết thúc:** ${j.endCondition}`, '');

  if (j.agenda.length) {
    L.push('## Chương trình họp', '');
    for (const it of j.agenda) L.push(`${it.index}. ${it.done ? '✅' : '⬜'} ${it.title}${it.summary ? ` — ${it.summary}` : ''}`);
    L.push('');
  }
  L.push('## Quyết định', '');
  if (j.decisions.length) for (const d of j.decisions) L.push(`- ${d.item ? `**[Mục ${d.item}]** ` : ''}${d.text.replace(/\n+/g, ' ')} *(${d.by})*`);
  else L.push('*Chưa có quyết định nào được ghi nhận.*');
  L.push('', '## Việc cần làm', '');
  if (j.actions.length) {
    L.push('| # | Việc | Phụ trách | Hạn | Đề xuất bởi |', '|---|---|---|---|---|');
    j.actions.forEach((a, i) => L.push(`| ${i + 1} | ${cell(a.task)} | ${cell(a.owner)} | ${cell(a.due)} | ${cell(a.proposedBy)} |`));
  } else L.push('*Không có việc nào được giao.*');

  L.push('', '## Diễn biến', '');
  for (const x of m.log) {
    if (x.type === 'sys') L.push(`*${fmtTime(x.t)} · ${x.text}*`, '');
    else {
      const who = x.type === 'host' ? `Chủ trì${x.to ? ` → ${x.to} (riêng)` : ''}` : `${x.name}${m.agents.get(x.name)?.model ? ` (${m.agents.get(x.name).model})` : ''}`;
      L.push(`**${who}** · ${fmtTime(x.t)}`, '', x.text, '');
    }
  }
  return L.join('\n');
}

// Văn bản ngắn gọn cho Slack/Discord/Teams (giới hạn ~1900 ký tự)
function toSummary(m) {
  const j = toJSON(m);
  const topic = (j.context.split('\n').find(Boolean) || 'Cuộc họp agent').slice(0, 160);
  const L = [`🤝 Cuộc họp agent đã kết thúc: ${topic}`,
    `⏱ ${fmtDur(j.durationMs)} · ${j.stats.messages} tin · ${j.members.map(a => `${a.name} (${a.model})`).join(', ') || 'không có thành viên'} · ${j.endReason || ''}`];
  if (j.decisions.length) { L.push('', '✅ Quyết định:'); j.decisions.slice(-5).forEach(d => L.push(`• ${d.item ? `[Mục ${d.item}] ` : ''}${d.text.replace(/\s+/g, ' ').slice(0, 300)}`)); }
  if (j.actions.length) { L.push('', '📋 Việc cần làm:'); j.actions.slice(0, 10).forEach(a => L.push(`• ${a.task}${a.owner ? ` — ${a.owner}` : ''}${a.due ? ` (hạn: ${a.due})` : ''}`)); }
  const text = L.join('\n');
  return text.length > 1900 ? text.slice(0, 1890) + '…' : text;
}

module.exports = { toJSON, toMarkdown, toSummary, fmtDur };
