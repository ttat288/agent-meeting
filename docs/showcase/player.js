'use strict';
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
let manifest, index = Math.max(0, Math.min(9, Number(params.get('scene')) || 0)), playing = false, timer, generation = 0;
if (params.get('presentation') === '1') document.body.classList.add('presentation');
const language = new URLSearchParams(location.search).get('lang') === 'vi' ? 'vi' : 'en';
$('language').value = language;
const t = (en, vi) => $('language').value === 'vi' ? vi : en;
function pause() { playing = false; clearTimeout(timer); $('play').textContent = t('Play walkthrough', 'Phát demo'); $('play').setAttribute('aria-pressed', 'false'); }
function render() {
  const frame = manifest.frames[index], file = String(index).padStart(3, '0') + '_' + frame.tag + '.png';
  $('scene').src = $('language').value + '/' + file; $('scene').alt = frame.title;
  $('caption').textContent = frame.title; $('counter').textContent = (index + 1) + ' / ' + manifest.frames.length;
  $('seek').value = index; $('seek').setAttribute('aria-valuetext', frame.title);
  $('previous').disabled = index === 0; $('next').disabled = index === manifest.frames.length - 1;
  if (playing) timer = setTimeout(() => { if (index + 1 === manifest.frames.length) pause(); else { index++; render(); } }, frame.duration);
}
async function load() {
  pause(); const current = ++generation;
  try {
    const response = await fetch($('language').value + '/manifest.json'); if (!response.ok) throw Error('HTTP ' + response.status);
    const data = await response.json(); if (current !== generation) return; manifest = data;
    document.documentElement.lang = $('language').value;
    $('headline').textContent = t('From a question to a plan.', 'Từ câu hỏi đến kế hoạch.');
    $('eyebrow').textContent = t('Product walkthrough', 'Demo sản phẩm');
    $('languageLabel').textContent = t('Language', 'Ngôn ngữ');
    $('disclosure').textContent = t('Real interface. Scripted participants. No AI calls or verified execution claims.', 'UI thật, thành viên kịch bản. Không gọi AI hoặc giả lập kết quả đã kiểm chứng.');
    $('note').textContent = t('Pause on any scene to read. The three research tasks remain planned; progress reports do not establish verification.', 'Dừng ở bất kỳ cảnh nào để đọc. Ba việc nghiên cứu vẫn ở trạng thái kế hoạch; tiến độ tự báo chưa phải kiểm chứng.');
    $('previous').setAttribute('aria-label', t('Previous scene', 'Cảnh trước')); $('next').setAttribute('aria-label', t('Next scene', 'Cảnh tiếp'));
    $('seek').setAttribute('aria-label', t('Choose a scene', 'Chọn cảnh')); $('seekLabel').textContent = t('Scene', 'Cảnh');
    $('gif').href = $('language').value === 'vi' ? '../demo.vi.gif' : '../demo.gif';
    $('error').hidden = true; pause(); render();
  } catch (e) { $('error').hidden = false; $('error').textContent = t('Unable to load scenes. Serve this folder over local HTTP and retry: ', 'Không tải được cảnh. Hãy mở thư mục qua HTTP local rồi thử lại: ') + e.message; }
}
$('play').onclick = () => { if (!manifest) return; if (playing) pause(); else { playing = true; if (index === manifest.frames.length - 1) index = 0; $('play').textContent = t('Pause', 'Tạm dừng'); $('play').setAttribute('aria-pressed', 'true'); render(); } };
$('previous').onclick = () => { pause(); index = Math.max(0, index - 1); render(); };
$('next').onclick = () => { pause(); index = Math.min(manifest.frames.length - 1, index + 1); render(); };
$('seek').oninput = () => { if (!manifest) return; pause(); index = Number($('seek').value); render(); };
$('language').onchange = load;
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
load();
