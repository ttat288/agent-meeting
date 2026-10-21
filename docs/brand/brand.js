'use strict';
document.getElementById('copy').onclick=async()=>{const b=document.getElementById('copy');try{await navigator.clipboard.writeText('node bin/cli.js install --dry-run');b.textContent='Đã sao chép';}catch{b.textContent='Chọn lệnh để chép';}setTimeout(()=>b.textContent='Sao chép',2000)};
