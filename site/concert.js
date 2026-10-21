(() => {
  'use strict';
  const assets=window.CONCERT_ASSETS||{flight:'/assets/concert/concert-flight.mp4',poster:'/assets/concert/flight-poster.jpg',finale:'/assets/concert/flight-finale.jpg'};
  const tracking=window.CONCERT_TRACKING;
  const {quadAt,project,inside}=window.ConcertProjection;
  const samplePhotos=[
    {src:'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1000&q=85',caption:'For the people who stay.'},
    {src:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85',caption:'For every adventure ahead.'},
    {src:'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=85',caption:'For nights like these.'}
  ];
  const defaults={name:'Alex',headline:'Happy birthday',photoFit:'contain',age:'25',sender:'your people',leftSign:'Happy birthday, {name}!',rightSign:"You're the headliner.",note:"Here's to the nights we'll never forget, the people who never leave, and everything still waiting for you. Happy birthday, legend.",accent:'cyan',photos:[]};
  const draftKey='little-cheers-headliner-v1';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const exported=window.CONCERT_EXPORT===true;
  function normalize(value){
    const s={...defaults};
    if(!value||typeof value!=='object')return s;
    for(const [key,max] of Object.entries({name:24,headline:48,sender:45,leftSign:180,rightSign:180,note:280})){
      if(typeof value[key]==='string')s[key]=value[key].slice(0,max);
    }
    s.age=String(Math.min(120,Math.max(1,Number.parseInt(value.age,10)||25)));
    if(['cyan','amber','white'].includes(value.accent))s.accent=value.accent;
    if(['contain','cover'].includes(value.photoFit))s.photoFit=value.photoFit;
    s.photos=Array.isArray(value.photos)?value.photos.slice(0,4).filter(p=>p&&typeof p.src==='string'&&/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(p.src)&&p.src.length<2500000).map((p,i)=>({src:p.src,caption:typeof p.caption==='string'?p.caption.slice(0,65):`A favorite memory ${i+1}`})):[];
    return s;
  }
  let state=normalize(window.CONCERT_DATA),progress=0,photoOffset=0,currentPhoto=-1;
  let motionContext,sequence,uploadBusy=false,uploadVersion=0,lastFocus,toastTimer,entered=false,toolsTimer;
  if(exported)document.body.classList.add('recipient');
  if(!exported){try{const saved=localStorage.getItem(draftKey);if(saved)state=normalize(JSON.parse(saved));}catch{/* Storage may be unavailable in private browsing. */}}
  const photos=()=>state.photos.length?state.photos:samplePhotos;
  const video=$('#concert-video');
  const trackedSurfaces=$$('[data-surface]');
  const atmosphere=$('#screen-atmosphere');
  const atmosphereContext=atmosphere.getContext('2d',{willReadFrequently:true});
  atmosphere.width=640;atmosphere.height=360;
  let desiredTime=0,renderedTime=0,mediaReady=false,seekQueued=0,editingCards=false;
  video.muted=true;video.src=assets.flight;video.poster=assets.poster;
  function mapSurface(element,quad,scale){
    const result=project(quad,scale);if(!result)return;
    const {width,height,matrix}=result;
    element.style.setProperty('--surface-unit',`${width/100}px`);
    Object.assign(element.style,{left:'0',top:'0',width:`${width}px`,height:`${height}px`,clipPath:'none',transformOrigin:'0 0',transform:`matrix3d(${matrix.join(',')})`});
    if(element.classList.contains('crowd-sign')){
      const length=Math.max(1,element.textContent.length);
      element.style.fontSize=`${Math.min(width*.18,Math.sqrt(width*height/(length*.62))*.82)}px`;
    }
    if(element.dataset.surface==='main'){
      const size=Math.min(width*.048,Math.sqrt(width*height*.48/(Math.max(1,state.note.length)*.6))*.85);
      $('.note-screen p').style.fontSize=`${size}px`;
    }
  }
  function mapScreens(){
    const scale=$('.scene-frame').clientWidth/tracking.width;
    for(const element of trackedSurfaces){
      const q=quadAt(tracking.tracks[element.dataset.surface],renderedTime,tracking.fps);
      element.hidden=!q;
      if(q)mapSurface(element,q,scale);
    }
  }
  function drawAtmosphere(){
    if(!mediaReady||!atmosphereContext)return;
    const width=atmosphere.width,height=atmosphere.height,scale=width/tracking.width;
    try{
      atmosphereContext.drawImage(video,0,0,width,height);
      const image=atmosphereContext.getImageData(0,0,width,height),pixels=image.data;
      for(let i=3;i<pixels.length;i+=4)pixels[i]=0;
      for(const name of ['main','left','right']){
        const quad=quadAt(tracking.tracks[name],renderedTime,tracking.fps).map(p=>p.map(v=>v*scale));
        const minX=Math.max(0,Math.floor(Math.min(...quad.map(p=>p[0])))),maxX=Math.min(width-1,Math.ceil(Math.max(...quad.map(p=>p[0]))));
        const minY=Math.max(0,Math.floor(Math.min(...quad.map(p=>p[1])))),maxY=Math.min(height-1,Math.ceil(Math.max(...quad.map(p=>p[1]))));
        for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
          if(!inside(x+.5,y+.5,quad))continue;
          const i=(y*width+x)*4;
          const luma=pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722;
          // Bright paper and translucent haze in the original dark panels sit
          // in front of the replacement content. No generated scenery is added.
          const alpha=Math.max(0,Math.min(1,(luma-32)/65));
          pixels[i+3]=Math.round(alpha*alpha*(3-2*alpha)*255);
        }
      }
      atmosphereContext.putImageData(image,0,0);
    }catch{atmosphereContext.clearRect(0,0,width,height);}
  }
  function updateScreenPhase(){
    const phase=progress>.93&&renderedTime>tracking.lastTime-.1?'note':renderedTime>tracking.lastTime*.65?'photos':'title';
    $('.tracked-main').dataset.phase=phase;
    $('.memory-controls').classList.toggle('available',phase==='photos');
  }
  function renderVideoFrame(time){
    renderedTime=Math.min(tracking.lastTime,Math.max(0,time));
    mapScreens();drawAtmosphere();updateScreenPhase();
  }
  function flushSeek(){
    seekQueued=0;
    if(!mediaReady||video.seeking)return;
    const target=Math.min(tracking.lastTime,Math.round(desiredTime*tracking.fps)/tracking.fps);
    if(Math.abs(video.currentTime-target)<.5/tracking.fps)return;
    video.currentTime=target+.001;
  }
  function requestTime(time){
    desiredTime=Math.max(0,Math.min(tracking.lastTime,time));
    if(!seekQueued)seekQueued=requestAnimationFrame(flushSeek);
  }
  video.addEventListener('loadeddata',()=>{
    mediaReady=true;$('#video-status').hidden=true;renderVideoFrame(video.currentTime);requestTime(desiredTime);
  });
  video.addEventListener('seeked',()=>{
    renderVideoFrame(video.currentTime);
    if(!seekQueued)seekQueued=requestAnimationFrame(flushSeek);
  });
  video.addEventListener('error',()=>{
    mediaReady=false;$('#video-status').hidden=false;
    $('#video-status').textContent='The concert video could not load. Refresh to try again.';
  });
  if(video.requestVideoFrameCallback){
    const frameReady=(_,metadata)=>{renderVideoFrame(metadata.mediaTime);video.requestVideoFrameCallback(frameReady);};
    video.requestVideoFrameCallback(frameReady);
  }
  function updatePhoto(force=false){
    const list=photos();
    const autoIndex=Math.min(list.length-1,Math.floor(Math.max(0,Math.min(.999,(progress-.65)/.28))*list.length));
    const index=((autoIndex+photoOffset)%list.length+list.length)%list.length;
    if(index===currentPhoto&&!force)return;
    currentPhoto=index;
    const image=$('#screen-photo');image.src=list[index].src;
    $('#memory-number').textContent=`${String(index+1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}`;
    $('#memory-caption').textContent=list[index].caption;
    $('#memory-label').textContent=`Memory ${index+1} of ${list.length}`;
  }
  function renderContent(){
    const name=state.name.trim()||'You';
    $$('[data-name]').forEach(el=>el.textContent=name);
    $$('[data-headline]').forEach(el=>el.textContent=state.headline);
    $('#screen-photo').style.objectFit=state.photoFit;
    $$('[data-age]').forEach(el=>el.textContent=state.age);
    $$('[data-note]').forEach(el=>el.textContent=state.note);
    $$('[data-from]').forEach(el=>el.textContent=state.sender.trim()?`With love, ${state.sender.trim()}`:'With love, always.');
    $$('[data-sign]').forEach(el=>el.textContent=state[el.dataset.sign==='left'?'leftSign':'rightSign'].replaceAll('{name}',name));
    const color={cyan:'#82e8f5',amber:'#ffc17f',white:'#f1f0e8'}[state.accent];
    document.documentElement.style.setProperty('--accent',color);
    document.documentElement.style.setProperty('--name-size',`${Math.min(25,145/Math.max(4,name.length))}cqw`);
    $$('[data-accent]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.accent===state.accent)));
    document.title=`${name} — Tonight is yours | Little Cheers`;
    updatePhoto(true);
    mapScreens();
  }
  function populateForm(){
    for(const [id,key]of Object.entries({'concert-name':'name','screen-headline':'headline','concert-age':'age','concert-sender':'sender','left-sign':'leftSign','right-sign':'rightSign','concert-note':'note','photo-fit':'photoFit'}))$('#'+id).value=state[key];
    renderPhotoList();
  }
  function renderPhotoList(){
    const container=$('#photo-list');container.replaceChildren();
    state.photos.forEach((photo,index)=>{
      const item=document.createElement('div');item.className='photo-thumb';
      const img=document.createElement('img');img.src=photo.src;img.alt=`Uploaded memory ${index+1}`;
      const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',`Remove photo ${index+1}`);
      remove.addEventListener('click',()=>{state.photos.splice(index,1);photoOffset=0;renderPhotoList();updatePhoto(true);});
      const label=document.createElement('label');label.textContent=`Screen text for photo ${index+1}`;
      const caption=document.createElement('input');caption.value=photo.caption;caption.maxLength=65;
      caption.addEventListener('input',()=>{photo.caption=caption.value;updatePhoto(true);});
      label.append(caption);item.append(img,remove,label);container.append(item);
    });
  }
  function status(message){$('#customization-status').textContent=message;}
  function toast(message){const el=$('#concert-toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3800);}
  function layoutScene(){
    const stage=$('#concert-stage');
    const width=Math.max(innerWidth,stage.clientHeight*16/9);
    document.documentElement.style.setProperty('--scene-width',`${width}px`);
    mapScreens();
    drawAtmosphere();
  }
  const labels=['01 / The anticipation','02 / The drop','03 / Your stage','04 / For you'];
  function updateProgress(value){
    progress=value;
    document.body.classList.toggle('journey-start',entered&&value<.025);
    requestTime(reduced.matches&&entered?tracking.lastTime:Math.min(1,value/.82)*tracking.lastTime);
    updateScreenPhase();
    $('#journey-progress').style.transform=`scaleX(${value})`;
    const chapter=value<.24?0:value<.55?1:value<.92?2:3;
    $('#scene-counter').textContent=labels[chapter];
    $$('[data-chapter]').forEach((button,index)=>{if(index===chapter)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    updatePhoto();

  }
  function setupMotion(){
    motionContext?.revert();sequence=undefined;
    if(!entered){updateProgress(0);return;}
    if(reduced.matches||!window.gsap||!window.ScrollTrigger){
      updateProgress(.82);requestTime(tracking.lastTime);return;
    }
    gsap.registerPlugin(ScrollTrigger);
    motionContext=gsap.context(()=>{
      sequence=gsap.timeline({scrollTrigger:{
        id:'headliner-journey',trigger:'#concert-stage',start:'top top',
        end:()=>`+=${Math.max(6200,innerHeight*8)}`,pin:true,pinSpacing:true,
        scrub:true,anticipatePin:1,invalidateOnRefresh:true,
        onUpdate:self=>updateProgress(self.progress)
      }}).to({value:0},{value:1,duration:1,ease:'none'});
    },$('#concert-stage'));
    ScrollTrigger.refresh();
  }
  function jump(value){
    const trigger=sequence?.scrollTrigger;
    if(trigger)window.scrollTo({top:trigger.start+(trigger.end-trigger.start)*value,behavior:reduced.matches?'instant':'smooth'});
    else{updateProgress(value);$('#concert-stage').scrollIntoView({behavior:'instant'});}
  }
  function revealTools(){
    if(!entered)return;
    document.body.classList.add('tools-visible');clearTimeout(toolsTimer);
    toolsTimer=setTimeout(()=>document.body.classList.remove('tools-visible'),2400);
  }
  function enterConcert(){
    if(entered)return;
    window.scrollTo({top:0,behavior:'instant'});entered=true;
    document.body.classList.remove('concert-lobby');document.body.classList.add('immersive');
    layoutScene();setupMotion();$('#concert-stage').focus({preventScroll:true});revealTools();
  }
  function exitConcert(){
    entered=false;motionContext?.revert();sequence=undefined;
    document.body.classList.remove('immersive','tools-visible','journey-start');document.body.classList.add('concert-lobby');
    window.scrollTo({top:0,behavior:'instant'});updateProgress(0);layoutScene();$('#enter-concert').focus({preventScroll:true});
  }
  $('#enter-concert').addEventListener('click',enterConcert);
  $('#exit-concert').addEventListener('click',exitConcert);
  document.addEventListener('pointermove',revealTools,{passive:true});
  document.addEventListener('pointerdown',revealTools,{passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&entered&&!panel.open)exitConcert();if(e.key==='Tab')revealTools();});
  $$('[data-chapter]').forEach(button=>button.addEventListener('click',()=>jump(Number(button.dataset.chapter))));
  $$('[data-replay]').forEach(button=>button.addEventListener('click',()=>{enterConcert();jump(0);}));
  $('#previous-memory').addEventListener('click',()=>{photoOffset--;updatePhoto(true);});
  $('#next-memory').addEventListener('click',()=>{photoOffset++;updatePhoto(true);});

  const panel=$('#personalize');
  function openPanel(){
    if(exported)return;
    populateForm();lastFocus=document.activeElement;panel.showModal();document.body.classList.add('editor-open');
  }
  $('#edit-trigger').addEventListener('click',()=>{editingCards=false;openPanel();});
  $('#edit-screens').addEventListener('click',()=>{editingCards=false;openPanel();});
  function editCard(side='left'){editingCards=true;openPanel();const field=$('#'+side+'-sign');field.scrollIntoView({block:'center'});field.focus({preventScroll:true});}
  $('#edit-cards').addEventListener('click',()=>editCard());
  $$('[data-sign]').forEach(card=>card.addEventListener('click',()=>editCard(card.dataset.sign)));
  $('#preview-cards').addEventListener('click',()=>{panel.close();enterConcert();jump(0);});
  $('#edit-bottom').addEventListener('click',openPanel);
  $('#close-personalize').addEventListener('click',()=>panel.close());
  panel.addEventListener('close',()=>{document.body.classList.remove('editor-open');lastFocus?.focus();});
  panel.addEventListener('click',e=>{if(e.target===panel){const rect=panel.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right)panel.close();}});
  for(const [id,key]of Object.entries({'concert-name':'name','screen-headline':'headline','concert-age':'age','concert-sender':'sender','left-sign':'leftSign','right-sign':'rightSign','concert-note':'note','photo-fit':'photoFit'})){
    $('#'+id).addEventListener('input',e=>{state[key]=e.target.value;renderContent();});
  }
  $$('[data-accent]').forEach(button=>button.addEventListener('click',()=>{state.accent=button.dataset.accent;renderContent();}));
  $('#concert-form').addEventListener('submit',e=>{
    e.preventDefault();if(uploadBusy){status('Please wait for your photos to finish processing.');return;}
    state=normalize(state);renderContent();
    try{localStorage.setItem(draftKey,JSON.stringify(state));status('Saved in this browser.');toast('Saved. Their name is in lights.');}
    catch{status('Browser storage is unavailable or full. Download the celebration to keep your changes.');toast('Preview updated. Download to keep your changes.');}
    panel.close();enterConcert();jump(editingCards ? 0 : state.photos.length ? .85 : .6);
  });
  $('#reset-concert').addEventListener('click',()=>{
    uploadVersion++;state=normalize(defaults);photoOffset=0;populateForm();renderContent();
    try{localStorage.removeItem(draftKey);}catch{}
    status('Sample content restored.');$('#concert-photos').value='';
  });
  $('#concert-photos').addEventListener('change',async e=>{
    const incoming=[...e.target.files];if(!incoming.length)return;
    const available=4-state.photos.length;
    if(available===0){status('Remove a photo before adding another. You can use up to 4.');e.target.value='';return;}
    if(incoming.length>available){status(`You have room for ${available} more photo${available===1?'':'s'}. Choose fewer files.`);e.target.value='';return;}
    if(incoming.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024)){
      status('Choose JPG, PNG, or WebP photos smaller than 12 MB each.');e.target.value='';return;
    }
    uploadBusy=true;e.target.disabled=true;const revision=++uploadVersion;$('#download-concert').disabled=true;status('Preparing your photos on this device…');
    try{
      const prepared=[];
      for(const file of incoming){
        const bitmap=await createImageBitmap(file);
        const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
        const ctx=canvas.getContext('2d');ctx.fillStyle='#07121a';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
        prepared.push({src:canvas.toDataURL('image/jpeg',.82),caption:['For the memories.','For the people who stay.','For the good times.','And everything still to come.'][(state.photos.length+prepared.length)%4]});
      }
      if(revision===uploadVersion){state.photos.push(...prepared);photoOffset=0;renderPhotoList();updatePhoto(true);status('Photos ready. Save & preview to see them on stage.');}
    }catch{status('A photo could not be opened. Try a different JPG, PNG, or WebP.');}
    finally{uploadBusy=false;$('#download-concert').disabled=false;e.target.value='';e.target.disabled=false;}
  });
  async function fetchText(url){const response=await fetch(url);if(!response.ok)throw new Error(url);return response.text();}
  async function dataUrl(url){
    const response=await fetch(url);if(!response.ok)throw new Error(url);
    const blob=await response.blob();
    return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
  }
  const scriptSafe=value=>value.replace(/<\/script/gi,'<\\/script');
  $('#download-concert').addEventListener('click',async()=>{
    if(uploadBusy||!$('#concert-form').reportValidity())return;
    const button=$('#download-concert');button.disabled=true;status('Packaging the concert artwork, animations, and your memories…');
    try{
      const [html,css,app,gsapSource,scrollSource,trackSource,projectionSource]=await Promise.all(['/concert.html','/concert.css','/concert.js','/vendor/gsap.min.js','/vendor/ScrollTrigger.min.js','/concert-tracking.js','/concert-projection.js'].map(fetchText));
      const embedded=Object.fromEntries(await Promise.all(Object.entries(assets).map(async([name,url])=>[name,await dataUrl(url)])));
      const saved=normalize(state);
      let documentText=html.replace(/<script\b[^>]*src="[^"]*"[^>]*><\/script>/g,'').replace('<link rel="stylesheet" href="/concert.css">',`<style>${css}</style>`);
      for(const [name,url]of Object.entries(assets))documentText=documentText.replaceAll(url,embedded[name]);
      documentText=documentText.replaceAll('href="/#templates"','href="#dedication"').replaceAll('href="/"','href="#dedication"');
      const configuration=JSON.stringify({state:saved,assets:embedded}).replace(/</g,'\\u003c');
      documentText=documentText.replace('</body>',`<script>const embeddedConcert=${configuration};window.CONCERT_EXPORT=true;window.CONCERT_DATA=embeddedConcert.state;window.CONCERT_ASSETS=embeddedConcert.assets;</script><script>${scriptSafe(gsapSource)}</script><script>${scriptSafe(scrollSource)}</script><script>${scriptSafe(trackSource)}</script><script>${scriptSafe(projectionSource)}</script><script>${scriptSafe(app)}</script></body>`);
      const url=URL.createObjectURL(new Blob([documentText],{type:'text/html'}));
      const link=document.createElement('a');link.href=url;link.download=`${saved.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'your'}-headline-night.html`;link.click();setTimeout(()=>URL.revokeObjectURL(url),15000);
      status('Downloaded. Video, tracked notes, and uploaded photos are included. Sample photos and web fonts need internet. Send the HTML file; it is not a hosted link.');
      toast('Their concert is ready to send.');
    }catch{status('The download could not be prepared. Keep this page open, check your connection, and try again.');}
    finally{button.disabled=false;}
  });

  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{layoutScene();window.ScrollTrigger?.refresh();},120);});
  reduced.addEventListener('change',setupMotion);
  document.fonts?.ready.then(()=>window.ScrollTrigger?.refresh());
  window.addEventListener('load',()=>window.ScrollTrigger?.refresh());
  renderContent();populateForm();layoutScene();setupMotion();
  if(new URLSearchParams(location.search).get('edit')==='1'&&!exported)openPanel();
})();
