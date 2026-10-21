(() => {
'use strict';
const data = window.SKILLLINK_PORTFOLIO;
const confirmed = data.projects;
const pending = data.unclassified.map(p => ({...p, pending: true}));
const entries = [...confirmed, ...pending];
const labels = data.categories;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const detailUrl = p => 'project.html?id=' + encodeURIComponent(p.id);
function card(p) {
 const image = p.thumbnail || p.cover;
 const coverPhoto = p.images.find(photo => photo.src === p.cover);
 const width = coverPhoto?.width || 960, height = coverPhoto?.height || 640;
 return '<a class="portfolio-card" href="'+detailUrl(p)+'"><div class="card-cover">'+
 (image ? '<img src="'+escape(image)+'" alt="'+escape(p.name)+'" loading="lazy" decoding="async" width="'+width+'" height="'+height+'">' : '<span class="video-cover" aria-hidden="true">▶</span>')+
 '<span class="card-open" aria-hidden="true">'+(p.video?'▶':'↗')+'</span></div><div class="card-meta"><small>'+escape(labels[p.category] || 'Dự án')+(p.pending?' · Tư liệu':'')+'</small><h3>'+escape(p.name)+'</h3><p>'+escape(p.pending?'Thông tin dự án đang cập nhật.':p.description)+'</p><span>'+(p.video?'Video':p.images.length+' ảnh')+'</span></div></a>';
}
const featured = document.querySelector('#featured-projects');
if (featured) {
 function renderFeatured(filter='all') {
  const matches = entries.filter(p=>filter==='all'||p.category===filter);
  const projects = matches.filter(p=>!p.pending);
  const chosen = projects.filter(p=>p.featured);
  const items = (chosen.length ? chosen : (projects.length ? projects : matches)).slice(0,4);
  featured.innerHTML = items.map(card).join('');
  document.querySelector('#featured-note').textContent = !items.length
   ? 'Chưa có dự án trong danh mục này.'
   : items.some(p=>p.pending) ? 'Tư liệu hình ảnh hiện có. Tên dự án và cách chia bộ ảnh đang được cập nhật.' : '';
 }
 document.querySelectorAll('[data-featured-filter]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-featured-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  renderFeatured(button.dataset.featuredFilter);
 }));
 renderFeatured();
}
const grid = document.querySelector('#portfolio-grid');
if (grid) {
 let filter = 'all', limit = 6;
 const more = document.querySelector('#load-more');
 function render() {
  const list = entries.filter(p=>filter==='all'||p.category===filter);
  grid.innerHTML = list.slice(0,limit).map(card).join('');
  document.querySelector('#portfolio-status').textContent = list.length ? list.length+' mục'+(list.some(p=>p.pending)?' · Có tư liệu đang cập nhật thông tin dự án.':'') : 'Chưa có dự án trong danh mục này.';
  more.hidden = limit >= list.length;
 }
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  filter=button.dataset.filter;limit=6;
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  render();
 }));
 more.addEventListener('click',()=>{
  const count=grid.children.length;limit+=6;render();grid.children[count]?.focus();
 });
 render();
}
let photos = [], selected = 0, returnFocus = null;
const lightbox = document.querySelector('#lightbox');
function updatePhoto() {
 const photo=photos[selected], img=lightbox.querySelector('img');
 img.src=photo.src;img.alt=photo.alt || 'Ảnh dự án SkillLinkTV';
 document.querySelector('#caption').textContent=(selected+1)+' / '+photos.length;
 lightbox.querySelector('.prev').hidden=photos.length<2;
 lightbox.querySelector('.next').hidden=photos.length<2;
}
function step(amount){selected=(selected+amount+photos.length)%photos.length;updatePhoto();}
if (lightbox) {
 lightbox.setAttribute('aria-label','Xem ảnh dự án');
 lightbox.querySelector('.close').onclick=()=>lightbox.close();
 lightbox.querySelector('.prev').onclick=()=>step(-1);
 lightbox.querySelector('.next').onclick=()=>step(1);
 lightbox.addEventListener('close',()=>{document.body.style.overflow='';returnFocus?.focus();});
 lightbox.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'&&photos.length){e.preventDefault();step(1);}
  if(e.key==='ArrowLeft'&&photos.length){e.preventDefault();step(-1);}
 });
 lightbox.addEventListener('click',e=>{
  if(e.target!==lightbox)return;
  const r=lightbox.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)lightbox.close();
 });
 let start=null;
 lightbox.addEventListener('touchstart',e=>{if(e.touches.length===1)start={x:e.touches[0].clientX,y:e.touches[0].clientY};else start=null;},{passive:true});
 lightbox.addEventListener('touchend',e=>{
  if(!start||e.changedTouches.length!==1)return;
  const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5&&photos.length>1)step(dx<0?1:-1);
  start=null;
 },{passive:true});
}
const detail=document.querySelector('#project-detail');
if(detail) {
 const p=entries.find(p=>p.id===new URLSearchParams(location.search).get('id'));
 if(!p) {
  document.title='Không tìm thấy dự án | SkillLinkTV';
  detail.innerHTML='<h1>Chưa tìm thấy dự án.</h1><p>Đường dẫn có thể đã thay đổi.</p><a class="tv-button" href="portfolio.html">Quay về danh sách dự án</a>';
 } else {
  document.title=p.name+' | SkillLinkTV';
  document.querySelector('meta[name="description"]').content=p.description;
  photos=p.images || [];
  detail.innerHTML='<a class="text-link" href="portfolio.html">← Tất cả dự án</a><p class="eyebrow detail-category">'+escape(labels[p.category])+(p.pending?' / TƯ LIỆU':'')+'</p><h1>'+escape(p.name)+'</h1><p class="detail-description">'+escape(p.description)+'</p>'+
  (p.cover?'<img class="detail-cover" src="'+escape(p.cover)+'" alt="'+escape(p.name)+' — ảnh bìa" width="2560" height="1707" fetchpriority="high">':'')+
  (p.video?'<div class="video-player"><button class="video-start" type="button" aria-label="Phát '+escape(p.name)+'"><span>▶</span> Phát video</button></div>':'')+
  (photos.length?'<h2 class="gallery-heading">Bộ ảnh</h2><div class="masonry">'+photos.map((im,i)=>'<button type="button" class="photo-item" data-photo="'+i+'" aria-label="Xem ảnh '+(i+1)+'"><img src="'+escape(im.thumbnail||im.src)+'" alt="'+escape(im.alt||p.name)+'" width="'+(im.width||1707)+'" height="'+(im.height||2560)+'" loading="lazy" decoding="async"></button>').join('')+'</div>':'')+
  '<div class="detail-actions"><a class="tv-button" href="index.html#contact">Liên hệ hợp tác ↗</a><a class="tv-button secondary" href="portfolio.html">Quay về danh sách dự án</a></div><section class="related"><h2>'+(p.pending?'Khám phá tư liệu khác':'Dự án liên quan')+'</h2><div class="project-grid">'+entries.filter(q=>q.id!==p.id&&q.category===p.category).slice(0,3).map(card).join('')+'</div></section>';
  detail.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{
   selected=Number(button.dataset.photo);returnFocus=button;updatePhoto();lightbox.showModal();document.body.style.overflow='hidden';
  }));
  const play=detail.querySelector('.video-start');
  play?.addEventListener('click',()=>{
   const video=document.createElement('video');video.controls=true;video.playsInline=true;video.preload='none';video.src=p.video;video.setAttribute('aria-label',p.name);
   const fallback=document.createElement('a');fallback.href=p.video;fallback.textContent='Tải video';video.append(fallback);
   play.replaceWith(video);video.focus();video.play().catch(()=>{});
  });
 }
}
const menu=document.querySelector('.menu'), nav=document.querySelector('#nav');
function closeMenu(){nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');}
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){closeMenu();menu.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('header'))closeMenu();});
window.addEventListener('resize',()=>{if(innerWidth>760)closeMenu();});
document.querySelector('#year').textContent=new Date().getFullYear();
})();
