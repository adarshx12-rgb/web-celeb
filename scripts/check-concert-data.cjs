const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {quadAt,project,inside}=require('../site/concert-projection.js');
const context={window:{}};vm.createContext(context);
vm.runInContext(fs.readFileSync('site/concert-tracking.js','utf8'),context);
const data=context.window.CONCERT_TRACKING;
assert.equal(data.frameCount,241);assert.equal(data.lastTime,10);
let checks=0;
for(const [name,track]of Object.entries(data.tracks)){
  assert.equal(track.length,data.frameCount);
  for(let frame=0;frame<data.frameCount;frame++){
    const q=quadAt(track,frame/data.fps,data.fps);
    if(!q){assert.ok(name.startsWith('sign')&&frame>30);continue;}
    assert.ok(q.flat().every(Number.isFinite));
    const cx=q.reduce((s,p)=>s+p[0],0)/4,cy=q.reduce((s,p)=>s+p[1],0)/4;
    assert.ok(inside(cx,cy,q),`${name} frame ${frame} is not convex`);
    for(const scale of [.625,1,1.875]){
      const {matrix:m,width,height}=project(q,scale);
      for(const [i,[x,y]]of [[0,0],[width,0],[width,height],[0,height]].entries()){
        const w=m[3]*x+m[7]*y+m[15];
        const actual=[(m[0]*x+m[4]*y+m[12])/w,(m[1]*x+m[5]*y+m[13])/w];
        assert.ok(Math.abs(actual[0]-q[i][0]*scale)<1e-5&&Math.abs(actual[1]-q[i][1]*scale)<1e-5,`${name} frame ${frame} projection corner ${i}`);
        checks++;
      }
    }
  }
}
assert.equal(quadAt(data.tracks.signLeft,2,data.fps),null);
assert.equal(quadAt(data.tracks.signRight,2,data.fps),null);
assert.equal(project([[0,0],[0,0],[0,0],[0,0]]),null);
const html=fs.readFileSync('site/concert.html','utf8'),js=fs.readFileSync('site/concert.js','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size);
for(const match of js.matchAll(/\$\('#([a-z][a-z0-9-]*)'\)/g))assert.ok(ids.includes(match[1]),`Missing #${match[1]}`);
assert.match(html,/<textarea[^>]+id="left-sign"/);assert.match(html,/<textarea[^>]+id="right-sign"/);
console.log(`Passed ${checks} screen/placard projection corner checks, track lifetimes, and editor bindings.`);
(async()=>{
  const base='http://127.0.0.1:5173';
  const video='/assets/concert/concert-scrub.mp4',size=fs.statSync('site'+video).size;
  const head=await fetch(base+video,{method:'HEAD'});
  assert.equal(head.status,200);assert.equal(head.headers.get('content-type'),'video/mp4');assert.equal(Number(head.headers.get('content-length')),size);
  for(const [range,length,expected]of [['bytes=0-1023',1024,206],['bytes=-512',512,206],[`bytes=${size}-`,0,416]]){
    const response=await fetch(base+video,{headers:{Range:range}});
    assert.equal(response.status,expected);assert.equal((await response.arrayBuffer()).byteLength,length);
  }
  for(const route of ['/concert.html','/concert.css','/concert.js','/concert-tracking.js','/concert-projection.js','/concert-tracker.js','/concert-calibration.js']){
    const response=await fetch(base+route);assert.equal(response.status,200);
    assert.equal(await response.text(),fs.readFileSync('site'+route,'utf8'),`Stale build: ${route}`);
  }
  console.log('Passed video MIME/byte-range/invalid-range checks; live files match source.');
})().catch(error=>{console.error(error);process.exitCode=1});
