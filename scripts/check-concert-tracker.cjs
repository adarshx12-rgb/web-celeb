const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {performance}=require('node:perf_hooks');
const {prepareTracks,normalizeKeys,trackedQuad,createSeeker,validQuad}=require('../site/concert-tracker.js');
const {project}=require('../site/concert-projection.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync('site/concert-tracking.js','utf8'),context);
const data=prepareTracks(JSON.parse(JSON.stringify(context.window.CONCERT_TRACKING)));
const supplied=JSON.parse(fs.readFileSync('scripts/tracking/main-screen-anchors.json','utf8'));
for(const key of supplied.keys.main){
  assert.deepEqual(data.tracks.main[key.frame],key.quad,'Prepared tracks must preserve the supplied main-screen pins exactly');
  const restored=normalizeKeys(supplied.keys,data);
  assert.deepEqual(trackedQuad(data.tracks.main,key.frame/data.fps,data.fps,restored.main),key.quad,'Restoring the saved editor draft must not apply the correction twice');
}
const shift=(q,dx,dy)=>q.map(([x,y])=>[x+dx,y+dy]);
const keys=normalizeKeys({main:[{frame:0,quad:shift(data.tracks.main[0],5,8)},{frame:120,quad:shift(data.tracks.main[120],15,-2)}]},data);
assert.deepEqual(trackedQuad(data.tracks.main,0,24,keys.main),keys.main[0].quad);
assert.deepEqual(trackedQuad(data.tracks.main,5,24,keys.main),keys.main[1].quad);
const mid=trackedQuad(data.tracks.main,2.5,24,keys.main);
mid.forEach((p,i)=>{assert.ok(Math.abs(p[0]-data.tracks.main[60][i][0]-10)<1e-8);assert.ok(Math.abs(p[1]-data.tracks.main[60][i][1]-3)<1e-8);});
assert.equal(normalizeKeys({main:[{frame:0,quad:[[0,0],[1,1],[0,1],[1,0]]}]},data).main.length,0);
assert.equal(trackedQuad(data.tracks.signLeft,2,24,[]),null);
let corners=0;
for(const track of Object.values(data.tracks))for(const q of track){
  if(!q)continue;assert.ok(validQuad(q));
  const {matrix:m}=project(q,1.5,768,400);
  [[0,0],[768,0],[768,400],[0,400]].forEach(([x,y],i)=>{
    const w=m[3]*x+m[7]*y+m[15];
    assert.ok(Math.abs((m[0]*x+m[4]*y+m[12])/w-q[i][0]*1.5)<1e-6);
    assert.ok(Math.abs((m[1]*x+m[5]*y+m[13])/w-q[i][1]*1.5)<1e-6);corners++;
  });
}
function harness(useFrameCallback){
  const queue=new Map(),events={},drawn=[];let id=0,callback,currentTime=0;
  const video={readyState:1,seeking:false,duration:10.041667,
    get currentTime(){return currentTime;},set currentTime(value){currentTime=value;video.seeking=true;},
    addEventListener:(name,fn)=>events[name]=fn,removeEventListener:name=>delete events[name]};
  if(useFrameCallback){video.requestVideoFrameCallback=fn=>{callback=fn;return 1;};video.cancelVideoFrameCallback=()=>{};}
  const seeker=createSeeker(video,{fps:24,lastTime:10,onFrame:time=>drawn.push(time),now:()=>performance.now(),raf:fn=>{queue.set(++id,fn);return id;},caf:key=>queue.delete(key)});
  const flush=()=>{const jobs=[...queue.values()];queue.clear();jobs.forEach(fn=>fn());};
  const complete=()=>{video.seeking=false;video.readyState=2;events.seeked();if(useFrameCallback)callback(0,{mediaTime:Math.floor(currentTime*24)/24});flush();};
  return {video,seeker,queue,drawn,flush,complete,events,callback:time=>callback(0,{mediaTime:time})};
}
for(const useCallbacks of [true,false]){
  const h=harness(useCallbacks);
  h.seeker.request(2);h.flush();assert.equal(h.video.currentTime,2.001);
  if(useCallbacks){h.callback(0);h.flush();assert.equal(h.drawn.length,0,'Ignore a late callback for the frame before the seek');}
  h.seeker.request(3);h.seeker.request(7);h.flush();assert.equal(h.video.currentTime,2.001);
  assert.equal(h.drawn.length,0,'Do not move content before the frame is presented');
  h.complete();assert.equal(h.video.currentTime,7.001);assert.deepEqual(h.drawn,[2]);
  h.complete();assert.deepEqual(h.drawn,[2,7]);
  h.events.seeked();h.flush();assert.deepEqual(h.drawn,[2,7],'Never render the same frame twice');
  h.seeker.request(1);h.flush();h.complete();assert.equal(h.drawn.at(-1),1);
  h.seeker.request(20);h.flush();h.complete();assert.equal(h.drawn.at(-1),10);
  h.seeker.request(4);h.seeker.destroy();h.flush();assert.equal(h.video.currentTime,10.001);
}
// Measure all five surfaces across the clip, excluding browser decoding/painting.
const start=performance.now();let frames=0;
for(let pass=0;pass<30;pass++)for(let f=0;f<data.frameCount;f++){
  for(const [name,track] of Object.entries(data.tracks)){
    const q=trackedQuad(track,f/data.fps,data.fps,keys[name]);if(q)project(q,1.5,768,400);
  }frames++;
}
const ms=(performance.now()-start)/frames;
console.log(`Passed ${corners} fixed-plane corners, exact anchors, interpolated corrections, invalid-key rejection, and decoded-frame seek scheduling.`);
console.log(`Five-surface mapping benchmark: ${ms.toFixed(3)} ms/frame (${frames} frames; excludes browser decode/paint).`);
