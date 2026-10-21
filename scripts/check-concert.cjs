const {chromium}=require(process.env.CONCERT_PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/concert.html',{waitUntil:'networkidle'});
    await page.click('#enter-concert');await page.waitForTimeout(500);
    await page.screenshot({path:'output/concert-enter-v2.png'});
    const initial=await page.evaluate(()=>({entered:document.body.classList.contains('immersive'),scroll:scrollY,header:getComputedStyle(document.querySelector('.concert-header')).display,jets:document.querySelectorAll('.fire-jet').length,end:ScrollTrigger.getById('headliner-journey').end}));
    assert.ok(initial.entered);assert.equal(initial.scroll,0);assert.equal(initial.header,'none');assert.equal(initial.jets,12);
    await page.evaluate(end=>scrollTo(0,end*.4),initial.end);await page.waitForTimeout(400);
    await page.screenshot({path:'output/concert-fire-v2.png'});
    await page.evaluate(end=>scrollTo(0,end*.8),initial.end);await page.waitForTimeout(400);
    await page.mouse.move(1300,40);await page.click('#edit-screens');
    await page.fill('#screen-headline','Tonight is yours');await page.fill('#concert-name','Adarsh');
    await page.setInputFiles('#concert-photos','site/assets/concert/concert-cover.webp');
    await page.waitForFunction(()=>document.querySelectorAll('.photo-thumb').length===1);
    await page.fill('.photo-thumb input','Best night ever');
    await page.click('button[type=submit]');await page.waitForTimeout(1200);
    await page.screenshot({path:'output/concert-stage-v2.png'});
    const content=await page.evaluate(()=>({name:document.querySelector('[data-name]').textContent,headline:document.querySelector('[data-headline]').textContent,caption:document.querySelector('#memory-caption').textContent}));
    assert.deepEqual(content,{name:'Adarsh',headline:'Tonight is yours',caption:'Best night ever'});
    await page.mouse.move(1300,40);await page.click('#exit-concert');await page.click('#enter-concert');
    assert.equal(await page.evaluate(()=>scrollY),0);
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
    await page.screenshot({path:'output/concert-mobile-v2.png'});
    assert.deepEqual(errors,[]);
    console.log('Passed: clean entry, 12 flame jets, screen photos/headline/caption, exit/reentry, mobile. No JavaScript errors.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
