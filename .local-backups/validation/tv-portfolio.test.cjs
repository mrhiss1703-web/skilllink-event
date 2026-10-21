const fs=require('fs'), vm=require('vm'), path=require('path'), assert=require('assert');
const root=process.argv[2];
const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
const manifest=fs.readFileSync(path.join(root,'projects.js'),'utf8');
class Element {
 constructor(){this.listeners={};this.attrs={};this.style={};this.dataset={};this.children=[];this.classList={contains:()=>false,remove(){},toggle:()=>true};}
 addEventListener(k,fn){this.listeners[k]=fn;}
 setAttribute(k,v){this.attrs[k]=v;}
 querySelectorAll(){return [];}
 querySelector(k){return this.parts?.[k]||null;}
 focus(){this.focused=true;}
 set innerHTML(v){this.html=v;this.children=Array.from(v.matchAll(/class="portfolio-card"/g),()=>new Element());}
 get innerHTML(){return this.html||'';}
 showModal(){this.open=true;}
 close(){this.open=false;this.listeners.close?.();}
 replaceWith(v){this.replacement=v;}
 append(v){this.children.push(v);}
 play(){this.played=true;return Promise.resolve();}
}
function run(page,search='',mutate=()=>{}){
 const ids={}, filters=['all','photo','video','event'].map(key=>{const e=new Element();e.dataset.filter=key;return e;});
 const box=new Element();box.parts=Object.fromEntries(['img','.close','.prev','.next'].map(k=>[k,new Element()]));
 ids['#lightbox']=box;ids['#caption']=new Element();ids['#year']=new Element();ids['meta[name="description"]']=new Element();
 if(page==='list')for(const id of ['#portfolio-grid','#load-more','#portfolio-status'])ids[id]=new Element();
 if(page==='home')for(const id of ['#featured-projects','#featured-note'])ids[id]=new Element();
 if(page==='detail')ids['#project-detail']=new Element();
 const doc={body:new Element(),querySelector:k=>ids[k]||null,querySelectorAll:k=>k==='[data-filter]'?filters:[],addEventListener(){},createElement:()=>new Element()};
 const context={document:doc,window:{addEventListener(){}},location:{search},URLSearchParams,innerWidth:390,console};
 vm.createContext(context);vm.runInContext(manifest,context);mutate(context.window.SKILLLINK_PORTFOLIO);
 vm.runInContext(source,context);
 return {ids,filters,box,context};
}
const home=run('home');assert.equal(home.ids['#featured-projects'].children.length,2);
const actual=run('list');assert.equal(actual.ids['#portfolio-grid'].children.length,3);
assert.deepEqual(Array.from(home.context.window.SKILLLINK_PORTFOLIO.projects,p=>p.images.length),[4,4]);
assert.equal(new Set(home.context.window.SKILLLINK_PORTFOLIO.projects.flatMap(p=>p.images.map(i=>i.src))).size,8);
const list=run('list','',d=>{d.projects=Array.from({length:8},(_,i)=>({...d.projects[0],id:'fixture-'+i}));});assert.equal(list.ids['#portfolio-grid'].children.length,6);assert.equal(list.ids['#load-more'].hidden,false);
list.ids['#load-more'].listeners.click();assert.equal(list.ids['#portfolio-grid'].children.length,9);assert.equal(list.ids['#load-more'].hidden,true);
list.filters[2].listeners.click();assert.equal(list.ids['#portfolio-grid'].children.length,1);assert.match(list.ids['#portfolio-grid'].innerHTML,/film/);
list.filters[3].listeners.click();assert.equal(list.ids['#portfolio-grid'].children.length,0);assert.match(list.ids['#portfolio-status'].textContent,/Chưa có/);
list.filters[1].listeners.click();assert.equal(list.ids['#portfolio-grid'].children.length,6);assert.equal(list.filters[1].attrs['aria-pressed'],'true');
const missing=run('detail','?id=missing');assert.match(missing.ids['#project-detail'].innerHTML,/Chưa tìm thấy/);
const photo=run('detail','?id=concept-kimono');assert.match(photo.ids['#project-detail'].innerHTML,/width="1707" height="2560"/);assert.match(photo.ids['#project-detail'].innerHTML,/masonry/);
const film=run('detail','?id=film');assert.match(film.ids['#project-detail'].innerHTML,/video-start/);assert.doesNotMatch(film.ids['#project-detail'].innerHTML,/<video/);
const confirmed=run('home','',d=>{d.projects=[{...d.unclassified[0],id:'confirmed',name:'Confirmed',featured:true}];});
assert.equal(confirmed.ids['#featured-projects'].children.length,1);assert.match(confirmed.ids['#featured-projects'].innerHTML,/Confirmed/);
for(const p of [...home.context.window.SKILLLINK_PORTFOLIO.projects,...home.context.window.SKILLLINK_PORTFOLIO.unclassified]){
 for(const file of [p.cover,p.thumbnail,p.video,...p.images.flatMap(i=>[i.src,i.thumbnail])].filter(Boolean))assert.ok(fs.existsSync(path.join(root,file)),file);
}
console.log('PASS: featured limit, confirmed project preference, pagination, all category filters, empty state, missing detail, portrait dimensions, lazy video, asset paths.');
