const gallery = document.querySelector('#gallery');
const lightbox = document.querySelector('#lightbox');
let selected = 0;
const photos = Array.from({length:8}, (_, i) => ({src:`assets/project-${i+1}.jpg`, title:`Khung hình ${String(i+1).padStart(2,'0')}`}));
photos.forEach((photo,i) => {
 const button = document.createElement('button');
 button.className = 'project';
 button.setAttribute('aria-label',`Mở ảnh dự án ${i+1}`);
 button.innerHTML = `<figure><img src="${photo.src}" alt="${photo.title} — dự án SkillLinkTV" loading="lazy"><span class="expand" aria-hidden="true">↗</span></figure><div class="project-label"><span>${photo.title}</span><small>SKILLLINKTV / PHOTOGRAPHY</small></div>`;
 button.addEventListener('click', () => {selected=i; showPhoto(); lightbox.showModal(); document.body.style.overflow='hidden';});
 gallery.append(button);
});
function showPhoto(){const photo=photos[selected]; const img=lightbox.querySelector('img');img.src=photo.src;img.alt=photo.title+' — dự án SkillLinkTV';document.querySelector('#caption').textContent=`${photo.title} / 08`;}
function step(amount){selected=(selected+amount+photos.length)%photos.length;showPhoto();}
lightbox.querySelector('.close').onclick=()=>lightbox.close();
lightbox.querySelector('.prev').onclick=()=>step(-1);
lightbox.querySelector('.next').onclick=()=>step(1);
lightbox.addEventListener('close',()=>document.body.style.overflow='');
lightbox.addEventListener('click',event=>{if(event.target===lightbox){const rect=lightbox.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)lightbox.close();}});
lightbox.addEventListener('keydown',event=>{if(event.key==='ArrowRight')step(1);if(event.key==='ArrowLeft')step(-1);});
const menu=document.querySelector('.menu'), nav=document.querySelector('nav');
menu.onclick=()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));};
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}));
document.querySelector('#year').textContent=new Date().getFullYear();
