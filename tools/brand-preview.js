'use strict';
// Isolated read-only brand preview. Explicit files only; never serves the checkout.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),routes=new Map();
for(const name of ['index.html','brand.css','brand.js','concepts.png'])routes.set('/'+(name==='index.html'?'':name),path.join(root,'docs','brand',name));
for(const name of ['foxul.png','mark.svg','wordmark.svg','app.svg','app.ico','app.icns',...[16,24,32,48,64,128,256,512,1024].map(size=>'app-'+size+'.png')])routes.set('/assets/brand/'+name,path.join(root,'assets','brand',name));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.ico':'image/vnd.microsoft.icon','.icns':'application/octet-stream'};
const s=http.createServer((q,r)=>{
 const f=routes.get(new URL(q.url,'http://localhost').pathname);if(!f){r.writeHead(404);return r.end('Not found')}
 try { const bytes=fs.readFileSync(f);r.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream','x-content-type-options':'nosniff','cache-control':'no-store','content-security-policy':"default-src 'none'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"});r.end(bytes); }
 catch { r.writeHead(404);r.end('Not found'); }
});s.listen(Number(process.env.AM_BRAND_PREVIEW_PORT||3122),'127.0.0.1',()=>console.log('Brand preview at http://127.0.0.1:'+s.address().port));
