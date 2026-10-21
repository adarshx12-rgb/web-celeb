const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Exercise the real download handler, capturing the generated file without a browser.
const app=fs.readFileSync('site/concert.js','utf8');
const start=app.indexOf("  const scriptSafe=");
const end=app.indexOf('\n  if(!exported){',start);
assert.ok(start>0&&end>start);
const state={name:"Alex $& $` $' $$",note:'A message with </script><script>unexpected()</script>',photos:[],trackingKeys:{main:[{frame:0,quad:[[100,100],[300,100],[300,200],[100,200]]}]}};
const assets={flight:'/assets/concert/concert-scrub.mp4',poster:'/assets/concert/flight-poster.jpg',finale:'/assets/concert/flight-finale.jpg'};
const embedded=Object.fromEntries(Object.entries(assets).map(([key])=>[key,`data:${key==='flight'?'video/mp4':'image/jpeg'};base64,${Buffer.from(key).toString('base64')}`]));
let handler,download,clicked=false;
const messages=[];
const button={addEventListener:(_,fn)=>handler=fn};
const context=vm.createContext({
  $:selector=>selector==='#download-concert'?button:{reportValidity:()=>true},
  uploadBusy:false,state,assets,normalize:value=>value,
  status:message=>messages.push(message),toast:()=>{},
  fetchText:async url=>fs.readFileSync('site/dist'+url,'utf8'),
  dataUrl:async url=>embedded[Object.keys(assets).find(key=>assets[key]===url)],
  Blob,URL:{createObjectURL:blob=>{download=blob;return 'blob:test';},revokeObjectURL:()=>{}},
  document:{createElement:()=>({click:()=>{clicked=true;}})},setTimeout:()=>{}
});
vm.runInContext(app.slice(start,end),context);
(async()=>{
  await handler();
  assert.ok(clicked,messages.join('\n'));
  assert.equal(button.disabled,false);
  const html=await download.text();
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match=>match[1]);
  assert.equal(scripts.length,6);
  for(const source of scripts)new vm.Script(source);
  const recipient=vm.createContext({window:{}});
  vm.runInContext(scripts[0],recipient);
  assert.deepEqual(JSON.parse(JSON.stringify(recipient.window.CONCERT_DATA)),state);
  assert.equal(recipient.window.CONCERT_EXPORT,true);
  assert.equal(html.split(embedded.flight).length-1,1,'Embed the video only once');
  const markup=html.replace(/<script>[\s\S]*?<\/script>/g,'');
  assert.ok(!/<script\b[^>]*src=/.test(markup),'No external application scripts');
  assert.ok(!markup.includes('href="/concert.css"'));
  console.log('Passed exported script syntax, literal special characters, recipient data, and single embedded video checks.');
})().catch(error=>{console.error(error);process.exitCode=1;});
