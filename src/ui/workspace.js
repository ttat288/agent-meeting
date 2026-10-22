'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let storedLang;
  try { storedLang = localStorage.getItem('agent-meeting:lang'); } catch {}
  const queryLang = new URLSearchParams(location.search).get('lang');
  const lang = ['vi', 'en'].includes(queryLang) ? queryLang : ['vi', 'en'].includes(storedLang) ? storedLang : navigator.language.startsWith('vi') ? 'vi' : 'en';
  const t = (vi, en) => lang === 'vi' ? vi : en;
  document.documentElement.lang = lang;
  const path = location.pathname.split('/').filter(Boolean);
  const hostKey = path[1];
  const base = '/api/host/' + encodeURIComponent(hostKey);
  const meetingUrl = '/m/' + encodeURIComponent(hostKey);
  const admin = path[2] === 'admin';
  const embedded = !!$('workView');
  let config, work = { tasks: [], runs: [] }, tab = 'tasks', adminTab = 'models', selectedModel, runtime = [];
  let remote = { hosts: [], runs: [] }, remoteError = null, metrics = null, metricsError = null, importDraft = '';
  let workReadVersion = 0, activeWorkReads = 0, pollController, pendingWork = null, syncState = 'live';
  const profileSelections = new Map();
  const probingProfiles = new Set();
  const node = (tag, attrs = {}, ...children) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'class') e.className = v;
      else if (k === 'value') e.value = v;
      else e.setAttribute(k, v === true ? '' : String(v));
    }
    children.flat().forEach(c => { if (c != null && c !== false) e.append(c.nodeType ? c : String(c)); });
    return e;
  };
  const button = (label, click, primary = false) => node('button', { type: 'button', class: 'btn ' + (primary ? 'primary' : 'ghost'), onclick: click }, label);
  const heading = (title, intro) => [node('p', { class: 'ws-eyebrow' }, admin ? t('Quản trị', 'Administration') : t('Không gian làm việc', 'Workspace')), node('h1', {}, title), node('p', { class: 'ws-intro' }, intro)];
  function notify(message) { $('notice').textContent = message; $('notice').hidden = false; setTimeout(() => { $('notice').hidden = true; }, 6000); }
  async function api(endpoint, data) {
    const readingWork = endpoint === '/work' && data === undefined;
    if (readingWork) { workReadVersion++; activeWorkReads++; pollController?.abort(); }
    try {
      const response = await fetch(base + endpoint, { method: data === undefined ? 'GET' : 'POST', headers: data === undefined ? {} : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
      let result;
      try { result = await response.json(); } catch { result = {}; }
      if (!response.ok) {
        const error = new Error(response.status === 409 && endpoint.startsWith('/config') ? t('Cấu hình đã thay đổi ở nơi khác. Bản đang sửa được giữ lại. Tải lại cấu hình để lấy revision mới; thao tác này bỏ bản đang sửa.', 'Configuration changed elsewhere. Your draft is retained. Reload configuration to get the new revision; this discards your draft.') : result.error || result.message || t('Yêu cầu thất bại', 'Request failed') + ' (' + response.status + ')');
        error.status = response.status; error.configConflict = response.status === 409 && endpoint.startsWith('/config');
        throw error;
      }
      if (endpoint === '/work' && data === undefined) { metrics = result.metrics; metricsError = null; window.dispatchEvent(new CustomEvent('am-work-state', { detail: result })); }
      return result;
    } finally { if (readingWork) activeWorkReads--; }
  }
  function acceptWork(next) { work = next; pendingWork = null; }
  function friendlyError(message) {
    const translations = {
      'Independent verification failed': 'Test độc lập thất bại. Xem bằng chứng, sửa yêu cầu hoặc checkout rồi chạy lại.',
      'Runtime reported permission denials': 'CLI đã từ chối một thao tác. Kiểm tra quyền CLI và phạm vi task trước khi thử lại.',
      'Acceptance criteria required': 'Cần ít nhất một tiêu chí nghiệm thu.',
      'Runtime access is unverified or routing constraints reject this task; probe the profile first': 'Chưa xác nhận quyền truy cập runtime hoặc task không đáp ứng quy tắc chia việc. Vào Quản trị → Agent & runtime để kiểm tra hồ sơ.',
      'Task changed; reload before saving this draft': 'Task đã thay đổi. Bản nháp được giữ theo revision cũ; làm mới để xem yêu cầu hiện tại.',
      'Task changed; refresh before running this task': 'Yêu cầu của task đã đổi. Xem cập nhật trước khi chọn hồ sơ và chạy lại.',
      'Cancel or reconcile the existing run before changing execution requirements': 'Hủy hoặc xử lý phiên chạy hiện tại trước khi sửa yêu cầu.',
      'Task source is no longer in this meeting; review the current plan': 'Nguồn task không còn trong phòng. Xem lại kế hoạch hiện tại.',
      'Requirement revision changed; the old result cannot be accepted': 'Yêu cầu đã đổi phiên bản. Không thể nghiệm thu kết quả cũ.',
      'Invalid write/test paths': 'Đường dẫn sửa hoặc test không hợp lệ.',
      'Verification tests must be outside agent write scope': 'Tệp test độc lập phải nằm ngoài phạm vi agent được sửa.',
      'Unknown or self dependency': 'Task phụ thuộc không tồn tại hoặc trỏ tới chính task này.',
      'Dependency cycle': 'Các task đang phụ thuộc vòng vào nhau.',
      'Server restarted; reconcile the old process before starting a new task.': 'Server đã khởi động lại. Cần đối chiếu và xử lý tiến trình cũ trước khi chạy tiếp; chưa hỗ trợ phục hồi tự động.',
      'Base revision changed': 'Base revision đã thay đổi. Kiểm tra lại checkout nguồn.',
      'Source checkout path changed': 'Đường dẫn checkout nguồn đã đổi. Kiểm tra thư mục thật trước khi tích hợp.',
      'Configuration changed; refresh before selecting an execution profile': 'Cấu hình đã đổi. Bấm Làm mới để xem và chọn hồ sơ chạy hiện tại.',
      'Configuration changed; reload before probing this profile': 'Cấu hình đã đổi. Giữ lại nội dung cần dùng rồi tải lại trang để xem ánh xạ hiện tại trước khi probe.'
    };
    return lang === 'vi' && translations[message] || message;
  }
  function errorBox(container, error, fieldId) {
    container.querySelector('.ws-error')?.remove();
    const box = node('div', { class: 'ws-error', role: 'alert', tabindex: '-1' }, node('strong', {}, t('Chưa thể hoàn thành thao tác', 'Unable to complete this action')), node('p', {}, friendlyError(error.message)));
    if (fieldId) { const input = $(fieldId); for (let parent = input?.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true; input?.setAttribute('aria-invalid', 'true'); box.append(button(t('Kiểm tra trường nhập', 'Check this field'), () => input?.focus())); }
    if (error.configConflict) box.append(button(t('Tải lại cấu hình', 'Reload configuration'), async () => { try { config = await api('/config'); renderAdmin(); } catch (e) { errorBox(container, e); } }));
    container.prepend(box); box.focus();
  }
  async function action(btn, container, fn) {
    btn.disabled = true;
    container.setAttribute('aria-busy', 'true');
    renderSyncStatus();
    try { await fn(); } catch (e) { if (container.isConnected && btn.isConnected) errorBox(container, e); else notify(t('Chưa nhận được kết quả thao tác trước: ', 'Previous action result unavailable: ') + friendlyError(e.message)); }
    finally { btn.disabled = false; container.removeAttribute('aria-busy'); renderSyncStatus(); }
  }
  function checkedAction(btn, container, run, operation) {
    return action(btn, container, async () => {
      const status = node('span', { role: 'status' }, operation === 'verify'
        ? t('Đang chạy test độc lập…', 'Running independent tests…')
        : t('Đang tích hợp và test checkout nguồn…', 'Integrating and testing the source checkout…'));
      const cancel = button(t('Hủy phiên chạy', 'Cancel run'), async () => {
        cancel.disabled = true;
        try { await api('/work/runs/' + encodeURIComponent(run.id) + '/cancel', {}); status.textContent = t('Đã yêu cầu hủy; đang chờ tiến trình dừng…', 'Cancellation requested; waiting for the process to stop…'); }
        catch (error) { errorBox(container, error); cancel.disabled = false; }
      });
      const waiting = node('div', { class: 'ws-actions' }, status, cancel);
      btn.after(waiting);
      try {
        await api('/work/runs/' + encodeURIComponent(run.id) + '/' + operation, {});
        // Navigation may have opened a different task draft while tests ran.
        // Its DOM belongs to that view; the normal live read will refresh it.
        if (container.isConnected) {
          const next = await api('/work');
          if (container.isConnected) { acceptWork(next); renderTaskList(); $('workTitle')?.focus({ preventScroll: true }); }
        }
      } finally { waiting.remove(); }
    });
  }
  const field = (label, id, value = '', hint = '', type = 'input') => {
    const input = node(type === 'textarea' ? 'textarea' : 'input', { id, name: id, value, type: type === 'textarea' ? null : 'text' });
    if (type === 'textarea') input.textContent = value;
    return node('label', { class: 'ws-field', for: id }, node('span', {}, label), input, hint && node('small', {}, hint));
  };
  const selectField = (label, id, options, value) => node('label', { class: 'ws-field', for: id }, node('span', {}, label), node('select', { id, name: id }, options.map(([v, text]) => node('option', { value: v, selected: v === value }, text))));
  const split = value => value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const csv = value => value.split(',').map(s => s.trim()).filter(Boolean);
  const statusText = value => ({ planned: t('Đã lên kế hoạch', 'Planned'), ready: t('Chờ kiểm tra điều kiện', 'Awaiting readiness checks'), queued: t('Đang chờ', 'Queued'), running: t('Đang chạy', 'Running'), reported: t('Agent đã báo cáo', 'Agent reported'), verifying: t('Đang kiểm chứng', 'Verifying'), verified: t('Đã kiểm chứng', 'Verified'), integrating: t('Chờ tích hợp', 'Awaiting integration'), done: t('Đã tích hợp và test', 'Integrated and tested'), failed: t('Thất bại', 'Failed'), cancelled: t('Đã hủy', 'Cancelled'), rejected: t('Bị từ chối', 'Rejected'), interrupted: t('Bị gián đoạn', 'Interrupted'), timeout: t('Hết thời gian', 'Timed out'), 'output-limit': t('Vượt giới hạn đầu ra', 'Output limit exceeded'), lost: t('Mất kết nối / lease hết hạn', 'Connection lost / lease expired'), leased: t('Worker đã nhận lease', 'Worker holds lease'), integrated: t('Đã tích hợp', 'Integrated'), stale: t('Yêu cầu đã thay đổi', 'Requirements changed'), retired: t('Lịch sử', 'History'), unknown: t('Chưa biết', 'Unknown') })[value] || value;
  const modeText = value => ({ discuss: t('Trao đổi', 'Discuss'), plan: t('Lập kế hoạch', 'Plan'), execute: t('Thực hiện', 'Execute'), local: t('Cùng máy', 'Local'), remote: t('Nhiều máy', 'Remote'), mixed: t('Kết hợp', 'Mixed'), invited: t('Mời bên ngoài', 'Invited'), managed: t('Tool quản lý', 'Managed') })[value] || value;
  const json = value => node('pre', { class: 'ws-code' }, JSON.stringify(value, null, 2));
  const val = id => $(id).value.trim();
  if (admin) {
    document.title = 'Agent Meeting · ' + t('Quản trị', 'Administration');
    document.querySelector('.skip-link').textContent = t('Bỏ qua điều hướng', 'Skip navigation');
    const back = new URLSearchParams(location.search).get('view');
    const hash = ['plan','execute','results','conversation'].includes(back) ? '#' + back : '#conversation';
    $('homeLink').href = meetingUrl + location.search + hash;
    $('topNav').setAttribute('aria-label', t('Điều hướng', 'Navigation'));
    $('topNav').append(node('a', { href: meetingUrl + location.search + hash }, t('Quay lại phiên làm việc', 'Return to session')));
    $('language').textContent = lang === 'vi' ? 'EN' : 'VI';
    $('language').onclick = () => { const url = new URL(location.href); url.searchParams.set('lang', lang === 'vi' ? 'en' : 'vi'); location.href = url; };
  }
  const theme = node('select', { 'aria-label': t('Giao diện', 'Theme'), class: 'ws-theme' },
    [['system', t('Theo hệ thống', 'System theme')], ['light', t('Sáng', 'Light')], ['dark', t('Tối', 'Dark')]].map(([value, text]) => node('option', { value }, text)));
  try { theme.value = localStorage.getItem('agent-meeting:theme') || 'system'; } catch {}
  const applyTheme = () => { document.documentElement.dataset.theme = theme.value; };
  theme.onchange = () => { applyTheme(); try { localStorage.setItem('agent-meeting:theme', theme.value); } catch {} };
  applyTheme();
  if (admin) $('language').before(theme); else $('displayOptions').append(theme);
  function taskDraftKey(task) { return 'agent-meeting:' + hostKey + ':task:' + task.id + ':' + task.requirementRevision; }
  const draftArrayFields = new Set(['acceptance','writePaths','testFiles','dependencies','sources','facts','unknowns']);
  function storedTaskDraft(key, fields) {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
      return Object.fromEntries(fields.filter(name => draftArrayFields.has(name)
        ? Array.isArray(saved[name]) && saved[name].every(value => typeof value === 'string')
        : typeof saved[name] === 'string').map(name => [name, saved[name]]));
    } catch { return {}; }
  }
  function previousTaskDraft(task, fields) {
    const prefix = 'agent-meeting:' + hostKey + ':task:' + task.id + ':';
    let previous = null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i); if (!key?.startsWith(prefix)) continue;
        const revision = Number(key.slice(prefix.length));
        if (!Number.isSafeInteger(revision) || revision < 1 || revision >= task.requirementRevision || revision <= (previous?.revision || 0)) continue;
        const values = storedTaskDraft(key, fields);
        if (Object.keys(values).length) previous = { revision, values };
      }
    } catch {}
    return previous;
  }
  function configureForm(task) {
    const prefix = 'edit-' + task.id + '-', fields = ['purpose','topology','management','workspace','baseRevision','acceptance','writePaths','testFiles','dependencies','sources','facts','unknowns'];
    const draft = { ...task, ...storedTaskDraft(taskDraftKey(task), fields) }, previous = previousTaskDraft(task, fields);
    const form = node('form', { class: 'ws-panel' });
    const id = name => prefix + name;
    form.append(node('p', { class: 'ws-meta' }, t('Bổ sung điều kiện trên cùng task; lưu không khởi chạy agent.', 'Add prerequisites to this task; saving does not launch an agent.')),
      node('div', { class: 'ws-grid' },
        selectField(t('Mục đích', 'Purpose'), id('purpose'), [['plan', t('Lập kế hoạch', 'Plan')], ['execute', t('Thực hiện', 'Execute')]], draft.purpose),
        selectField(t('Vị trí', 'Location'), id('topology'), [['local', t('Cùng máy', 'Local')], ['remote', t('Nhiều máy', 'Remote')], ['mixed', t('Kết hợp', 'Mixed')]], draft.topology),
        selectField(t('Quản lý agent', 'Agent management'), id('management'), [['invited', t('Mời bên ngoài', 'Invited')], ['managed', t('Tool quản lý', 'Managed')], ['mixed', t('Kết hợp', 'Mixed')]], draft.management)));
    const textFields = [['acceptance','Tiêu chí nghiệm thu (mỗi dòng một mục)','Acceptance criteria (one per line)',true], ['workspace','Checkout nguồn','Source checkout'], ['baseRevision','Base revision','Base revision'], ['writePaths','Đường dẫn được sửa (mỗi dòng một mục)','Allowed write paths (one per line)',true], ['testFiles','Tệp Node test độc lập (mỗi dòng một mục)','Independent Node test files (one per line)',true], ['dependencies','Phụ thuộc: task ID (mỗi dòng một mục)','Dependencies: task IDs (one per line)',true], ['sources','Nguồn cần đọc (mỗi dòng một mục)','Sources to read (one per line)',true], ['facts','Facts (mỗi dòng một mục)','Facts (one per line)',true], ['unknowns','Điều chưa biết (mỗi dòng một mục)','Unknowns (one per line)',true]];
    for (const [name, vi, en, area] of textFields) form.append(field(t(vi,en), id(name), area ? (draft[name] || []).join('\n') : draft[name] || '', '', area ? 'textarea' : 'input'));
    const execution = node('div', { class: 'ws-grid two' });
    for (const name of ['workspace','baseRevision','writePaths','testFiles']) execution.append(form.querySelector('[id="' + id(name) + '"]').closest('.ws-field'));
    const advanced = disclosure(t('Phụ thuộc và bối cảnh bổ sung', 'Dependencies and additional context'));
    for (const name of ['dependencies','sources','facts','unknowns']) advanced.append(form.querySelector('[id="' + id(name) + '"]').closest('.ws-field'));
    form.append(node('h3', {}, t('Checkout và phạm vi kiểm chứng', 'Checkout and verification scope')), execution, advanced);
    const previousFields = previous && fields.filter(name => Object.hasOwn(previous.values, name)
      && JSON.stringify(previous.values[name]) !== JSON.stringify(draft[name] ?? (draftArrayFields.has(name) ? [] : '')));
    if (previousFields?.length) {
      const recovery = disclosure(t('Xem bản nháp trước · v', 'View previous draft · v') + previous.revision,
        node('p', { class: 'ws-meta' }, t('Chỉ hiện trường khác với bản đang mở, chỉ đọc. Chép phần cần giữ vào trường hiện tại rồi kiểm tra trước khi lưu.', 'Only differing fields are shown, read-only. Copy what you need into the current fields and review before saving.')));
      for (const [name, vi, en] of [['purpose','Mục đích','Purpose'], ['topology','Vị trí','Location'], ['management','Quản lý agent','Agent management'], ...textFields]) {
        if (!previousFields.includes(name)) continue;
        const value = previous.values[name], old = field(t(vi,en) + ' · v' + previous.revision, id('previous-' + name), Array.isArray(value) ? value.join('\n') : value, '', 'textarea');
        old.querySelector('textarea').readOnly = true;
        recovery.append(old);
      }
      form.append(recovery);
    }
    const readDraft = () => Object.fromEntries(fields.map(name => [name, ['acceptance','writePaths','testFiles','dependencies','sources','facts','unknowns'].includes(name) ? split(val(id(name))) : val(id(name))]));
    form.oninput = form.onchange = () => { try { localStorage.setItem(taskDraftKey(task), JSON.stringify(readDraft())); } catch {} };
    const save = node('button', { class: 'btn primary', type: 'submit' }, t('Lưu yêu cầu của task', 'Save task requirements'));
    form.append(save);
    form.onsubmit = event => { event.preventDefault(); if (!split(val(id('acceptance'))).length) { errorBox(form, new Error(t('Cần ít nhất một tiêu chí nghiệm thu.', 'At least one acceptance criterion is required.')), id('acceptance')); return; } action(save, form, async () => {
      await api('/work/tasks/' + encodeURIComponent(task.id) + '/configure', { ...readDraft(), expectedRevision: task.requirementRevision });
      try { localStorage.removeItem(taskDraftKey(task)); } catch {}
      acceptWork(await api('/work')); renderTaskList(); $('workTitle')?.focus(); notify(t('Đã lưu; task ID được giữ nguyên. Chưa khởi chạy agent.', 'Saved with the same task ID. No agent has been launched.'));
    }); };
    return node('details', { class: 'ws-configure' }, node('summary', {}, t('Chuẩn bị thực hiện / sửa yêu cầu', 'Prepare execution / edit requirements')), form);
  }

  const disclosure = (label, ...content) => node('details', { class: 'ws-disclosure' }, node('summary', {}, label), ...content);
  const viewLink = (hash, label, primary = false) => node('a', { class: 'btn ' + (primary ? 'primary' : 'ghost'), href: '#' + hash }, label);
  const activeRun = run => ['queued', 'starting', 'running', 'verifying', 'integrating'].includes(run.status);
  function evidencePassed(entry) { return !!entry && typeof entry === 'object' && entry.exitCode === 0 && !entry.error && !entry.timeout && !entry.cancelled; }
  function renderSyncStatus() {
    const status = $('workSync'); if (!status) return;
    const page = $('page'), busy = page.getAttribute('aria-busy') === 'true' || !!page.querySelector('[aria-busy=true]');
    const signature = syncState + ':' + !!pendingWork + ':' + busy;
    if (status.dataset.state === signature) return;
    status.dataset.state = signature;
    status.replaceChildren(node('span', { role: 'status' }, syncState === 'offline'
      ? t('Mất kết nối · đang thử lại', 'Connection lost · retrying')
      : pendingWork ? t('Có cập nhật', 'Updates available') : t('Tự cập nhật', 'Live updates')));
    if (pendingWork) { const apply = button(t('Xem cập nhật', 'Show updates'), () => applyWorkUpdate(true)); apply.disabled = busy; status.append(apply); }
  }
  function applyWorkUpdate(explicit = false) {
    if (!pendingWork) return;
    const page = $('page'), list = $('taskList');
    // A background update must not discard an edit, close evidence being read,
    // or steal keyboard focus. The explicit button leaves saved drafts intact.
    if (page.querySelector('[aria-busy=true]') || page.getAttribute('aria-busy') === 'true') return;
    if (!explicit && (list?.contains(document.activeElement) || list?.querySelector('details[open]'))) return;
    const scroll = $('workView').scrollTop;
    work = pendingWork.work; remote = pendingWork.remote; pendingWork = null;
    metrics = work.metrics; metricsError = null; remoteError = null;
    renderDaily(); $('workView').scrollTop = scroll;
    window.dispatchEvent(new CustomEvent('am-work-state', { detail: work }));
    if (explicit) $('workTitle').focus({ preventScroll: true });
  }
  function renderDaily() {
    const page = $('page');
    const refresh = button(t('Làm mới', 'Refresh'), () => action(refresh, page, async () => { acceptWork(await api('/work')); config = await api('/config'); await loadAuxiliary(); renderDaily(); notify(t('Đã cập nhật', 'Updated')); }));
    let context = work.session?.context || '';
    if (!context) try { context = JSON.parse(localStorage.getItem('agent-meeting:' + hostKey + ':brief') || '{}').context || ''; } catch {}
    const title = tab === 'plan' ? t('Kế hoạch', 'Plan') : tab === 'results' ? t('Kết quả', 'Results') : t('Thực hiện', 'Execute');
    page.replaceChildren(node('header', { class: 'ws-view-heading ws-row between' }, node('div', {}, node('h1', { tabindex: '-1', id: 'workTitle' }, title + ' (' + (work.tasks || []).filter(task => tab !== 'results' || [...(work.runs || []), ...(remote.runs || [])].some(run => run.taskId === task.id)).length + ')')), node('div', { class: 'ws-row' }, node('div', { id: 'workSync', class: 'ws-sync' }), refresh)),
      node('section', { id: 'taskList', 'aria-label': t('Danh sách công việc', 'Task list') }),
      disclosure(t('Bối cảnh phiên', 'Session context'), node('p', { class: 'session-context' }, context || t('Chưa có bối cảnh.', 'No context yet.')), viewLink('conversation', t('Về hội thoại', 'Go to conversation'))));
    renderTaskList();
    renderSyncStatus();
  }
  function renderTaskList() {
    const list = $('taskList'); if (!list) return;
    list.replaceChildren();
    if (remoteError) list.append(node('p', { class: 'ws-warning' }, t('Chưa tải được dữ liệu worker: ', 'Worker data could not be loaded: ') + remoteError.message));
    const tasks = work.tasks || []; let renderedTasks = 0;
    if (!tasks.length) {
      list.append(node('div', { class: 'ws-empty' }, node('h2', {}, t('Chưa có công việc', 'No tasks yet')), node('p', {}, t('Chốt dòng VIỆC trong hội thoại để bắt đầu kế hoạch.', 'Agree on task lines in the conversation to start planning.')), viewLink('conversation', t('Về hội thoại', 'Go to conversation'), true))); return;
    }
    for (const task of tasks) {
      const runs = (work.runs || []).filter(r => r.taskId === task.id);
      const remoteRuns = (remote.runs || []).filter(r => r.taskId === task.id);
      if (tab === 'results' && !runs.length && !remoteRuns.length) continue;
      const state = task.sourceCurrent === false ? 'retired' : task.status || 'planned';
      const card = node('article', { class: 'ws-task', 'data-task-id': task.id },
        node('header', { class: 'ws-row between' }, node('div', {}, node('h2', {}, task.goal), node('p', { class: 'ws-task-label' }, (task.origin?.kind === 'pm-goal' ? t('Mục tiêu PM #', 'PM goal #') + task.origin.goalRevision : task.origin?.kind === 'meeting-action' ? t('Việc #', 'Task #') + task.origin.number : t('Công việc', 'Task')) + (task.owner ? ' · ' + task.owner : ''))), node('span', { class: 'ws-pill', 'data-status': state }, task.pmId && state === 'done' ? t('Đã tích hợp và test', 'Integrated and tested') : state === 'verifying' ? t('Chờ kiểm chứng', 'Awaiting verification') : statusText(state))));
      const sourceHash = task.origin?.kind === 'pm-goal' ? '#pmControl' : task.origin?.roomCreatedAt === work.session?.createdAt && task.origin?.messageIndex != null ? '#message-' + task.origin.messageIndex : '#conversation';
      const source = node('div', { class: 'ws-task-source ws-row' }, task.origin ? node('a', { href: sourceHash }, task.origin.kind === 'pm-goal' ? t('Nguồn mục tiêu PM', 'PM goal source') : t('Nguồn hội thoại', 'Conversation source')) : node('span', { class: 'ws-meta' }, t('Chưa liên kết nguồn hội thoại', 'No conversation source linked')),
        disclosure(t('Chi tiết task', 'Task details'), node('p', { class: 'ws-meta' }, task.id + ' · ' + t('Yêu cầu v', 'Requirement v') + task.requirementRevision),
          node('p', {}, [task.purpose || 'plan', task.topology || 'local', task.management || 'invited'].map(modeText).join(' · ')),
          task.workspace && node('p', { class: 'ws-meta' }, task.workspace + ' · ' + (task.baseRevision || t('Chưa chốt base revision', 'Base revision not set'))),
          !!task.dependencies?.length && node('p', {}, t('Phụ thuộc: ', 'Dependencies: ') + task.dependencies.join(', ')),
          task.origin?.kind === 'meeting-action' && node('div', {}, node('p', { class: 'session-context' }, task.origin.context), node('pre', { class: 'ws-code' }, task.origin.message)),
          task.reportedProgress && node('p', { class: 'ws-meta' }, t('Tiến độ tự báo (chưa kiểm chứng): ', 'Self-reported progress (unverified): ') + task.reportedProgress.status + (task.reportedProgress.note ? ' · ' + task.reportedProgress.note : ''))));

      if (task.sourceCurrent === false) card.append(node('p', { class: 'ws-warning' }, t('Nguồn không còn trong phòng hiện tại. Giữ lịch sử; không chạy hoặc tích hợp tự động.', 'Source no longer belongs to the current room. History is retained; execution and automatic integration are blocked.')));

      if (tab === 'plan' && task.sourceCurrent !== false) {
        card.append(configureForm(task));
        if (task.purpose === 'execute' && task.acceptance?.length) card.append(node('div', { class: 'ws-actions' }, task.status === 'done' ? viewLink('results', t('Xem kết quả →', 'Review results →')) : viewLink('execute', t('Tiếp: thực hiện →', 'Next: execute →'), true)));
      }
      if (tab === 'tasks' && task.sourceCurrent !== false) {
        if (task.purpose === 'execute' && task.topology === 'local' && task.management === 'managed') {
          const profileId = 'profile-' + task.id;
          const profiles = (config?.profiles || []).filter(p => p.enabled);
          const configRevision = config?.revision, savedProfile = profileSelections.get(task.id);
          const selectedProfile = savedProfile?.requirementRevision === task.requirementRevision && savedProfile.configRevision === configRevision && profiles.some(p => p.id === savedProfile.id) ? savedProfile.id : '';
          if (!selectedProfile) profileSelections.delete(task.id);
          const controls = node('div', { class: 'ws-run-controls' });
          const run = button(t('Chạy trong workspace riêng', 'Run in isolated workspace'), () => action(run, card, async () => {
            if (!val(profileId)) { errorBox(card, new Error(t('Chọn hồ sơ chạy trước.', 'Select an execution profile first.')), profileId); return; }
            await api('/work/tasks/' + encodeURIComponent(task.id) + '/run', { profileId: val(profileId), expectedConfigRevision: configRevision, expectedRequirementRevision: task.requirementRevision }); acceptWork(await api('/work')); renderTaskList(); notify(t('Đã gửi yêu cầu chạy.', 'Run requested.'));
          }), true);
          const existingResult = runs.some(r => r.requirementRevision === task.requirementRevision && !['failed','cancelled','timeout','output-limit','rejected'].includes(r.status));
          run.disabled = !profiles.length || runs.some(activeRun) || existingResult;
          const choice = selectField(t('Hồ sơ chạy', 'Execution profile'), profileId, [['', t('Chọn hồ sơ', 'Select a profile')], ...profiles.map(p => [p.id, p.label])], selectedProfile);
          choice.querySelector('select').onchange = event => { if (event.target.value) profileSelections.set(task.id, { id: event.target.value, requirementRevision: task.requirementRevision, configRevision }); else profileSelections.delete(task.id); };
          controls.append(choice, run);
          if (!existingResult && !runs.some(activeRun)) card.append(controls);
          if (!profiles.length) card.append(node('p', { class: 'ws-warning' }, t('Chưa có hồ sơ được bật. Mở Quản trị → Agent & runtime để cấu hình.', 'No enabled profiles. Open Administration → Agents & runtimes to configure one.')));


        } else if (task.purpose === 'execute' && ['remote', 'mixed'].includes(task.topology) && ['managed', 'mixed'].includes(task.management)) renderRemoteQueue(card, task);
        else card.append(node('div', { class: 'ws-next' }, viewLink('plan', t('Chuẩn bị trong Kế hoạch', 'Prepare in Plan'), true)));
      }
      if (tab !== 'plan') for (const [index, run] of [...runs].reverse().entries()) {
        const runView = node('section', { class: 'ws-run', 'data-run-id': run.id }, node('div', { class: 'ws-row between' }, node('h3', {}, t('Lần chạy ', 'Attempt ') + (runs.length - index)), node('span', { class: 'ws-pill', 'data-status': run.status }, statusText(run.status || 'unknown'))));
        const explanation = { reported: t('Báo cáo đã sẵn sàng. Cần test độc lập trước khi nhận kết quả.', 'Report ready. Independent tests are required before acceptance.'), verified: t('Test đã đạt. Tích hợp sẽ kiểm tra lại trên checkout nguồn.', 'Tests passed. Integration will test the source checkout again.'), integrated: t('Đã tích hợp và test trên checkout nguồn.', 'Integrated and tested on the source checkout.'), failed: t('Phiên chạy thất bại. Xem bằng chứng và điều chỉnh trước khi chạy lại.', 'Run failed. Review the evidence and adjust before retrying.') }[run.status];
        if (explanation && run.status !== 'integrated') runView.append(node('p', { class:'ws-subtle' }, explanation));
        if (tab === 'results' && run.report) runView.append(node('p', { class: 'ws-report' }, run.report));
        if (tab === 'results' && run.changes?.length) runView.append(node('p', { class: 'ws-meta' }, t('Tệp thay đổi: ', 'Changed files: ') + run.changes.map(c => c.file).join(', ')));
        const evidence = [...(run.evidence || []), ...(run.integrationEvidence || [])];
        if (evidence.length) runView.append(node('p', { class: 'ws-meta' }, t('Test đạt: ', 'Tests passed: ') + evidence.filter(evidencePassed).length + '/' + evidence.length));
        if (run.error) runView.append(node('p', { class: 'ws-warning' }, friendlyError(run.error)));
        const actions = node('div', { class: 'ws-actions' });
        if (tab === 'results' && ['failed','cancelled','rejected','timeout','output-limit'].includes(run.status) && task.sourceCurrent !== false) actions.append(viewLink('execute', t('Thử lại trong Thực hiện →', 'Retry in Execute →'), true));
        if (activeRun(run)) {
          const cancel = button(t('Hủy phiên chạy', 'Cancel run'), () => action(cancel, runView, async () => { await api('/work/runs/' + encodeURIComponent(run.id) + '/cancel', {}); acceptWork(await api('/work')); renderTaskList(); })); actions.append(cancel);
        }
        if (tab === 'results' && run.status === 'reported' && task.sourceCurrent !== false && run.requirementRevision === task.requirementRevision) {
          const verify = button(t('Kiểm chứng bằng Node test', 'Verify with Node tests'), () => checkedAction(verify, runView, run, 'verify'), true); actions.append(verify);
        }
        if (tab === 'results' && run.status === 'verified' && task.sourceCurrent !== false && run.requirementRevision === task.requirementRevision) {
          const integrate = button(t('Tích hợp kết quả đã kiểm chứng', 'Integrate verified result'), () => checkedAction(integrate, runView, run, 'integrate'), true); actions.append(integrate);
        }
        if (tab === 'tasks' && ['reported', 'verified', 'integrated'].includes(run.status)) actions.append(viewLink('results', t('Xem kết quả →', 'Review results →'), true));
        if (run.requirementRevision !== task.requirementRevision) runView.append(node('p', { class: 'ws-warning' }, t('Kết quả thuộc yêu cầu cũ; không được nghiệm thu cho revision hiện tại.', 'This result belongs to an older requirement and cannot be accepted for the current revision.')));
        const downloads = node('div', { class: 'ws-actions' }, node('a', { class: 'btn ghost', href: base + '/work/runs/' + encodeURIComponent(run.id) + '/handoff', download: 'handoff.json' }, t('Tải bản bàn giao', 'Download handoff')));
        for (const change of run.changes || []) if (change.after) downloads.append(node('a', { class: 'btn ghost', href: base + '/work/runs/' + encodeURIComponent(run.id) + '/artifact?path=' + encodeURIComponent(change.file) }, t('Tải kết quả: ', 'Download result: ') + change.file));
        const details = disclosure(t('Bằng chứng và tệp bàn giao', 'Evidence and handoff files'), node('p', { class: 'ws-meta' }, run.id + ' · ' + (run.profileId || '') + ' · ' + (run.reportedModel || run.actualModel || t('Model chưa biết', 'Model unknown'))), downloads);
        if (['reported', 'verified'].includes(run.status)) {
          const rebase = button(t('Cập nhật nguồn và kiểm chứng lại', 'Refresh source and verify again'), () => action(rebase, runView, async () => { await api('/work/runs/' + encodeURIComponent(run.id) + '/rebase', {}); acceptWork(await api('/work')); renderTaskList(); })); details.append(rebase);
        }

        for (const [i, entry] of evidence.entries()) details.append(disclosure(t('Test ', 'Test ') + (i + 1) + ' · ' + (evidencePassed(entry) ? t('Đạt', 'Passed') : t('Không đạt', 'Failed')), node('pre', { class: 'ws-code' }, entry?.output || entry?.error || t('Không có đầu ra', 'No output'))));
        details.append(disclosure(t('Nhật ký và snapshot đầy đủ', 'Full logs and snapshot'), json(run)));
        runView.append(actions, details); card.append(index === 0 ? runView : disclosure(t('Lần chạy trước · ', 'Earlier attempt · ') + statusText(run.status), runView));
      }
      if (tab !== 'plan') for (const run of remoteRuns) renderRemoteRun(card, run);
      if (tab === 'tasks' && task.sourceCurrent !== false) {
        const help = disclosure(t('Hỗ trợ chọn agent', 'Agent selection help')); help.classList.add('ws-agent-help');
        const recommend = button(t('Đề xuất agent', 'Recommend agents'), () => action(recommend, help, async () => { help.querySelector('.ws-recommendation')?.remove(); help.append(node('div', {class:'ws-recommendation'}, json(await api('/routing/recommend', {taskId:task.id,writePaths:task.writePaths || []})))); }));
        help.append(recommend); card.append(help);
      }
      const tools = node('div', {class:'ws-task-tools'});
      const configure = card.querySelector('.ws-configure');
      if (configure) tools.append(configure);
      tools.append(source);
      const help = card.querySelector('.ws-agent-help'); if (help) tools.append(help);
      const nextStep = card.querySelector('.ws-next'); if (nextStep) tools.append(nextStep);
      if (tab === 'plan') { const next = card.querySelector('.ws-actions'); if (next) tools.append(next); }
      card.append(tools);
      list.append(card); renderedTasks++;
    }
    if (!renderedTasks) list.append(node('div', { class: 'ws-empty' }, node('h2', {}, t('Chưa có kết quả', 'No results yet')), node('p', {}, t('Kết quả xuất hiện sau khi một phiên chạy báo cáo.', 'Results appear when a run reports back.')), viewLink('execute', t('Mở Thực hiện →', 'Open Execute →'), true)));
    if (tab === 'results') { const measurements = disclosure(t('Số liệu phiên chạy', 'Run measurements')); renderMetrics(measurements); list.append(measurements); }
  }
  async function saveConfig(next) {
    config = await api('/config', { config: next, expectedRevision: config.revision });
    notify(t('Đã lưu cấu hình xuống kho ứng dụng. Quyết định mới dùng revision ', 'Configuration saved to application storage. New decisions use revision ') + config.revision);
    renderAdmin();
  }
  function renderAdmin() {
    $('shell').classList.add('admin'); $('sidebar').hidden = false;
    $('sidebar').replaceChildren(node('nav', { 'aria-label': t('Nhóm quản trị', 'Administration sections') }, [['models', t('Model & năng lực', 'Models & capabilities')], ['routing', t('Quy tắc chia việc', 'Routing policy')], ['runtime', t('Agent & runtime', 'Agents & runtimes')], ['hosts', t('Máy & workspace', 'Hosts & workspaces')], ['data', t('Dữ liệu & nguồn', 'Data & provenance')]].map(([id, label]) => node('button', { type: 'button', class: 'btn ghost', 'aria-current': adminTab === id ? 'page' : null, onclick: () => { adminTab = id; renderAdmin(); } }, label))));
    const page = $('page');
    const titles = { models: t('Model & năng lực', 'Models & capabilities'), routing: t('Quy tắc chia việc', 'Routing policy'), runtime: t('Agent & runtime', 'Agents & runtimes'), hosts: t('Máy & workspace', 'Hosts & workspaces'), data: t('Dữ liệu & nguồn', 'Data & provenance') };
    page.replaceChildren(node('header', { class: 'ws-view-heading ws-row between' }, node('div', {}, node('p', { class: 'ws-eyebrow' }, t('Quản trị', 'Administration')), node('h1', {}, titles[adminTab])), node('span', { class: 'ws-pill' }, t('Cấu hình v', 'Configuration v') + config.revision)));
    if (adminTab === 'models') renderModels(page);
    if (adminTab === 'routing') renderRouting(page);
    if (adminTab === 'runtime') renderRuntime(page);
    if (adminTab === 'hosts') renderHosts(page);
    if (adminTab === 'data') renderData(page);
  }
  function renderModels(page) {
    let search = '';
    const searchInput = node('input', { type: 'search', id: 'modelSearch', placeholder: t('Tên, provider, model ID…', 'Name, provider, model ID…') });
    const list = node('div', { class: 'ws-model-list', 'aria-label': t('Danh sách model', 'Models') });
    const detail = node('div');
    const filter = () => {
      const found = config.models.filter(m => [m.id, m.label, m.provider, m.providerModelId].join(' ').toLowerCase().includes(search));
      list.replaceChildren(...found.map(m => node('button', { type: 'button', class: 'btn ghost', 'aria-pressed': selectedModel === m.id, onclick: () => { selectedModel = m.id; filter(); editModel(detail, m); } }, m.label, node('small', {}, m.provider + ' · ' + (m.enabled ? t('đã bật', 'enabled') : t('đã tắt', 'disabled'))))));
      if (!found.length) list.append(node('p', { class: 'ws-empty' }, t('Không có model phù hợp.', 'No matching models.')));
    };
    searchInput.oninput = () => { search = searchInput.value.toLowerCase(); filter(); };
    page.append(node('div', { class: 'ws-row between' }, node('label', { class: 'ws-field', for: 'modelSearch' }, node('span', {}, t('Tìm model', 'Search models')), searchInput), button(t('Thêm model', 'Add model'), () => { selectedModel = null; filter(); editModel(detail, null); })), node('div', { class: 'ws-models' }, list, detail));
    filter(); const model = config.models.find(m => m.id === selectedModel) || config.models[0]; if (model) { selectedModel = model.id; filter(); editModel(detail, model); } else editModel(detail, null);
  }
  function editModel(detail, model) {
    const m = model || { id: '', label: '', provider: '', providerModelId: null, enabled: false, verification: 'unverified', capabilities: [], roles: [], modalities: ['text'], strengths: [], limitations: [], outputContract: [], costTier: 'medium', source: { kind: 'user-supplied', path: 'admin', lines: [], checkedAt: null, confidence: 'user-configured', references: [] } };
    const form = node('form', { class: 'ws-panel', novalidate: true });
    form.append(node('h2', {}, model ? m.label : t('Model mới', 'New model')), node('p', { class: 'ws-subtle' }, t('Năng lực do người dùng cấu hình không phải benchmark. Xác nhận model ID không xác minh quyền truy cập runtime.', 'User-configured capabilities are not benchmarks. Confirming a model ID does not verify runtime access.')),
      node('div', { class: 'ws-grid two' }, field(t('ID nội bộ', 'Internal ID'), 'modelId', m.id), field(t('Tên hiển thị', 'Display name'), 'modelLabel', m.label)),
      node('div', { class: 'ws-grid two' }, field('Provider', 'provider', m.provider), field(t('Model ID của provider/CLI', 'Provider/CLI model ID'), 'providerModelId', m.providerModelId || '')),
      field(t('Năng lực (phân cách bằng dấu phẩy)', 'Capabilities (comma separated)'), 'capabilities', m.capabilities.join(', ')),
      field(t('Thế mạnh (mỗi dòng một mục)', 'Strengths (one per line)'), 'strengths', m.strengths.join('\n'), '', 'textarea'),
      field(t('Hạn chế (mỗi dòng một mục)', 'Limitations (one per line)'), 'limitations', m.limitations.join('\n'), '', 'textarea'),
      selectField(t('Mức chi phí tương đối', 'Relative cost tier'), 'costTier', [['low', t('Thấp', 'Low')], ['medium', t('Trung bình', 'Medium')], ['high', t('Cao', 'High')]], m.costTier),
      node('label', { class: 'ws-check' }, node('input', { id: 'modelVerified', type: 'checkbox', checked: m.verification === 'verified' }), t('Tôi đã đối chiếu model ID với nguồn có ngày kiểm tra', 'I checked this model ID against a dated source')),
      field(t('Nguồn đối chiếu (URL hoặc vị trí tài liệu)', 'Verification source (URL or document location)'), 'modelSource', m.source.references?.[0] || ''),
      node('label', { class: 'ws-check' }, node('input', { id: 'modelEnabled', type: 'checkbox', checked: m.enabled }), t('Bật model trong catalog', 'Enable model in the catalog')),
      node('p', { class: 'ws-subtle' }, t('Thêm model không tạo adapter. Hồ sơ runtime phía dưới quản lý ánh xạ; quyền truy cập vẫn có thể chưa biết.', 'Adding a model does not create an adapter. Runtime profiles manage mappings; access can remain unknown.')));
    const capabilities = disclosure(t('Năng lực, thế mạnh và hạn chế', 'Capabilities, strengths and limitations'));
    for (const id of ['capabilities','strengths','limitations']) capabilities.append(form.querySelector('#' + id).closest('.ws-field'));
    form.querySelector('#costTier').closest('.ws-field').before(capabilities);
    if (model) form.querySelector('#modelId').readOnly = true;
    const save = node('button', { type: 'submit', class: 'btn primary' }, t('Lưu model', 'Save model')); form.append(save);
    form.onsubmit = event => { event.preventDefault();
      const required = ['modelId', 'modelLabel', 'provider'];
      const missing = required.find(id => !val(id));
      if (missing) { errorBox(form, new Error(t('Điền các trường ID, tên hiển thị và provider.', 'Enter an ID, display name and provider.')), missing); return; }
      if ($('modelEnabled').checked && (!$('modelVerified').checked || !val('providerModelId'))) { errorBox(form, new Error(t('Để bật model, cần model ID đã đối chiếu và nguồn kiểm tra.', 'Enabling a model requires a checked model ID and verification source.')), 'providerModelId'); return; }
      if ($('modelVerified').checked && !val('modelSource')) { errorBox(form, new Error(t('Nhập nguồn trước khi xác nhận model ID.', 'Enter a source before confirming this model ID.')), 'modelSource'); return; }
      action(save, form, async () => {
        const next = structuredClone(config);
        const changed = { ...m, id: val('modelId'), label: val('modelLabel'), provider: val('provider'), providerModelId: val('providerModelId') || null, enabled: $('modelEnabled').checked, verification: $('modelVerified').checked ? 'verified' : 'unverified', capabilities: csv(val('capabilities')), strengths: split(val('strengths')), limitations: split(val('limitations')), costTier: val('costTier'), source: { ...m.source, kind: 'user-supplied', confidence: 'user-configured', checkedAt: $('modelVerified').checked ? new Date().toISOString() : null, references: val('modelSource') ? [val('modelSource'), ...(m.source.references || []).slice(1)] : [] } };
        if (!model && next.models.some(x => x.id === changed.id)) throw new Error(t('ID model đã tồn tại.', 'This model ID already exists.'));
        if (model) next.models[next.models.findIndex(x => x.id === model.id)] = changed; else next.models.push(changed);
        selectedModel = changed.id; await saveConfig(next);
      });
    };
    detail.replaceChildren(form);
  }
  function renderRouting(page) {
    const p = config.policy;
    const form = node('form', { class: 'ws-panel', novalidate: true }, node('h2', {}, t('Quy tắc chia việc', 'Routing policy')),
      selectField(t('Hồ sơ trưởng nhóm', 'Lead profile'), 'leadProfileId', [['', t('Chưa chọn', 'Not selected')], ...config.profiles.map(x => [x.id, x.label])], p.leadProfileId || ''),
      field(t('Số ứng viên tối đa (1–5)', 'Maximum candidates (1–5)'), 'maxCandidates', p.maxCandidates),
      field(t('Điều kiện bắt buộc review (mỗi dòng một mục)', 'Required review conditions (one per line)'), 'reviewRequiredFor', p.reviewRequiredFor.join('\n'), '', 'textarea'),
      selectField(t('Ngân sách: mức chi phí tối đa', 'Budget: maximum cost tier'), 'maxCostTier', [['', t('Chưa giới hạn', 'No tier limit')], ['low', t('Thấp', 'Low')], ['medium', t('Trung bình', 'Medium')], ['high', t('Cao', 'High')]], p.budget.maxCostTier || ''),
      node('p', { class: 'ws-subtle' }, t('Các quy tắc bảo toàn bằng chứng, context, fallback và chống sửa đè vẫn được giữ khi lưu.', 'Evidence, context retention, fallback and write isolation rules are preserved when saving.')));
    $('page').append(form); $('maxCandidates').type = 'number'; $('maxCandidates').min = '1'; $('maxCandidates').max = '5';
    const save = node('button', { type: 'submit', class: 'btn primary' }, t('Lưu quy tắc', 'Save policy')); form.append(save);
    form.onsubmit = event => { event.preventDefault(); const max = Number(val('maxCandidates')); if (!Number.isInteger(max) || max < 1 || max > 5) { errorBox(form, new Error(t('Số ứng viên phải là số nguyên từ 1 đến 5.', 'Maximum candidates must be an integer from 1 to 5.')), 'maxCandidates'); return; } action(save, form, async () => { const next = structuredClone(config); Object.assign(next.policy, { leadProfileId: val('leadProfileId') || null, maxCandidates: max, reviewRequiredFor: split(val('reviewRequiredFor')), budget: { ...p.budget, maxCostTier: val('maxCostTier') || null } }); await saveConfig(next); }); };
  }
  function renderRuntime(page) {
    const viewedRevision = config.revision;
    const refresh = button(t('Kiểm tra runtime', 'Check runtimes'), () => action(refresh, page, async () => { const result = await api('/runtime'); runtime = Array.isArray(result) ? result : [...(result.observations || []), ...(result.checks || [])]; renderRuntimeObservations(); notify(t('Đã cập nhật quan sát runtime. Có executable không đồng nghĩa có quyền truy cập model.', 'Runtime observations updated. An executable does not establish model access.')); }));
    const diagnostics = disclosure(t('Dữ liệu chẩn đoán', 'Diagnostic data'), json(runtime)); diagnostics.id = 'runtimeDiagnostics';
    page.append(node('section', { class: 'ws-panel', id: 'runtimeObservations' },
      node('div', { class: 'ws-row between' }, node('h2', {}, t('Runtime trên máy', 'Local runtimes')), refresh),
      node('div', { id: 'runtimeChecks' }), diagnostics),
      node('h2', { class: 'ws-runtime-heading' }, t('Hồ sơ model / runtime', 'Model / runtime profiles')),
      node('p', { class: 'ws-subtle' }, t('Probe gọi model thật và có thể phát sinh phí CLI; timeout 60 giây. Quan sát truy cập có hạn 30 phút.', 'Probing invokes the actual model and may use your CLI budget; timeout 60 seconds. Access observations expire after 30 minutes.')));
    for (const profile of config.profiles) {
      const model = config.models.find(m => m.id === profile.modelId), adapter = config.runtimes.find(r => r.id === profile.runtimeId);
      const mapping = disclosure(t('Sửa ánh xạ', 'Edit mapping'), node('p', { class: 'ws-meta' }, profile.id),
        selectField(t('Model', 'Model'), 'model-' + profile.id, config.models.map(m => [m.id, m.label]), profile.modelId),
        selectField(t('Runtime / adapter', 'Runtime / adapter'), 'runtime-' + profile.id, config.runtimes.map(r => [r.id, r.label]), profile.runtimeId),
        node('label', { class: 'ws-check' }, node('input', { type: 'checkbox', id: 'enabled-' + profile.id, checked: profile.enabled }), t('Bật hồ sơ', 'Enable profile')));
      mapping.firstElementChild.id = 'mapping-toggle-' + profile.id;
      mapping.firstElementChild.setAttribute('aria-label', t('Sửa ánh xạ: ', 'Edit mapping: ') + profile.label);
      const form = node('form', { class: 'ws-panel ws-runtime-profile', novalidate: true },
        node('div', { class: 'ws-row between' }, node('h3', {}, profile.label), node('span', { class: 'ws-pill' }, profile.enabled ? t('Đã bật', 'Enabled') : t('Đã tắt', 'Disabled'))),
        node('p', { class: 'ws-meta' }, (model?.providerModelId || t('Chưa đặt model ID', 'Model ID not set')) + ' · ' + (adapter?.label || profile.runtimeId)),
        node('div', { id: 'access-' + profile.id, class: 'ws-access' }));
      const save = node('button', { type: 'submit', class: 'btn ghost' }, t('Lưu ánh xạ', 'Save mapping')); mapping.append(save);
      form.onsubmit = event => { event.preventDefault(); action(save, form, async () => { const next = structuredClone(config); const p = next.profiles.find(x => x.id === profile.id); p.modelId = val('model-' + profile.id); p.runtimeId = val('runtime-' + profile.id); p.enabled = $('enabled-' + profile.id).checked; await saveConfig(next); $('mapping-toggle-' + profile.id)?.focus(); }); };
      const probe = button('', async () => {
        renderProbeButton(profile.id); if (probe.disabled) return;
        probingProfiles.add(profile.id); renderProbeButton(profile.id);
        try { await action(probe, form, async () => {
          const observation = await api('/runtime/probe', { profileId: profile.id, expectedConfigRevision: viewedRevision }); const result = await api('/runtime'); runtime = Array.isArray(result) ? result : [...(result.observations || []), ...(result.checks || [])]; renderRuntimeObservations();
          notify(observation.stale ? t('Cấu hình đã đổi; quan sát cũ chưa được áp dụng. Kiểm tra ánh xạ hiện tại trước khi probe lại.', 'Configuration changed; the old observation was not applied. Review the current mapping before probing again.') : t('Đã ghi quan sát truy cập model.', 'Model access observation recorded.'));
        }); } finally { probingProfiles.delete(profile.id); renderProbeButton(profile.id); }
      });
      probe.id = 'probe-' + profile.id;
      probe.dataset.model = profile.modelId; probe.dataset.runtime = profile.runtimeId; probe.dataset.enabled = String(profile.enabled);
      form.onchange = () => renderProbeButton(profile.id);
      form.append(probe, mapping); page.append(form); renderProbeButton(profile.id);
    }
    renderRuntimeObservations();
  }
  function renderProbeButton(profileId) {
    const probe = $('probe-' + profileId); if (!probe) return;
    const pending = probingProfiles.has(profileId), dirty = $('model-' + profileId).value !== probe.dataset.model || $('runtime-' + profileId).value !== probe.dataset.runtime || String($('enabled-' + profileId).checked) !== probe.dataset.enabled;
    const profile = config.profiles.find(p => p.id === profileId), model = config.models.find(m => m.id === profile?.modelId);
    const ready = profile?.enabled && model?.enabled && model.verification === 'verified' && model.providerModelId;
    probe.disabled = pending || dirty || !ready;
    probe.textContent = pending ? t('Đang kiểm tra truy cập model…', 'Probing model access…') : dirty ? t('Lưu ánh xạ trước khi kiểm tra truy cập', 'Save mapping before probing') : !ready ? t('Bật và xác minh model trước', 'Enable and verify model first') : t('Kiểm tra truy cập model (gọi CLI thật)', 'Probe model access (invokes the CLI)');
  }
  function renderRuntimeObservations() {
    const panel = $('runtimeObservations'); if (!panel) return;
    const checks = runtime.filter(o => !o.profileId), list = $('runtimeChecks');
    list.replaceChildren(...(checks.length ? checks.map(o => node('p', { class: 'ws-runtime-check' }, node('strong', {}, o.adapter),
      node('span', {}, o.executable ? (o.version || t('Có executable', 'Executable found')) : t('Không tìm thấy executable', 'Executable not found')))) : [node('p', { class: 'ws-subtle' }, t('Chưa kiểm tra executable ở màn hình này.', 'Executable checks have not been loaded here.'))]),
      node('p', { class: 'ws-subtle' }, t('Có executable chưa chứng minh truy cập model. Xem quan sát trên từng hồ sơ.', 'An executable does not establish model access. See each profile’s observation.')));
    // Keep the disclosure and its summary mounted across late probe responses.
    panel.querySelector('pre').textContent = JSON.stringify(runtime, null, 2);
    for (const profile of config.profiles) {
      const target = $('access-' + profile.id); if (!target) continue;
      const model = config.models.find(m => m.id === profile.modelId), observed = runtime.find(o => o.profileId === profile.id);
      const age = Date.now() - Date.parse(observed?.checkedAt);
      const current = observed && observed.configRevision === config.revision && observed.runtimeId === profile.runtimeId && observed.providerModelId === model?.providerModelId && age >= 0 && age < 30 * 60000;
      let label = t('Truy cập chưa kiểm tra', 'Access untested'), status = '';
      if (observed && !current) { label = t('Quan sát đã cũ; kiểm tra lại', 'Observation stale; check again'); status = 'stale'; }
      else if (current && observed.available !== true) { label = t('Probe thất bại', 'Probe failed'); status = 'failed'; }
      else if (current && observed.modelVerified === true && observed.reportedModel === model?.providerModelId) { label = t('Đã đối chiếu model', 'Model matched'); status = 'verified'; }
      else if (current) { label = t('Model chưa xác nhận', 'Model unconfirmed'); status = 'stale'; }
      target.replaceChildren(node('span', { class: 'ws-pill', 'data-status': status }, label));
      if (observed) target.append(node('p', { class: 'ws-meta' }, t('Model báo lại: ', 'Reported model: ') + (observed.reportedModel || 'unknown') + ' · ' + observed.checkedAt));
      if (observed?.error) target.append(node('p', { class: 'ws-subtle' }, friendlyError(observed.error)));
    }
  }
  async function loadAuxiliary() {
    const results = await Promise.allSettled([api('/remote'), api('/metrics')]);
    if (results[0].status === 'fulfilled') { remote = results[0].value; remoteError = null; }
    else remoteError = results[0].reason;
    if (results[1].status === 'fulfilled') { metrics = results[1].value; metricsError = null; }
    else metricsError = results[1].reason;
  }
  function renderMetrics(container) {
    const panel = node('section', { class: 'ws-panel' }, node('h2', {}, t('Đo lường kết quả', 'Result measurements')),
      node('p', { class: 'ws-subtle' }, t('Chi phí null là chưa biết. Báo cáo của agent, kiểm chứng và tích hợp được đếm riêng; số liệu không tự xếp hạng model.', 'Null cost means unknown. Agent reports, verification and integration are counted separately; measurements do not automatically rank models.')));
    if (metricsError) panel.append(node('p', { class: 'ws-warning' }, t('Chưa tải được số liệu. Dùng Làm mới để thử lại.', 'Measurements could not be loaded. Choose Refresh to retry.')));
    else if (metrics) {
      const summary = metrics.summary || metrics;
      panel.append(node('p', {}, t('Phiên chạy: ', 'Runs: ') + summary.attempts + ' · ' + t('Đã kiểm chứng: ', 'Verified: ') + summary.independentlyVerifiedRuns + ' · ' + t('Đã tích hợp: ', 'Integrated: ') + summary.acceptedRuns),
        node('details', {}, node('summary', {}, t('Chi tiết số liệu', 'Measurement details')), json(summary)));
    }
    else panel.append(node('p', {}, t('Chưa có số liệu.', 'No measurements yet.')));
    container.append(panel);
  }
  function hostOptions() {
    return [['', t('Chọn worker', 'Select a worker')], ...(remote.hosts || []).map(host => [host.id, host.label + ' · ' + host.workspaceId + ' · ' + (Date.now() - host.lastSeen < 60000 ? t('vừa kết nối', 'recently connected') : t('chưa thấy gần đây', 'not recently seen'))])];
  }
  function renderRemoteQueue(card, task) {
    const profileId = 'remote-profile-' + task.id, hostId = 'remote-host-' + task.id;
    const profiles = (config.profiles || []).filter(p => p.enabled);
    card.append(node('p', { class: 'ws-warning' }, t('Xếp hàng cấp task cho worker đã đăng ký. Worker cần chạy riêng và tự kiểm tra quyền/model; kết quả từ xa chưa được nghiệm thu tự động.', 'Queueing assigns the task to a registered worker. The worker must run separately and check its own permissions/model; remote results are not automatically accepted.')),
      selectField(t('Hồ sơ từ xa', 'Remote profile'), profileId, [['', t('Chọn hồ sơ', 'Select a profile')], ...profiles.map(p => [p.id, p.label])], ''),
      selectField(t('Máy / workspace nhận việc', 'Worker / workspace'), hostId, hostOptions(), ''));
    const queue = button(t('Xếp hàng cho worker', 'Queue for worker'), () => action(queue, card, async () => {
      if (!val(profileId) || !val(hostId)) throw new Error(t('Chọn hồ sơ và worker trước khi xếp hàng.', 'Select a profile and worker before queueing.'));
      await api('/remote/queue', { taskId: task.id, profileId: val(profileId), hostId: val(hostId) });
      remote = await api('/remote'); renderTaskList(); notify(t('Đã xếp hàng. Worker chưa được xác nhận đã bắt đầu chạy.', 'Queued. Worker execution has not yet been confirmed.'));
    }), true);
    queue.disabled = remoteError !== null || !profiles.length || !(remote.hosts || []).length;
    card.append(node('div', { class: 'ws-actions' }, queue));
  }
  function renderRemoteRun(card, run) {
    const id = run.runId || run.id;
    const panel = node('section', { class: 'ws-task' }, node('h4', {}, t('Phiên từ xa ', 'Remote run ') + id),
      node('span', { class: 'ws-pill' }, statusText(run.status)), node('p', { class: 'ws-meta' }, t('Máy: ', 'Host: ') + run.hostId + ' · ' + t('Thế hệ: ', 'Generation: ') + run.generation),
      node('p', { class: 'ws-subtle' }, t('Trạng thái worker và artifact không thay thế kiểm chứng độc lập. Mất lease không xác nhận tiến trình cũ đã dừng.', 'Worker status and artifacts do not replace independent verification. A lost lease does not confirm that the old process stopped.')),
      node('details', {}, node('summary', {}, t('Lease, artifact và báo cáo worker', 'Lease, artifacts and worker report')), json(run)));
    for (const artifact of run.result?.artifacts || []) if (artifact.size != null) panel.append(node('a', { class: 'btn ghost', href: base + '/remote/artifact?runId=' + encodeURIComponent(id) + '&name=' + encodeURIComponent(artifact.name) + '&generation=' + run.generation }, t('Tải artifact chưa kiểm chứng: ', 'Download unverified artifact: ') + artifact.name));
    if (tab === 'tasks' && ['lost', 'failed', 'cancelled'].includes(run.status)) {
      const hostId = 'reassign-host-' + id;
      panel.append(selectField(t('Worker nhận lại', 'Reassignment worker'), hostId, hostOptions(), ''));
      const retry = button(t('Giao lại — không xác nhận đã dừng phiên cũ', 'Reassign — old process stop is unconfirmed'), () => action(retry, panel, async () => {
        if (!val(hostId)) throw new Error(t('Chọn worker để giao lại.', 'Select a worker for reassignment.'));
        await api('/remote/reassign', { runId: id, hostId: val(hostId) }); remote = await api('/remote'); renderTaskList();
      }));
      retry.disabled = remoteError !== null || !(remote.hosts || []).length; panel.append(retry);
    }
    card.append(panel);
  }
  function renderData(page) {
    const panel = node('section', { class: 'ws-panel' }, node('h2', {}, t('Nguồn và hợp đồng bàn giao', 'Provenance and handoff contract')),
      node('p', {}, t('Cấu hình lưu trên server, tách khỏi package. Tệp xuất có thể chứa mô tả nội bộ; quyền worker không nằm trong bản xuất này.', 'Configuration is stored on the server separately from the package. Exports may contain internal descriptions; worker credentials are excluded.')),
      button(t('Xuất cấu hình JSON', 'Export configuration JSON'), () => { const url = URL.createObjectURL(new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })); const a = node('a', { href: url, download: 'agent-meeting-routing.json' }); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }),
      json({ schema: config.schema, revision: config.revision, source: config.source, handoff: config.handoff }));
    const form = node('form', { class: 'ws-panel', novalidate: true }, node('h2', {}, t('Nhập cấu hình JSON', 'Import configuration JSON')),
      node('p', { class: 'ws-subtle' }, t('Chọn tệp để xem và sửa trước khi lưu. Server kiểm tra schema và revision; lỗi giữ nguyên bản đang nhập.', 'Choose a file to inspect and edit before saving. The server validates schema and revision; errors retain your import draft.')),
      node('label', { class: 'ws-field', for: 'configImportFile' }, node('span', {}, t('Tệp JSON (tối đa 512 KiB)', 'JSON file (up to 512 KiB)')), node('input', { id: 'configImportFile', type: 'file', accept: '.json,application/json' })),
      field(t('Nội dung cấu hình', 'Configuration contents'), 'configImportDraft', importDraft, '', 'textarea'));
    const submit = node('button', { type: 'submit', class: 'btn primary' }, t('Kiểm tra và lưu cấu hình nhập', 'Validate and save imported configuration'));
    form.append(submit); page.append(panel, form);
    $('configImportDraft').oninput = event => { importDraft = event.target.value; };
    $('configImportFile').onchange = () => action(submit, form, async () => {
      const file = $('configImportFile').files[0]; if (!file) return;
      if (file.size > 512 * 1024) throw new Error(t('Tệp vượt quá 512 KiB.', 'The file exceeds 512 KiB.'));
      importDraft = await file.text(); $('configImportDraft').value = importDraft;
      try { JSON.parse(importDraft); } catch { throw new Error(t('JSON chưa hợp lệ. Sửa nội dung bên dưới rồi lưu lại.', 'The JSON is invalid. Edit the contents below and save again.')); }
    });
    form.onsubmit = event => { event.preventDefault(); action(submit, form, async () => {
      importDraft = $('configImportDraft').value;
      if (new Blob([importDraft]).size > 512 * 1024) throw new Error(t('Cấu hình vượt quá 512 KiB.', 'Configuration exceeds 512 KiB.'));
      let imported; try { imported = JSON.parse(importDraft); } catch { throw new Error(t('JSON chưa hợp lệ. Bản đang nhập được giữ lại.', 'Invalid JSON. Your import draft is retained.')); }
      if (!imported || imported.schema !== config.schema) throw new Error(t('Schema cấu hình không được hỗ trợ.', 'Unsupported configuration schema.'));
      await saveConfig(imported); importDraft = ''; $('configImportDraft').value = '';
    }); };
    const reset = node('form', { class: 'ws-panel', novalidate: true }, node('h2', {}, t('Khôi phục mặc định theo nhóm', 'Restore group defaults')),
      node('p', { class: 'ws-warning' }, t('Nhóm được chọn sẽ được thay bằng mặc định đóng gói. Bản lưu trước có backup; các run đang chạy giữ snapshot cũ.', 'The selected group is replaced with packaged defaults. The previous save is backed up; active runs retain their existing snapshot.')),
      selectField(t('Nhóm cần khôi phục', 'Group to restore'), 'resetGroup', [['models', t('Model & năng lực', 'Models & capabilities')], ['policy', t('Quy tắc chia việc', 'Routing policy')], ['runtimes', t('Runtime', 'Runtimes')]], 'policy'));
    const restore = node('button', { type: 'submit', class: 'btn ghost' }, t('Khôi phục nhóm đã chọn', 'Restore selected group')); reset.append(restore);
    reset.onsubmit = event => { event.preventDefault(); action(restore, reset, async () => { config = await api('/config/reset', { group: val('resetGroup'), expectedRevision: config.revision }); renderAdmin(); notify(t('Đã khôi phục nhóm mặc định.', 'Group defaults restored.')); }); };
    page.append(reset);
  }
  function renderHosts(page) {
    const refresh = button(t('Làm mới máy và lease', 'Refresh hosts and leases'), () => action(refresh, page, async () => { remote = await api('/remote'); remoteError = null; renderAdmin(); }));
    page.append(node('div', { class: 'ws-row between' }, node('h2', {}, t('Máy & workspace', 'Hosts & workspaces')), refresh),
      node('p', { class: 'ws-warning' }, t('Máy đăng ký không tự trở thành runtime. Token chỉ cấp quyền pull/heartbeat/report cho máy đó. Người vận hành phải cấu hình và khởi động worker riêng.', 'An enrolled host does not automatically become a runtime. Its token authorizes host-scoped pull/heartbeat/report. An operator must configure and start its worker separately.')));
    if (remoteError) page.append(node('p', { class: 'ws-error', role: 'alert' }, remoteError.message));
    const hosts = node('section', { class: 'ws-panel' });
    const drawHosts = () => {
      hosts.replaceChildren(node('h3', {}, t('Máy đã đăng ký', 'Enrolled hosts')));
      if (!(remote.hosts || []).length) { hosts.append(node('p', { class: 'ws-empty' }, t('Chưa có máy. Đăng ký bên dưới rồi chạy worker trên máy tương ứng.', 'No hosts yet. Enroll below, then start the worker on that machine.'))); return; }
      hosts.append(node('table', { width: '100%', class: 'ws-task' }, node('caption', {}, t('Workspace và revision do worker khai báo', 'Worker-declared workspace and revision')),
        node('thead', {}, node('tr', {}, [t('Máy', 'Host'), 'Workspace', t('Base revision', 'Base revision'), t('Lần thấy gần nhất', 'Last seen')].map(text => node('th', { scope: 'col' }, text)))),
        node('tbody', {}, remote.hosts.map(host => node('tr', {}, node('td', {}, host.label, node('p', { class: 'ws-meta' }, host.id)), node('td', {}, host.workspaceId), node('td', {}, host.baseRevision), node('td', {}, Number.isFinite(host.lastSeen) ? new Date(host.lastSeen).toLocaleString(lang) : t('Chưa biết', 'Unknown')))))));
    };
    drawHosts(); page.append(hosts);
    const form = node('form', { class: 'ws-panel', novalidate: true }, node('h3', {}, t('Đăng ký worker', 'Enroll worker')),
      field(t('Tên máy', 'Host label'), 'hostLabel'), field('Workspace ID', 'hostWorkspaceId'), field('Base revision', 'hostBaseRevision'),
      selectField(t('Adapter được phép', 'Allowed adapter'), 'hostAdapter', [['claude', 'Claude CLI'], ['agy', 'Antigravity CLI']], 'claude'),
      field(t('Năng lực bổ sung (mỗi dòng một mục)', 'Additional capabilities (one per line)'), 'hostCapabilities', '', '', 'textarea'),
      node('h4', {}, t('Cấu hình riêng trên máy worker', 'Private configuration on the worker machine')),
      field(t('Origin coordinator worker truy cập được', 'Coordinator origin reachable by the worker'), 'workerServerUrl', location.origin, t('HTTPS khi khác máy; HTTP chỉ cho loopback.', 'HTTPS across machines; HTTP only for loopback.')),
      field(t('Checkout Git trên máy worker (đường dẫn tuyệt đối)', 'Git checkout on worker (absolute path)'), 'workerWorkspace'),
      field(t('Thư mục dữ liệu worker, ngoài checkout', 'Worker data directory, outside checkout'), 'workerWorkDir'),
      field(t('Model ID được phép (mỗi dòng một ID chính xác)', 'Allowed model IDs (one exact ID per line)'), 'workerAllowedModels', '', t('Chọn rõ model provider/CLI mà người vận hành cho phép. Không tự cho phép mọi model.', 'Specify the provider/CLI models approved by the operator. Models are never all allowed automatically.'), 'textarea'));
    const output = node('section', { 'aria-live': 'polite' });
    const enroll = node('button', { type: 'submit', class: 'btn primary' }, t('Đăng ký và tạo token một lần', 'Enroll and reveal token once')); form.append(enroll); page.append(form, output);
    form.onsubmit = event => { event.preventDefault(); action(enroll, form, async () => {
      const missing = ['hostLabel', 'hostWorkspaceId', 'hostBaseRevision', 'workerServerUrl', 'workerWorkspace', 'workerWorkDir', 'workerAllowedModels'].find(id => !val(id));
      if (missing) { errorBox(form, new Error(t('Điền thông tin máy và cấu hình worker, gồm model ID được phép.', 'Complete host and worker configuration, including the allowed model IDs.')), missing); return; }
      const selectedAdapter = val('hostAdapter'), workerWorkspace = val('workerWorkspace'), workerWorkDir = val('workerWorkDir'), allowedModels = split(val('workerAllowedModels'));
      const absolute = value => value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value);
      if (!absolute(workerWorkspace) || !absolute(workerWorkDir)) throw new Error(t('Workspace và thư mục dữ liệu worker phải là đường dẫn tuyệt đối.', 'Worker workspace and data directory must be absolute paths.'));
      if (workerWorkDir === workerWorkspace || workerWorkDir.startsWith(workerWorkspace.replace(/[\\/]$/, '') + '/')) throw new Error(t('Thư mục dữ liệu worker phải nằm ngoài checkout.', 'Worker data directory must be outside the checkout.'));
      const coordinator = new URL(val('workerServerUrl'));
      if (!['https:', 'http:'].includes(coordinator.protocol) || coordinator.username || coordinator.password || coordinator.pathname !== '/' || coordinator.search || coordinator.hash) throw new Error(t('Nhập origin coordinator, không có path hoặc thông tin đăng nhập.', 'Enter the coordinator origin without a path or credentials.'));
      if (coordinator.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(coordinator.hostname)) throw new Error(t('Worker khác máy cần origin HTTPS.', 'A worker on another machine requires an HTTPS origin.'));
      if (allowedModels.length > 40 || allowedModels.some(id => id.length > 400)) throw new Error(t('Tối đa 40 model ID, mỗi ID tối đa 400 ký tự.', 'Use at most 40 model IDs, each up to 400 characters.'));
      const result = await api('/remote/enroll', { label: val('hostLabel'), workspaceId: val('hostWorkspaceId'), baseRevision: val('hostBaseRevision'), capabilities: [...new Set([val('hostAdapter'), ...split(val('hostCapabilities'))])] });
      // Credentials live only in this reveal panel, never localStorage or logs.
      const credential = { serverUrl: coordinator.origin, hostId: result.host.id, token: result.token, workspace: workerWorkspace, workspaceId: result.host.workspaceId, workDir: workerWorkDir, allowedModels, adapters: [selectedAdapter] };
      const copy = button(t('Sao chép thông tin worker', 'Copy worker credentials'), () => action(copy, output, async () => {
        if (!navigator.clipboard?.writeText) throw new Error(t('Clipboard chưa khả dụng. Chọn và sao chép JSON đang hiển thị.', 'Clipboard is unavailable. Select and copy the displayed JSON.'));
        await navigator.clipboard.writeText(JSON.stringify(credential, null, 2)); notify(t('Đã sao chép. Lưu trong tệp cấu hình worker riêng tư.', 'Copied. Save in a private worker configuration file.'));
      }));
      output.replaceChildren(node('div', { class: 'ws-panel' }, node('h3', {}, t('Token chỉ hiển thị lần này', 'Token is shown only now')),
        node('p', { class: 'ws-warning' }, t('Lưu token vào cấu hình worker riêng tư (quyền 600). Rời hoặc làm mới màn hình sẽ xóa bản hiển thị này; server chỉ giữ hash.', 'Save this token in a private worker configuration (mode 600). Leaving or refreshing removes this view; the server stores only its hash.')),
        json(credential), copy, node('p', {}, t('Lưu JSON này vào tệp quyền 600 trên máy worker. Lệnh dưới đây nhận tối đa một task rồi thoát; không chạy nền hoặc liên tục. Worker tự đăng ký base revision/snapshot thật của checkout.', 'Save this JSON in a mode-600 file on the worker machine. The command below claims at most one task and exits; it does not run as a daemon. The worker registers the actual checkout base revision/snapshot.')),
        node('pre', { class: 'ws-code' }, 'node bin/worker.js --config /absolute/path/worker.json --once'),
        button(t('Ẩn token', 'Hide token'), () => output.replaceChildren())));
      // Show the secret before refreshing public metadata, so a failed refresh cannot lose it.
      try { remote = await api('/remote'); remoteError = null; drawHosts(); } catch (error) { errorBox(form, error); }
    }); };
    if ((remote.runs || []).length) page.append(node('section', { class: 'ws-panel' }, node('h3', {}, t('Phân công và lease từ xa', 'Remote assignments and leases')), json(remote.runs)));
  }

  let loaded = false, loading = false;
  const workVisitedKey = 'agent-meeting:' + hostKey + ':work-opened';
  const workWasVisited = () => { try { return localStorage.getItem(workVisitedKey) === '1'; } catch { return false; } };
  async function load() {
    if (loading) return;
    loading = true;
    const page = $('page'); page.replaceChildren(node('p', { role: 'status' }, t('Đang tải dữ liệu phiên…', 'Loading session data…')));
    try { config = await api('/config'); if (admin) { await loadAuxiliary(); renderAdmin(); } else { await Promise.all([api('/work').then(acceptWork), loadAuxiliary()]); renderDaily(); } loaded = true; if (!admin) try { localStorage.setItem(workVisitedKey, '1'); } catch {} }
    catch (error) { page.replaceChildren(...heading(t('Không tải được dữ liệu', 'Could not load data'), t('Kiểm tra kết nối và quyền chủ trì local. Bản nháp task đã lưu trong trình duyệt được giữ lại.', 'Check the connection and local host capability. Saved task drafts are retained in this browser.'))); errorBox(page, error); page.append(button(t('Thử lại', 'Retry'), load)); }
    finally { loading = false; }
  }
  if (embedded) {
    document.querySelector('.skip-link').onclick = event => { event.preventDefault(); $('sessionNav').querySelector('a')?.focus(); };
    let navigationVersion = 0;
    let pollTimer, pollEtag = '', pollBusy = false, pollFailures = 0;
    const workVisible = () => !document.hidden && ['#plan', '#execute', '#results'].includes(location.hash);
    const signature = (data, workers) => JSON.stringify([data.tasks, data.runs, data.session, data.metrics, workers]);
    function schedulePoll(delay = 3000) { clearTimeout(pollTimer); pollTimer = setTimeout(pollWork, delay); }
    async function pollWork() {
      if (pollBusy) return;
      if (!loaded || loading || activeWorkReads || !workVisible()) { schedulePoll(); return; }
      const nav = navigationVersion, read = workReadVersion;
      pollBusy = true; pollController = new AbortController();
      const deadline = setTimeout(() => pollController?.abort(), 10000);
      try {
        const response = await fetch(base + '/work', { headers: pollEtag ? { 'If-None-Match': pollEtag } : {}, signal: pollController.signal });
        if (response.status !== 304 && !response.ok) throw new Error('Work update failed');
        if (response.status !== 304) {
          const next = await response.json();
          const workersResponse = await fetch(base + '/remote', { signal: pollController.signal });
          if (!workersResponse.ok) throw new Error('Worker update failed');
          const workers = await workersResponse.json();
          if (nav !== navigationVersion || read !== workReadVersion || !workVisible()) return;
          pollEtag = response.headers.get('etag') || '';
          pendingWork = signature(next, workers) === signature(work, remote) ? null : { work: next, remote: workers };
        }
        if (nav !== navigationVersion || read !== workReadVersion || !workVisible()) return;
        pollFailures = 0; syncState = 'live'; applyWorkUpdate(); renderSyncStatus();
      } catch {
        if (nav === navigationVersion && read === workReadVersion && workVisible()) { syncState = 'offline'; pollFailures++; renderSyncStatus(); }
      } finally {
        clearTimeout(deadline); pollController = null; pollBusy = false;
        schedulePoll(Math.min(30000, 3000 * 2 ** Math.min(pollFailures, 4)));
      }
    }
    const navigate = async () => {
      const request = ++navigationVersion;
      pendingWork = null; pollEtag = '';
      const hash = location.hash, active = ['#plan','#execute','#results'].includes(hash);
      $('workView').hidden = !active;
      for (const a of $('sessionNav').querySelectorAll('a[href^="#"]')) { if (a.hash === hash || a.hash === '#conversation' && !active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
      const view = active ? hash.slice(1) : 'conversation';
      $('sessionAdmin').href = meetingUrl + '/admin?view=' + view + '&lang=' + lang;
      document.body.dataset.sessionView = view;
      if (!active) return;
      tab = hash === '#execute' ? 'tasks' : hash.slice(1);
      if (!loaded) { await load(); if (request === navigationVersion) $('workView').scrollTop = 0; }
      else { try { const next = await api('/work'); if (request !== navigationVersion || location.hash !== hash) return; acceptWork(next); renderDaily(); $('workView').scrollTop = 0; } catch (error) { errorBox($('page'), error); } }
    };
    let summaryVersion = null, summaryBusy = false;
    window.addEventListener('am-meeting-state', async event => {
      if ((!loaded && !workWasVisited()) || !event.detail.actions.length || summaryBusy || summaryVersion === event.detail.version) return;
      summaryBusy = true;
      try { await api('/work'); summaryVersion = event.detail.version; } catch {} finally { summaryBusy = false; }
    });
    window.addEventListener('hashchange', navigate);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pollController?.abort(); else schedulePoll(0); });
    window.addEventListener('pagehide', () => { clearTimeout(pollTimer); pollController?.abort(); });
    window.addEventListener('pageshow', () => schedulePoll(0));
    navigate();
    schedulePoll();
  } else load();
})();
