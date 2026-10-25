'use strict';
document.getElementById('copy').onclick=async()=>{const b=document.getElementById('copy');try{await navigator.clipboard.writeText('node bin/cli.js install --dry-run');b.textContent='Copied';}catch{b.textContent='Select to copy';}setTimeout(()=>b.textContent='Copy',2000)};
