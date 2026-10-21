#!/usr/bin/env node
'use strict';
// Add walkthrough captions in the separate player, never inside the app UI.
// PLAYWRIGHT_MODULE=/path/to/playwright node tools/render-showcase.js http://127.0.0.1:3121 /tmp/am-captioned [--vi]
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin=process.argv[2],out=path.resolve(process.argv[3]),lang=process.argv.includes('--vi')?'vi':'en';
(async()=>{fs.mkdirSync(out,{recursive:true});const manifest=await(await fetch(origin+'/'+lang+'/manifest.json')).json();const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN || '/opt/brave.com/brave/brave'});try{const page=await browser.newPage({viewport:{width:1280,height:864},deviceScaleFactor:1,reducedMotion:'reduce'});for(let i=0;i<manifest.frames.length;i++){const frame=manifest.frames[i];await page.goto(origin+'/?lang='+lang+'&scene='+i+'&presentation=1');await page.waitForFunction(title=>document.querySelector('#caption').textContent===title,frame.title);await page.locator('#scene').evaluate(e=>e.decode());assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),864);await page.screenshot({path:path.join(out,String(i).padStart(3,'0')+'_'+frame.tag+'.png')});}fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(lang+': '+manifest.frames.length+' captioned frames')}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
