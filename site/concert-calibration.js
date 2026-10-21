/* Creator-only corner-pin editor. No tracking computation runs while scrolling. */
window.ConcertCalibration=({video,tracking,getKeys,requestTime,onSave,onClose})=>{
  const {trackedQuad,normalizeKeys,validQuad}=window.ConcertTracker;
  const panel=document.createElement('dialog');panel.className='tracking-editor';panel.setAttribute('aria-labelledby','tracking-title');
  panel.innerHTML=`<header><div><h2 id="tracking-title">Keep it in the frame.</h2><p>Pin the corners. Your text and photos follow.</p></div><button type="button" data-action="close" aria-label="Close alignment editor">×</button></header>
    <div class="tracking-toolbar"><label>Attach content to<select id="tracking-surface"><option value="main">Main screen · headline, photos & message</option><option value="left">Left screen · birthday & name</option><option value="right">Right screen · age</option><option value="signLeft">Left audience card · note</option><option value="signRight">Right audience card · note</option></select></label><output id="tracking-time"></output></div>
    <div class="tracking-preview"><canvas width="1024" height="576" aria-label="Concert frame for placing tracking anchors"></canvas><svg viewBox="0 0 1024 576" aria-hidden="true"><polygon></polygon></svg>
    ${['Top left','Top right','Bottom right','Bottom left','Move all corners'].map((label,i)=>`<button type="button" class="tracking-anchor" data-corner="${i}" aria-label="${label} anchor" title="${label}: drag or use arrow keys">${i===4?'+':i+1}</button>`).join('')}</div>
    <div class="tracking-timeline"><button type="button" data-action="previous" aria-label="Previous frame">←</button><label for="tracking-frame" class="sr-only">Video frame</label><input id="tracking-frame" type="range" min="0" max="240" step="1" value="0"><button type="button" data-action="next" aria-label="Next frame">→</button></div>
    <p class="tracking-instructions">Drag the numbered anchors onto the four inner corners of the screen. Drag + to move them together. Each adjustment creates a keyframe. Check later frames and add corrections where needed. Arrow keys nudge a focused anchor; Shift moves 10 pixels.</p>
    <div class="tracking-keyframes" aria-label="Saved anchor keyframes"></div>
    <p id="tracking-status" role="status">Corrections follow the existing motion between your keyframes.</p>
    <footer><div><button type="button" data-action="remove">Remove this keyframe</button><button type="button" data-action="reset">Reset this surface</button><button type="button" data-action="export">Export anchors</button></div><button type="button" data-action="save" class="tracking-save">Apply tracking</button></footer>`;
  document.body.append(panel);
  const find=selector=>panel.querySelector(selector);
  const preview=find('.tracking-preview'),canvas=find('canvas'),ctx=canvas.getContext('2d',{alpha:false});
  const select=find('#tracking-surface'),slider=find('#tracking-frame'),label=find('#tracking-time'),status=find('#tracking-status');
  const polygon=find('polygon'),anchors=[...panel.querySelectorAll('[data-corner]')],list=find('.tracking-keyframes');
  let keys={},shownFrame=0,targetFrame=0,quad=null,drag=null,lastFocus;
  const name=()=>select.value;
  const maxFrame=()=>tracking.tracks[name()].findLastIndex(q=>q!==null);
  function keyList(){
    list.replaceChildren();
    for(const key of keys[name()]||[]){
      const button=document.createElement('button');button.type='button';button.textContent=`${(key.frame/tracking.fps).toFixed(2)}s`;
      button.setAttribute('aria-label',`Jump to anchor keyframe ${key.frame}`);button.setAttribute('aria-pressed',String(key.frame===shownFrame));
      button.addEventListener('click',()=>seek(key.frame));list.append(button);
    }
    find('[data-action=remove]').disabled=!(keys[name()]||[]).some(key=>key.frame===shownFrame)||shownFrame!==targetFrame;
  }
  function paintAnchors(){
    const busy=shownFrame!==targetFrame;
    for(const anchor of anchors){anchor.hidden=!quad;anchor.disabled=busy;}
    polygon.style.display=quad?'':'none';if(!quad)return;
    polygon.setAttribute('points',quad.map(p=>p.join(',')).join(' '));
    const center=quad.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);
    [...quad,center].forEach((p,i)=>{anchors[i].style.left=`${p[0]/tracking.width*100}%`;anchors[i].style.top=`${p[1]/tracking.height*100}%`;});
  }
  function render(time){
    if(!panel.open)return;
    shownFrame=Math.round(time*tracking.fps);
    if(video.readyState>=2)ctx.drawImage(video,0,0,canvas.width,canvas.height);
    quad=trackedQuad(tracking.tracks[name()],shownFrame/tracking.fps,tracking.fps,keys[name()]);
    label.textContent=`${(shownFrame/tracking.fps).toFixed(2)}s · frame ${shownFrame}${shownFrame!==targetFrame?' · seeking…':''}`;
    paintAnchors();keyList();
  }
  function seek(frame){
    targetFrame=Math.min(maxFrame(),Math.max(0,Math.round(frame)));slider.max=maxFrame();slider.value=targetFrame;
    paintAnchors();requestTime(targetFrame/tracking.fps);
  }
  function commit(q){
    if(!validQuad(q)){status.textContent='Keep the corners in order around the screen, without crossing.';return;}
    const existing=keys[name()]||[];
    keys[name()]=[...existing.filter(key=>key.frame!==shownFrame),{frame:shownFrame,quad:q.map(p=>p.slice())}].sort((a,b)=>a.frame-b.frame);
    quad=q;paintAnchors();keyList();status.textContent=`Anchor saved at ${(shownFrame/tracking.fps).toFixed(2)}s. Apply tracking to keep your changes.`;
  }
  anchors.forEach((anchor,i)=>{
    anchor.addEventListener('pointerdown',event=>{
      if(!quad||shownFrame!==targetFrame)return;
      event.preventDefault();anchor.focus({preventScroll:true});anchor.setPointerCapture(event.pointerId);
      const rect=preview.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,rect,quad:quad.map(p=>p.slice())};
    });
    anchor.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      const dx=(event.clientX-drag.x)*tracking.width/drag.rect.width,dy=(event.clientY-drag.y)*tracking.height/drag.rect.height;
      commit(drag.quad.map((p,j)=>i===4||j===i?[p[0]+dx,p[1]+dy]:p.slice()));
    });
    anchor.addEventListener('pointerup',()=>drag=null);anchor.addEventListener('pointercancel',()=>drag=null);
    anchor.addEventListener('keydown',event=>{
      const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
      if(!delta||!quad||shownFrame!==targetFrame)return;
      event.preventDefault();const step=event.shiftKey?10:1;
      commit(quad.map((p,j)=>i===4||j===i?[p[0]+delta[0]*step,p[1]+delta[1]*step]:p.slice()));
    });
  });
  slider.addEventListener('input',()=>seek(Number(slider.value)));
  select.addEventListener('change',()=>{seek(Math.min(shownFrame,maxFrame()));render(shownFrame/tracking.fps);});
  find('[data-action=previous]').addEventListener('click',()=>seek(targetFrame-1));
  find('[data-action=next]').addEventListener('click',()=>seek(targetFrame+1));
  find('[data-action=remove]').addEventListener('click',()=>{keys[name()]=keys[name()].filter(key=>key.frame!==shownFrame);render(shownFrame/tracking.fps);});
  find('[data-action=reset]').addEventListener('click',()=>{keys[name()]=[];render(shownFrame/tracking.fps);status.textContent='This surface uses the original track. Apply tracking to keep the reset.';});
  find('[data-action=close]').addEventListener('click',()=>panel.close());
  find('[data-action=save]').addEventListener('click',()=>{onSave(normalizeKeys(keys,tracking));panel.close();});
  find('[data-action=export]').addEventListener('click',()=>{
    const data={version:1,width:tracking.width,height:tracking.height,fps:tracking.fps,frameCount:tracking.frameCount,keys:normalizeKeys(keys,tracking)};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='concert-anchors.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),15000);
  });
  panel.addEventListener('close',()=>{drag=null;document.body.classList.toggle('editor-open',!!document.querySelector('dialog[open]'));onClose();lastFocus?.focus({preventScroll:true});});
  return {
    get isOpen(){return panel.open;},render,
    open(time){lastFocus=document.activeElement;keys=normalizeKeys(getKeys(),tracking);panel.showModal();document.body.classList.add('editor-open');seek(Math.min(Math.round(time*tracking.fps),maxFrame()));render(time);}
  };
};
