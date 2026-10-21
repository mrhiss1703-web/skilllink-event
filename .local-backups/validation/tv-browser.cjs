const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),assert=require('assert');
(async()=>{
 const targets=await (await fetch('http://127.0.0.1:9225/json')).json();
 const target=targets.find(t=>t.type==='page');
 const ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
 const base=pathToFileURL(path.resolve(process.argv[2]) + path.sep).href;
 async function visit(file,width){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<800});
  await call('Page.navigate',{url:base+file});
  for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,100));if(await evaluate("document.readyState==='complete' && !!window.SKILLLINK_PORTFOLIO"))break;}
  await evaluate('document.fonts.ready');
  const sizes=await evaluate('({viewport:innerWidth,scroll:document.documentElement.scrollWidth})');
  assert(sizes.scroll<=sizes.viewport+1,JSON.stringify({file,width,...sizes}));
 }
 await visit('index.html',390);
 console.log('Mobile metrics',await evaluate('({viewport:innerWidth,scroll:document.documentElement.scrollWidth,hero:document.querySelector(".hero").getBoundingClientRect().width})'));
 fs.writeFileSync('.local-backups/validation/tv-mobile.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await evaluate('document.querySelector(".menu").click()');
 assert(await evaluate('document.querySelector("#nav").classList.contains("open")'));
 await evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}))');
 assert(!(await evaluate('document.querySelector("#nav").classList.contains("open")')));
 await visit('index.html',1440);
 fs.writeFileSync('.local-backups/validation/tv-desktop.png',Buffer.from((await call('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await visit('portfolio.html',390);
 assert.equal(await evaluate('document.querySelectorAll(".portfolio-card").length'),6);
 await evaluate('document.querySelector("#load-more").click()');
 assert.equal(await evaluate('document.querySelectorAll(".portfolio-card").length'),9);
 await evaluate('document.querySelector("[data-filter=video]").click()');
 assert.equal(await evaluate('document.querySelectorAll(".portfolio-card").length'),1);
 await evaluate('document.querySelector("[data-filter=event]").click()');
 assert.equal(await evaluate('document.querySelectorAll(".portfolio-card").length'),0);
 await visit('project.html?id=frame-4',390);
 await evaluate('document.querySelector("[data-photo]").click()');
 assert(await evaluate('document.querySelector("#lightbox").open'));
 await evaluate('document.querySelector("#lightbox .close").click()');
 assert(!(await evaluate('document.querySelector("#lightbox").open')));
 await visit('project.html?id=film',390);
 assert.equal(await evaluate('document.querySelectorAll("video").length'),0);
 await evaluate('document.querySelector(".video-start").click()');
 assert.equal(await evaluate('document.querySelectorAll("video").length'),1);
 console.log('PASS browser: mobile/desktop overflow, menu/ESC, filters, pagination, lightbox open/close, lazy video.');
 await call('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
