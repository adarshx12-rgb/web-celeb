const {chromium}=require(process.env.CONCERT_PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const base='http://127.0.0.1:5173';
async function frame(page,time){
  await page.waitForFunction(target=>{
    const video=document.querySelector('#concert-video');
    return video.readyState>=2&&!video.seeking&&Math.abs(video.currentTime-target)<.1;
  },time);
}
async function tool(page,id){
  await page.evaluate(()=>document.dispatchEvent(new Event('pointermove')));
  await page.click(id);
}
async function phase(page,value){
  await page.waitForFunction(expected=>document.querySelector('.tracked-main').dataset.phase===expected,value);
}
(async()=>{
  await fs.mkdir('output',{recursive:true});
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
    // Use local assets and uploaded photos without relying on third-party services.
    await context.route(/https:\/\/(fonts\.(googleapis|gstatic)\.com|images\.unsplash\.com)\//,route=>route.abort());
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/concert.html');await frame(page,0);
    await page.click('#enter-concert');
    const initial=await page.evaluate(()=>({entered:document.body.classList.contains('immersive'),scroll:scrollY,header:getComputedStyle(document.querySelector('.concert-header')).display,surfaces:document.querySelectorAll('[data-surface]').length,end:document.documentElement.scrollHeight-innerHeight}));
    assert.ok(initial.entered);assert.equal(initial.scroll,0);assert.equal(initial.header,'none');assert.equal(initial.surfaces,5);
    assert.ok(initial.end>=6200,'The immersive concert must have a real page scroll range');
    await page.screenshot({path:'output/concert-enter.png'});
    await page.mouse.move(720,450);await page.mouse.wheel(0,900);
    await page.waitForFunction(()=>scrollY>500&&document.querySelector('#concert-video').currentTime>.5);
    await page.keyboard.press('PageDown');
    await page.waitForFunction(()=>scrollY>1000&&document.querySelector('#concert-video').currentTime>1);
    await page.mouse.wheel(0,-10000);await frame(page,0);
    await tool(page,'#edit-tracking');
    await page.waitForFunction(()=>!document.querySelector('.tracking-anchor').disabled);
    await page.focus('.tracking-anchor[data-corner="0"]');await page.keyboard.press('Shift+ArrowRight');
    await page.click('.tracking-save');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('little-cheers-headliner-v1')).trackingKeys.main.length),1);
    await tool(page,'#edit-cards');
    await page.fill('#left-sign','Happy birthday, {name}!');await page.fill('#right-sign','Your people are here.');
    await page.fill('#concert-name','Alex $&');await page.click('#preview-cards');await frame(page,0);
    assert.equal(await page.locator('[data-sign=left]').textContent(),'Happy birthday, Alex $&!');
    await page.evaluate(end=>scrollTo(0,end*.4),initial.end);await frame(page,10*.4/.82);
    assert.ok(await page.locator('[data-sign=left]').isHidden());
    assert.ok(await page.locator('[data-sign=right]').isHidden());
    await page.screenshot({path:'output/concert-flight.png'});
    await tool(page,'#edit-screens');
    await page.fill('#screen-headline','Tonight is yours');await page.fill('#concert-name','Adarsh');
    await page.setInputFiles('#concert-photos','site/assets/concert/concert-cover.webp');
    await page.waitForFunction(()=>document.querySelectorAll('.photo-thumb').length===1);
    await page.fill('.photo-thumb input','Best night ever');
    await page.click('button[type=submit]');await frame(page,10);await phase(page,'photos');
    assert.equal(await page.locator('#memory-caption').textContent(),'Best night ever');
    await page.screenshot({path:'output/concert-stage.png'});
    await tool(page,'#show-dedication');await phase(page,'note');
    await tool(page,'#show-dedication');await phase(page,'photos');
    await tool(page,'#exit-concert');await page.click('#enter-concert');await frame(page,0);
    assert.equal(await page.evaluate(()=>scrollY),0);
    await page.reload();await page.click('#edit-trigger');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('little-cheers-headliner-v1')).trackingKeys.main.length),1);
    assert.equal(await page.inputValue('#concert-name'),'Adarsh');
    assert.equal(await page.locator('.photo-thumb').count(),1);
    const downloadEvent=page.waitForEvent('download');await page.click('#download-concert');
    const download=await downloadEvent;const recipientFile=path.resolve('output/concert-recipient.html');
    await download.saveAs(recipientFile);
    await page.click('#close-personalize');await page.setViewportSize({width:390,height:844});
    await page.click('#enter-concert');await frame(page,0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:'output/concert-mobile.png'});
    await page.emulateMedia({reducedMotion:'reduce'});await frame(page,10);await phase(page,'photos');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight<=1));
    await page.click('#show-dedication');await phase(page,'note');
    await page.click('#show-dedication');await phase(page,'photos');
    await page.click('#next-memory');assert.equal(await page.locator('#memory-caption').textContent(),'Best night ever');
    const recipientContext=await browser.newContext({offline:true,reducedMotion:'reduce'});
    const recipient=await recipientContext.newPage();recipient.on('pageerror',e=>errors.push(e.message));
    await recipient.goto(pathToFileURL(recipientFile).href);await recipient.click('#enter-concert');await frame(recipient,10);
    assert.ok(await recipient.locator('#edit-screens').isHidden());
    assert.equal(await recipient.locator('#memory-caption').textContent(),'Best night ever');
    await recipient.click('#show-dedication');await phase(recipient,'note');
    const performance=await page.evaluate(()=>window.concertPerformance());
    await fs.writeFile('output/concert-performance.json',JSON.stringify(performance,null,2));
    assert.ok(performance.frames>0);assert.ok(performance.seeks>0);
    assert.deepEqual(errors,[]);
    console.log('Passed video seeking, anchor editing/persistence, audience notes, editing, saved drafts, mobile, reduced motion, and offline recipient download.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
