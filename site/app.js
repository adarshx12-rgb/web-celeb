const {photos,templates,palettes}=window.CelebrationCatalog;
const escapeHtml=(value)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let occasion='All', recipient='Everyone', expanded=false, galleryMotion;
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function cardMarkup(t){return `<a class="template-item" data-template="${t.id}" href="${t.href||'/template.html?id='+encodeURIComponent(t.id)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${t.name}, ${t.occasion} template in a new tab"><div class="template-design ${t.style}"><div class="design-top"><span>${t.href?'An immersive birthday concert':'Made for a favorite person'}</span><span>♡</span></div><h3 class="design-title">${t.title}</h3><img class="design-photo" src="${t.href?'/assets/concert/concert-cover.webp':photos[t.photo]}" alt="" loading="lazy" width="300" height="200"><p class="design-note">${t.note}</p><div class="design-bottom">${t.href?'Scroll into their headline moment.':'A little something, just for you.'}</div></div><div class="template-caption"><span>${t.name}</span><span>${t.occasion}</span></div><span class="view-label">${t.href?'Enter the concert':'Open template'} ↗</span></a>`;}
function renderGallery(){
  galleryMotion?.revert();
  galleryMotion=undefined;
  const gallery=document.querySelector('.gallery-window');
  gallery.classList.remove('is-pinned-gallery');
  const filtered=expanded||occasion!=='All'||recipient!=='Everyone';
  const list=templates.filter(t=>(occasion==='All'||t.occasion===occasion)&&(recipient==='Everyone'||t.recipient===recipient||t.recipient==='Everyone'));
  const columns=document.getElementById('template-columns');
  const count=filtered?Math.min(list.length,4):5;
  columns.classList.toggle('filtered',filtered);
  gallery.classList.toggle('is-filtered',filtered);
  columns.innerHTML=Array.from({length:count},(_,i)=>`<div class="template-column">${list.filter((_,n)=>n%count===i).map(cardMarkup).join('')}</div>`).join('');
  if(window.gsap&&window.ScrollTrigger&&!reducedMotion.matches&&!filtered){
    gsap.registerPlugin(ScrollTrigger);
    gallery.classList.add('is-pinned-gallery');
    galleryMotion=gsap.context(()=>{
      const tracks=gsap.utils.toArray('.template-column');
      // One pin owns the entire sequence, so the following section only
      // advances once every column has reached its final position.
      const travel=column=>Math.max(0,column.scrollHeight-gallery.clientHeight);
      const sequence=gsap.timeline({
        scrollTrigger:{
          id:'template-gallery',
          trigger:gallery,
          start:'top top',
          end:()=>`+=${Math.round(Math.max(
            gallery.clientHeight*2.6,
            ...tracks.map(column=>travel(column)*1.4)
          ))}`,
          pin:true,
          pinSpacing:true,
          scrub:true,
          anticipatePin:1,
          invalidateOnRefresh:true
        }
      });
      const delays=[0,.06,.12,.03,.09];
      const eases=['none','power1.inOut','sine.inOut','none','power1.inOut'];
      const depths=[-65,85,-120,55,-30];
      tracks.forEach((column,index)=>{
        const downward=index%2===1;
        sequence.fromTo(column,
          {y:()=>downward?-travel(column):0},
          {
            y:()=>downward?0:-travel(column),
            duration:1-delays[index],
            ease:eases[index],
            immediateRender:true
          },
          delays[index]
        );
        // Keep depth on the cards and vertical travel on their parent tracks.
        // That lets the two movements compose without overwriting each other.
        column.querySelectorAll('.template-item').forEach((card,row)=>{
          const depth=depths[index]+(row%2?28:-12);
          const tilt=(index%2?-1:1)*(3+row%2);
          sequence.fromTo(card,{
            '--card-depth':`${depth}px`,
            '--card-pitch':'6deg',
            '--card-yaw':`${tilt}deg`
          },{
            '--card-depth':`${depth+45}px`,
            '--card-pitch':'-6deg',
            '--card-yaw':`${-tilt}deg`,
            duration:1,
            ease:'sine.inOut'
          },0);
        });
      });

      // Pointer movement adds a small camera-like offset. Touch scrolling
      // keeps the scroll-driven depth effect without any gesture interception.
      const pointer={x:0,y:0};
      const drawPointer=()=>{
        columns.style.setProperty('--look-yaw',`${pointer.x*5}deg`);
        columns.style.setProperty('--look-pitch',`${-pointer.y*4}deg`);
        columns.style.setProperty('--look-x',`${pointer.x*12}px`);
        columns.style.setProperty('--look-y',`${pointer.y*9}px`);
        columns.style.setProperty('--light-x',`${50+pointer.x*35}%`);
        columns.style.setProperty('--light-y',`${35+pointer.y*30}%`);
      };
      const moveX=gsap.quickTo(pointer,'x',{duration:.65,ease:'power2.out',onUpdate:drawPointer});
      const moveY=gsap.quickTo(pointer,'y',{duration:.65,ease:'power2.out',onUpdate:drawPointer});
      const onPointerMove=event=>{
        if(event.pointerType==='touch'||!window.matchMedia('(hover: hover) and (pointer: fine)').matches)return;
        const bounds=gallery.getBoundingClientRect();
        moveX(gsap.utils.clamp(-1,1,(event.clientX-bounds.left)/bounds.width*2-1));
        moveY(gsap.utils.clamp(-1,1,(event.clientY-bounds.top)/bounds.height*2-1));
      };
      const resetPointer=()=>{moveX(0);moveY(0);};
      gallery.addEventListener('pointermove',onPointerMove,{passive:true});
      gallery.addEventListener('pointerleave',resetPointer);
      return ()=>{
        gallery.removeEventListener('pointermove',onPointerMove);
        gallery.removeEventListener('pointerleave',resetPointer);
        for(const property of ['--look-yaw','--look-pitch','--look-x','--look-y','--light-x','--light-y'])columns.style.removeProperty(property);
      };
    },columns);
  }
  window.ScrollTrigger?.refresh();
}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  occasion=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  renderGallery();
}));
document.getElementById('recipient').addEventListener('change',e=>{recipient=e.target.value;renderGallery();});
document.getElementById('browse-all').addEventListener('click',()=>{
  expanded=!expanded;
  const button=document.getElementById('browse-all');
  button.setAttribute('aria-expanded',String(expanded));
  button.innerHTML=expanded?'Back to the moving gallery <span aria-hidden="true">↑</span>':'Browse all 15 templates <span aria-hidden="true">↗</span>';
  if(expanded){occasion='All';recipient='Everyone';document.getElementById('recipient').value='Everyone';document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter==='All';b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
  renderGallery();
  document.getElementById('templates').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'});
});
function swatchMarkup(selected){return palettes.map(p=>`<button type="button" class="swatch ${p.color===selected?'selected':''}" style="background:${p.color}" data-color="${p.color}" aria-label="${p.name}" aria-pressed="${p.color===selected}"></button>`).join('');}
document.getElementById('demo-swatches').innerHTML=swatchMarkup(palettes[0].color);
document.getElementById('demo-swatches').addEventListener('click',e=>{
  const button=e.target.closest('[data-color]');if(!button)return;
  document.getElementById('sample-card').style.background=button.dataset.color;
  document.getElementById('palette-name').textContent=button.getAttribute('aria-label');
  document.getElementById('demo-swatches').innerHTML=swatchMarkup(button.dataset.color);
});
const dialog=document.getElementById('editor');
let state={},lastFocus,photoPending=false,photoRevision=0;
function keepsakeMarkup(s){
  return `<article class="keepsake ${escapeHtml(s.style)}" style="background:${s.color}"><p class="keepsake-top">${escapeHtml(s.occasion)} · A little something, just for you.</p><h2>${escapeHtml(s.headline)}<br>${escapeHtml(s.name)}.</h2><img src="${escapeHtml(s.photo)}" alt="A favorite memory"><p class="keepsake-note">${escapeHtml(s.note)}</p>${s.sender?`<p class="keepsake-sender">With love, ${escapeHtml(s.sender)}</p>`:''}<div class="keepsake-mark" aria-hidden="true">♡</div></article>`;
}
function updatePreview(){document.getElementById('personal-preview').innerHTML=keepsakeMarkup(state);}
function openEditor(id='hey',restore=false){
  const t=templates.find(t=>t.id===id)||templates[14];
  state={template:t.id,style:t.style,occasion:t.occasion,name:'Alex',headline:t.headline,note:t.note,sender:'',photo:photos[t.photo],color:t.color};
  if(restore){try{const saved=JSON.parse(localStorage.getItem('little-cheers-draft'));if(saved&&templates.some(t=>t.id===saved.template)&&/^#[0-9a-f]{6}$/i.test(saved.color)&&typeof saved.photo==='string'&&(saved.photo.startsWith('https://images.unsplash.com/')||saved.photo.startsWith('data:image/'))){state={...state,...saved};}}catch{/* A fresh draft works even when storage is unavailable. */}}
  document.getElementById('editor-title').textContent=templates.find(t=>t.id===state.template)?.name||t.name;
  document.getElementById('person-name').value=state.name;
  document.getElementById('headline').value=state.headline;
  document.getElementById('note').value=state.note;
  document.getElementById('sender').value=state.sender;
  document.getElementById('photo').value='';
  document.getElementById('editor-status').textContent='Your draft stays in this browser. Download it to keep or send.';
  document.getElementById('editor-swatches').innerHTML=swatchMarkup(state.color);
  updatePreview();lastFocus=document.activeElement;dialog.showModal();document.body.classList.add('modal-open');
}
document.querySelectorAll('[data-create]').forEach(b=>b.addEventListener('click',()=>window.open('/concert.html?edit=1','_blank','noopener,noreferrer')));
document.getElementById('close-editor').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');photoRevision++;lastFocus?.focus();});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.getElementById('editor-form').addEventListener('submit',e=>e.preventDefault());
for(const [id,key] of [['person-name','name'],['headline','headline'],['note','note'],['sender','sender']])document.getElementById(id).addEventListener('input',e=>{state[key]=e.target.value;updatePreview();});
document.getElementById('editor-swatches').addEventListener('click',e=>{const b=e.target.closest('[data-color]');if(!b)return;state.color=b.dataset.color;document.getElementById('editor-swatches').innerHTML=swatchMarkup(state.color);updatePreview();});
document.getElementById('photo').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  const status=document.getElementById('editor-status');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024){status.textContent='Choose a JPG, PNG, or WebP photo smaller than 12 MB.';return;}
  const revision=++photoRevision;photoPending=true;document.getElementById('download').disabled=true;
  try{
    const bitmap=await createImageBitmap(file),scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    if(revision===photoRevision){state.photo=canvas.toDataURL('image/jpeg',.85);updatePreview();status.textContent='Your photo is ready. It stays on this device until you send your downloaded page.';}
  }catch{status.textContent='That photo could not be opened. Please try another JPG, PNG, or WebP.';}
  finally{photoPending=false;document.getElementById('download').disabled=false;}
});
let toastTimer;
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
document.getElementById('save-draft').addEventListener('click',()=>{
  if(photoPending)return;
  try{localStorage.setItem('little-cheers-draft',JSON.stringify(state));document.getElementById('editor-status').textContent='Draft saved in this browser. “Make someone’s day” will reopen it.';toast('Your little something is saved.');}
  catch{document.getElementById('editor-status').textContent='Browser storage is unavailable or full. Download your page to keep it.';}
});
document.getElementById('download').addEventListener('click',async()=>{
  if(!document.getElementById('editor-form').reportValidity()||photoPending)return;
  const button=document.getElementById('download');button.disabled=true;
  try{
    const css=await fetch('/styles.css').then(r=>{if(!r.ok)throw new Error('styles');return r.text();});
    const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>A little celebration for ${escapeHtml(state.name)}</title><style>${css}\nbody{background:${state.color};padding:7vh 20px;min-height:100svh;display:grid;place-items:center}.keepsake{max-width:600px;width:100%;padding:40px}.keepsake img{height:auto;max-height:430px;object-fit:cover}.keepsake h2{font-family:Georgia,serif}.keepsake-note{font-family:Arial,sans-serif}@media(prefers-reduced-motion:no-preference){.keepsake{animation:arrive 1s ease both}@keyframes arrive{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}}</style></head><body>${keepsakeMarkup(state)}</body></html>`;
    const url=URL.createObjectURL(new Blob([html],{type:'text/html'}));const a=document.createElement('a');a.href=url;a.download=`for-${state.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'you'}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
    document.getElementById('editor-status').textContent='Downloaded! Send the HTML file as a keepsake. Built-in sample photos need an internet connection; uploaded photos are embedded.';
  }catch{document.getElementById('editor-status').textContent='The download could not be created. Keep this page open and try again.';}
  finally{button.disabled=false;}
});
renderGallery();
reducedMotion.addEventListener('change',renderGallery);
window.addEventListener('load',()=>window.ScrollTrigger?.refresh());
// Font metrics affect the column heights and therefore the travel distance.
document.fonts?.ready.then(()=>window.ScrollTrigger?.refresh());
if(window.gsap&&!reducedMotion.matches){
  gsap.from('.hero-copy',{opacity:0,y:22,duration:.8,ease:'power2.out'});
  gsap.from('.hero-art',{opacity:0,y:40,duration:1,delay:.15,ease:'power2.out'});
}
