
const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
function closeMenu() { links.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); toggle.textContent='Mở menu'; }
toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; links.classList.toggle('open',open); toggle.setAttribute('aria-expanded',String(open)); toggle.textContent=open?'Đóng menu':'Mở menu'; });
links.querySelectorAll('a').forEach(a => a.addEventListener('click',closeMenu));
document.addEventListener('click', e => { if (!e.target.closest('nav')) closeMenu(); });
document.addEventListener('keydown', e => { if(e.key==='Escape' && toggle.getAttribute('aria-expanded')==='true'){ closeMenu(); toggle.focus(); } });
window.addEventListener('resize', () => { if(innerWidth>720) closeMenu(); });
document.documentElement.classList.add('js');

document.querySelectorAll('.project-card').forEach(card => {
 const preview=card.querySelector('.project-preview'), set=preview.querySelector('.project-image-set');
 set.replaceChildren(...Array.from(card.querySelectorAll('.gallery > a'), a=>a.cloneNode(true)));
 const copy=set.cloneNode(true); copy.setAttribute('aria-hidden','true'); copy.inert=true;
 copy.querySelectorAll('a').forEach(a=>a.tabIndex=-1);
 preview.querySelector('.project-track').append(copy); preview.classList.add('is-ready');
 const button=card.querySelector('.motion-toggle'); button.hidden=false;
 button.addEventListener('click',()=>{const paused=preview.classList.toggle('is-paused');button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Tiếp tục trôi ảnh':'Tạm dừng ảnh';});
});

document.querySelectorAll('.gallery').forEach(gallery => {
 const controls=gallery.previousElementSibling, buttons=controls.querySelectorAll('button'), status=controls.querySelector('.gallery-status');
 const update=()=>{ const index=Math.max(0,Math.min(gallery.children.length-1,Math.round(gallery.scrollLeft/(gallery.clientWidth+16)))); status.textContent=`${index+1} / ${gallery.children.length}`; buttons[0].disabled=index===0; buttons[1].disabled=index===gallery.children.length-1; };
 buttons.forEach(button=>button.addEventListener('click',()=>gallery.scrollBy({left:Number(button.dataset.direction)*(gallery.clientWidth+16),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})));
 gallery.addEventListener('scroll',update,{passive:true}); gallery.closest('details').addEventListener('toggle',update); window.addEventListener('resize',update); controls.hidden=false; update();
});
