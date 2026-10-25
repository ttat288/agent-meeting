#!/usr/bin/env node
'use strict';
// Deterministic exports from the supplied transparent PNG; external dev browser only.
// PLAYWRIGHT_MODULE=/path/to/playwright node tools/export-brand.js
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.join(__dirname,'..','assets','brand');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN || '/opt/brave.com/brave/brave'});
 try {
  const page=await browser.newPage(),source='data:image/png;base64,'+fs.readFileSync(path.join(root,'foxul.png')).toString('base64'),images=new Map();
  await page.emulateMedia({colorScheme:'light'});
  for(const size of [16,24,32,48,64,128,256,512,1024]){
   const data=await page.evaluate(async({source,size})=>{const im=new Image();im.src=source;await im.decode();const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,size,size);return c.toDataURL('image/png').split(',')[1]},{source,size});
   const png=Buffer.from(data,'base64');images.set(size,png);fs.writeFileSync(path.join(root,'app-'+size+'.png'),png);
  }
  const embedded='data:image/png;base64,'+images.get(256).toString('base64');
  // SVG compatibility containers embed the supplied raster; they are not vector artwork.
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="title"><title id="title">Foxul</title><image width="256" height="256" href="'+embedded+'"/></svg>\n';
  for(const file of ['mark.svg','app.svg'])fs.writeFileSync(path.join(root,file),svg);
  fs.writeFileSync(path.join(root,'..','icon.svg'),svg);
  fs.writeFileSync(path.join(root,'..','..','src','ui','favicon.svg'),svg);
  fs.writeFileSync(path.join(root,'..','..','docs','showcase','icon.svg'),svg);
  const wordmark='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 128" role="img" aria-labelledby="title"><title id="title">Foxul — Multiple agents. One clear outcome.</title><style>text{fill:#0b0d12}@media(prefers-color-scheme:dark){text{fill:#f4f3ef}}</style><image x="0" y="0" width="128" height="128" href="'+embedded+'"/><text x="148" y="83" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="72" font-weight="650" letter-spacing="-3">Foxul</text></svg>\n';
  fs.writeFileSync(path.join(root,'wordmark.svg'),wordmark);
  const sizes=[16,24,32,48,64,128,256],header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;const payload=[];
  sizes.forEach((size,i)=>{const png=images.get(size),at=6+16*i;header[at]=header[at+1]=size===256?0:size;header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(png.length,at+8);header.writeUInt32LE(offset,at+12);payload.push(png);offset+=png.length});
  fs.writeFileSync(path.join(root,'app.ico'),Buffer.concat([header,...payload]));
  const types={16:'icp4',32:'icp5',64:'icp6',128:'ic07',256:'ic08',512:'ic09',1024:'ic10'},chunks=[];
  for(const [size,type]of Object.entries(types)){const data=images.get(Number(size)),head=Buffer.alloc(8);head.write(type);head.writeUInt32BE(data.length+8,4);chunks.push(head,data)}
  const icns=Buffer.alloc(8);icns.write('icns');icns.writeUInt32BE(8+chunks.reduce((n,b)=>n+b.length,0),4);fs.writeFileSync(path.join(root,'app.icns'),Buffer.concat([icns,...chunks]));
  fs.copyFileSync(path.join(root,'app-32.png'),path.join(root,'..','..','src','ui','favicon.png'));
  fs.copyFileSync(path.join(root,'app-128.png'),path.join(root,'..','..','src','ui','logo.png'));
  fs.copyFileSync(path.join(root,'app-32.png'),path.join(root,'..','..','docs','showcase','icon.png'));
  console.log('Transparent PNG → 16–1024px PNG, ICO, ICNS and raster-backed SVG containers. Native OS appearance still requires native verification.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
