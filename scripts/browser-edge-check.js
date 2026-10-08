async (page) => {
 const check=(ok,label)=>{if(!ok)throw new Error(label);};
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.__bizmasiScene);
 await page.screenshot({path:'E:/Bizmasi/output/playwright/bizmasi-3d-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('.department').nth(2).click();
 await page.waitForTimeout(100);
 const first=await page.evaluate(()=>window.__bizmasiScene.getState().position);
 await page.waitForTimeout(180);
 const second=await page.evaluate(()=>window.__bizmasiScene.getState().position);
 check(first.every((n,i)=>Math.abs(n-second[i])<.01),'Reduced motion must finish camera movement promptly');
 await page.keyboard.press('Escape');await page.locator('#reset').click();
 await page.goto('http://127.0.0.1:4173/#/tu-van');
 await page.locator('.consulting-source summary').first().click();
 check((await page.locator('.consulting-source').innerText()).includes('Chủ doanh nghiệp bị quá tải sự vụ'),'Source consulting sections retained');
 const context=await page.context().browser().newContext();
 await context.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){if(String(type).startsWith('webgl'))return null;return original.call(this,type,...args);};
 });
 const fallback=await context.newPage();
 await fallback.goto('http://127.0.0.1:4173');
 await fallback.waitForFunction(()=>document.querySelector('#scene-status').textContent.includes('Thiết bị'));
 check(await fallback.locator('#list-view').isVisible(),'WebGL failure shows accessible list');
 await fallback.locator('.department').first().click();
 check(await fallback.locator('#detail .doc-card').count()===12,'Documents work without WebGL');
 await fallback.screenshot({path:'E:/Bizmasi/output/playwright/bizmasi-3d-fallback.png'});
 await context.close();
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('http://127.0.0.1:4173');
 await page.waitForFunction(()=>window.__bizmasiScene);
 await page.screenshot({path:'E:/Bizmasi/output/playwright/bizmasi-3d-desktop.png'});
 return {passed:['Reduced-motion camera','Source consultation details','No-WebGL list','No-WebGL document access']};
}
