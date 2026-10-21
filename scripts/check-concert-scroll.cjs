const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('site/concert.js','utf8');
const queue=[];
const events={};
const heights={};
const updates=[];
const seeks=[];
const jumps=[];
const window={scrollY:0,addEventListener:(name,fn)=>events[name]=fn,scrollTo:options=>{window.scrollY=options.top;jumps.push(options);}};
const context=vm.createContext({
  calibration:null,entered:false,journeyDistance:0,scrollQueued:0,innerHeight:900,reduced:{matches:false},window,
  document:{documentElement:{style:{setProperty:(key,value)=>heights[key]=value}}},
  tracking:{lastTime:10},updateProgress:value=>updates.push(value),requestTime:value=>seeks.push(value),
  requestAnimationFrame:fn=>{queue.push(fn);return queue.length;}
});
vm.runInContext(source.slice(source.indexOf('  function setupMotion(){'),source.indexOf('  function revealTools(){')),context);
context.setupMotion();assert.equal(context.journeyDistance,0);
context.entered=true;context.setupMotion();assert.equal(context.journeyDistance,7200);assert.equal(heights['--journey-height'],'8100px');
window.scrollY=3600;events.scroll();events.scroll();assert.equal(queue.length,1);queue.shift()();assert.equal(updates.at(-1),.5);
window.scrollY=720;events.scroll();queue.shift()();assert.equal(updates.at(-1),.1);
context.jump(.8);assert.equal(jumps.at(-1).top,5760);
context.innerHeight=600;context.setupMotion();assert.equal(context.journeyDistance,6200);
window.scrollY=10000;events.scroll();queue.shift()();assert.equal(updates.at(-1),1);
context.reduced.matches=true;context.setupMotion();assert.equal(context.journeyDistance,0);assert.equal(seeks.at(-1),10);
context.jump(.97);assert.equal(updates.at(-1),.97);
context.entered=false;context.setupMotion();assert.equal(updates.at(-1),0);
events.scroll();assert.equal(queue.length,0);

console.log('Passed native scroll entry, forward/reverse progress, jumps, resize, reduced motion, and exit.');
