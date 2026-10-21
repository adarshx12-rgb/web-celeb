/* Corner-pin corrections are evaluated on the displayed video's timestamp. */
((root)=>{
  const {quadAt,project}=typeof module==='object'?require('./concert-projection.js'):root.ConcertProjection;
  function validQuad(q){
    if(!Array.isArray(q)||q.length!==4||q.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||Math.abs(n)>8192)))return false;
    const crosses=q.map((a,i)=>{const b=q[(i+1)%4],c=q[(i+2)%4];return (b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);});
    return crosses.every(n=>n>1)&&!!project(q);
  }
  function smoothTrack(track){
    // Symmetric local quadratic filter: suppress edge-detection noise without a time lag.
    return track.map((q,i)=>{
      if(!q||i<2||i>track.length-3||track.slice(i-2,i+3).some(p=>!p))return q;
      const weights=[-3,12,17,12,-3];
      const result=q.map((p,c)=>p.map((_,axis)=>weights.reduce((sum,w,j)=>sum+w*track[i+j-2][c][axis],0)/35));
      return validQuad(result)?result:q;
    });
  }
  function normalizeKeys(value,tracking){
    const result={};
    for(const [name,track] of Object.entries(tracking.tracks)){
      const byFrame=new Map();
      for(const key of Array.isArray(value?.[name])?value[name].slice(0,tracking.frameCount):[]){
        if(Number.isInteger(key?.frame)&&key.frame>=0&&key.frame<track.length&&track[key.frame]&&validQuad(key.quad))byFrame.set(key.frame,{frame:key.frame,quad:key.quad.map(p=>p.slice())});
      }
      result[name]=[...byFrame.values()].sort((a,b)=>a.frame-b.frame);
    }
    return result;
  }
  function prepareTracks(tracking){
    return {...tracking,tracks:Object.fromEntries(Object.entries(tracking.tracks).map(([name,track])=>[
      name,tracking.surfaceMethods?.[name]==='opencv-anchor-pinned-v1'?track:smoothTrack(track)
    ]))};
  }
  function trackedQuad(track,time,fps,keys=[]){
    const base=quadAt(track,time,fps);if(!base||!keys.length)return base;
    const frame=time*fps;
    let a=keys[0],b=keys.at(-1);
    if(frame<=a.frame)b=a;
    else if(frame>=b.frame)a=b;
    else for(let i=1;i<keys.length;i++)if(keys[i].frame>=frame){a=keys[i-1];b=keys[i];break;}
    const mix=a===b?0:(frame-a.frame)/(b.frame-a.frame),qa=track[a.frame],qb=track[b.frame];
    const result=base.map((p,c)=>p.map((v,axis)=>v+(a.quad[c][axis]-qa[c][axis])*(1-mix)+(b.quad[c][axis]-qb[c][axis])*mix));
    return validQuad(result)?result:base;
  }
  function createSeeker(video,{fps,lastTime,onFrame,now=()=>performance.now(),raf=requestAnimationFrame,caf=cancelAnimationFrame}){
    let desired=0,queued=0,destroyed=false,lastFrame=-1,seekStart=0,awaitingFrame=false,pendingFrame=null;
    const stats={seeks:0,frames:0,seekMs:0,maxSeekMs:0,renderMs:0,maxRenderMs:0};
    const events=[];let frameCallback=0;
    const listen=(name,fn)=>{video.addEventListener(name,fn);events.push([name,fn]);};
    const schedule=()=>{if(!queued&&!destroyed)queued=raf(flush);};
    function flush(){
      queued=0;
      if(destroyed||video.readyState<1||video.seeking||awaitingFrame)return;
      const target=Math.round(desired*fps)/fps;
      if(Math.abs(video.currentTime-target)<.5/fps)return;
      seekStart=now();pendingFrame=Math.round(target*fps);awaitingFrame=!!video.requestVideoFrameCallback;stats.seeks++;
      video.currentTime=Math.max(0,Math.min(target+.001,Number.isFinite(video.duration)?video.duration-.001:lastTime));
    }
    function present(time){
      const index=Math.min(Math.round(lastTime*fps),Math.max(0,Math.round(time*fps)));
      // A callback for the preceding frame can arrive after a new seek begins.
      if(pendingFrame!==null&&index!==pendingFrame)return;
      if(index!==lastFrame){
        lastFrame=index;const start=now();onFrame(index/fps);const elapsed=now()-start;
        stats.frames++;stats.renderMs+=elapsed;stats.maxRenderMs=Math.max(stats.maxRenderMs,elapsed);
      }
      if(pendingFrame!==null){const elapsed=now()-seekStart;stats.seekMs+=elapsed;stats.maxSeekMs=Math.max(stats.maxSeekMs,elapsed);}
      awaitingFrame=false;pendingFrame=null;schedule();
    }
    if(video.requestVideoFrameCallback){
      const ready=(_,metadata)=>{if(destroyed)return;present(metadata.mediaTime);frameCallback=video.requestVideoFrameCallback(ready);};
      frameCallback=video.requestVideoFrameCallback(ready);
    }
    listen('loadedmetadata',schedule);
    listen('loadeddata',()=>{if(!video.requestVideoFrameCallback)present(video.currentTime);schedule();});
    listen('seeked',()=>{if(!video.requestVideoFrameCallback)present(video.currentTime);schedule();});
    listen('canplay',schedule);
    return {
      request(time){desired=Math.max(0,Math.min(lastTime,time));schedule();},
      get stats(){return {...stats,averageRenderMs:stats.frames?stats.renderMs/stats.frames:0,averageSeekMs:stats.seeks?stats.seekMs/stats.seeks:0};},
      destroy(){destroyed=true;if(queued)caf(queued);if(frameCallback)video.cancelVideoFrameCallback(frameCallback);events.forEach(([name,fn])=>video.removeEventListener(name,fn));}
    };
  }
  const api={validQuad,smoothTrack,prepareTracks,normalizeKeys,trackedQuad,createSeeker};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ConcertTracker=api;
})(typeof window==='undefined'?globalThis:window);
