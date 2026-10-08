async (page) => {
 const results=[],errors=[];const check=(ok,label)=>{if(!ok)throw new Error(label);results.push(label);};
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>window.__bizmasiScene);
 await page.waitForFunction(()=>!window.__bizmasiScene.getState().running);
 const first=await page.evaluate(()=>window.__bizmasiScene.getState());
 await page.waitForTimeout(500);
 check((await page.evaluate(()=>window.__bizmasiScene.getState().frames))===first.frames,'Rendering parks while tree is still');
 const world=await page.locator('#world').boundingBox();
 check(world.width===1440&&world.height>=900,'3D scene fills homepage viewport beneath header');
 for(let i=0;i<6;i++){
  await page.locator('.tree-label').nth(i).click();
  await page.waitForTimeout(1250);
  check(await page.locator('#detail .doc-card').count()===[12,4,3,2,2,2][i],'Branch '+(i+1)+' opens correct documents');
  if(i===0){const focused=await page.evaluate(()=>window.__bizmasiScene.getState());check(JSON.stringify(first.position)!==JSON.stringify(focused.position),'Branch selection rotates camera');await page.screenshot({path:'E:/Bizmasi/output/playwright/ancient-tree-branch.png'});}
  await page.keyboard.press('Escape');
 }
 await page.locator('#reset').click();await page.waitForTimeout(1350);
 const reset=await page.evaluate(()=>window.__bizmasiScene.getState());
 check(reset.position.every((n,i)=>Math.abs(n-first.position[i])<.02),'Reset restores original camera');
 await page.mouse.move(830,610);await page.mouse.down();await page.mouse.move(1090,580,{steps:20});await page.mouse.up();await page.waitForTimeout(700);
 const orbit=await page.evaluate(()=>window.__bizmasiScene.getState());
 check(JSON.stringify(orbit.position)!==JSON.stringify(reset.position),'Dragging rotates the real 3D tree');
 await page.screenshot({path:'E:/Bizmasi/output/playwright/ancient-tree-orbit.png'});
 await page.locator('#zoom-in').click();await page.locator('#zoom-in').click();
 const zoom=await page.evaluate(()=>window.__bizmasiScene.getState());
 check(JSON.stringify(zoom.position)!==JSON.stringify(orbit.position),'Zoom changes camera position');
 await page.screenshot({path:'E:/Bizmasi/output/playwright/ancient-tree-closeup.png'});
 await page.locator('#reset').click();await page.waitForTimeout(1350);
 await page.locator('#fullscreen').click();
 check(await page.evaluate(()=>!!document.fullscreenElement),'Fullscreen opens');
 await page.evaluate(()=>document.exitFullscreen());
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('.tree-label').nth(3).click();await page.waitForTimeout(150);
 const a=await page.evaluate(()=>window.__bizmasiScene.getState().position);
 await page.waitForTimeout(150);
 const b=await page.evaluate(()=>window.__bizmasiScene.getState().position);
 check(a.every((n,i)=>Math.abs(n-b[i])<.01),'Reduced motion completes focus promptly');
 await page.keyboard.press('Escape');await page.locator('#reset').click();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 check(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Mobile has no horizontal page overflow');
 check(await page.locator('.tree-label:visible').count()===6,'Six mobile branch labels remain reachable');
 const boxes=await page.locator('.tree-label').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
 check(boxes.every(r=>r.x>=0&&r.x+r.w<=391),'Mobile labels fit screen');
 await page.screenshot({path:'E:/Bizmasi/output/playwright/ancient-tree-final-mobile.png'});
 await page.locator('.tree-label').nth(4).click();
 check(await page.locator('#detail .doc-card').count()===2,'Mobile branch opens bottom sheet with documents');
 await page.screenshot({path:'E:/Bizmasi/output/playwright/ancient-tree-mobile-detail.png'});
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:1440,height:1000});await page.locator('#reset').click();
 await page.emulateMedia({reducedMotion:'no-preference'});
 check(errors.length===0,'No JavaScript runtime errors');
 await page.screenshot({path:'E:/Bizmasi/output/playwright/ancient-tree-final-desktop.png'});
 return {results,errors,scene:first};
}
