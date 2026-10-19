'use strict';
// --retention <ngày>: tự xoá biên bản (.md/.json trong --minutes-dir) và trạng thái/tệp của phòng cũ trong --data-dir
// đã quá hạn. Không xoá phòng đang chạy (keep: các mã chủ trì đang dùng). Chạy lúc khởi động và mỗi 6 giờ.
const fs = require('fs'), path = require('path');

function prune({ minutesDir, dataDir, days, keep = [] }, log = () => {}) {
  if (!(days > 0)) return 0;
  const cutoff = Date.now() - days * 86400000, keepSet = new Set(keep);
  let n = 0;
  const rm = (p) => { try { fs.rmSync(p, { recursive: true, force: true }); n++; } catch {} };
  const old = (p) => { try { return fs.statSync(p).mtimeMs < cutoff; } catch { return false; } };
  if (minutesDir) for (const f of safeList(minutesDir)) if (/\.(md|json)$/.test(f) && old(path.join(minutesDir, f))) rm(path.join(minutesDir, f));
  if (dataDir) for (const f of safeList(dataDir)) {
    const key = f.replace(/\.json$|\.files$/, '');
    if (keepSet.has(key) || !/\.(json|files)$/.test(f)) continue;
    if (old(path.join(dataDir, f))) rm(path.join(dataDir, f));
  }
  if (n) log(`🧹 Đã xoá ${n} biên bản/trạng thái cũ hơn ${days} ngày (--retention).`);
  return n;
}
const safeList = (d) => { try { return fs.readdirSync(d); } catch { return []; } };

module.exports = { prune };
