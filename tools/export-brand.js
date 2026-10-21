#!/usr/bin/env node
'use strict';
// Deterministic SVG rasterization for desktop formats; external dev browser only.
// PLAYWRIGHT_MODULE=/path/to/playwright node tools/export-brand.js
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.join(__dirname,'..','assets','brand');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN || '/opt/brave.com/brave/brave'});
 try {
  const page=await browser.newPage(),svg=fs.readFileSync(path.join(root,'app.svg'),'utf8'),images=new Map();
  for(const size of [16,24,32,48,64,128,256,512,1024]){
   const data=await page.evaluate(async({svg,size})=>{const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await im.decode();const c=document.createElement('canvas');c.width=c.height=size;c.getContext('2d').drawImage(im,0,0,size,size);return c.toDataURL('image/png').split(',')[1]},{svg,size});
   const png=Buffer.from(data,'base64');images.set(size,png);fs.writeFileSync(path.join(root,'app-'+size+'.png'),png);
  }
  const sizes=[16,24,32,48,64,128,256],header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;const payload=[];
  sizes.forEach((size,i)=>{const png=images.get(size),at=6+16*i;header[at]=header[at+1]=size===256?0:size;header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(png.length,at+8);header.writeUInt32LE(offset,at+12);payload.push(png);offset+=png.length});
  fs.writeFileSync(path.join(root,'app.ico'),Buffer.concat([header,...payload]));
  const types={16:'icp4',32:'icp5',64:'icp6',128:'ic07',256:'ic08',512:'ic09',1024:'ic10'},chunks=[];
  for(const [size,type]of Object.entries(types)){const data=images.get(Number(size)),head=Buffer.alloc(8);head.write(type);head.writeUInt32BE(data.length+8,4);chunks.push(head,data)}
  const icns=Buffer.alloc(8);icns.write('icns');icns.writeUInt32BE(8+chunks.reduce((n,b)=>n+b.length,0),4);fs.writeFileSync(path.join(root,'app.icns'),Buffer.concat([icns,...chunks]));
  console.log('SVG → PNG 16–1024px, multi-size ICO and PNG-backed ICNS. Native OS appearance still requires native verification.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
