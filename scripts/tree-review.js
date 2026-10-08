async (page) => {
  const results = [], errors = [];
  const check = (ok, label) => { if (!ok) throw new Error(label); results.push(label); };
  const state = () => page.evaluate(() => window.__bizmasiScene.getState());
  const settle = async () => {
    if ((await state()).motionEnabled) await page.locator('#nature-motion').click();
    await page.waitForFunction(() => !window.__bizmasiScene.getState().running);
  };
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:4173/');
  await page.waitForFunction(() => window.__bizmasiScene?.getState().version === 'flowering-tree-v2');
  await settle();
  const initial = await state();
  await page.waitForTimeout(300);
  check((await state()).frames === initial.frames, 'Rendering stops when the scene is still');
  check(initial.visibleLabels.join(',') === '0,1,2', 'Only the three front-facing labels appear initially');
  check(await page.locator('.tree-label[aria-hidden="true"][tabindex="-1"]').count() === 3, 'Rear labels are hidden from keyboard and accessibility tree');
  const world = await page.locator('#world').boundingBox();
  check(world.width === 1440 && world.height >= 900, 'Tree scene fills the homepage viewport');
  await page.screenshot({path:'E:/Bizmasi/output/playwright/flowering-tree-desktop.png'});

  const reached = new Set();
  for (let i = 0; i < 6; i++) {
    await page.evaluate(index => window.__bizmasiScene.focus(index), i);
    await settle();
    const view = await state();
    view.visibleLabels.forEach(index => reached.add(index));
    check(view.visibleLabels.includes(i) && view.visibleLabels.length <= 3, 'Rotation reveals branch ' + (i + 1) + ' with rear labels hidden');
    await page.locator('.tree-label').nth(i).click();
    check(await page.locator('#detail .doc-card').count() === [12,4,3,2,2,2][i], 'Branch ' + (i + 1) + ' opens its correct documents');
    await page.keyboard.press('Escape');
  }
  check(reached.size === 6, 'All six branches can be discovered around the tree');
  await page.evaluate(() => window.__bizmasiScene.focus(4));
  await settle();
  check((await state()).visibleLabels.join(',') === '3,4,5', 'Opposite side shows exactly the opposite three branches');
  await page.screenshot({path:'E:/Bizmasi/output/playwright/flowering-tree-back.png'});
  await page.locator('#reset').click();
  await settle();
  const reset = await state();
  check(reset.position.every((n,i) => Math.abs(n - initial.position[i]) < .02), 'Reset restores the original camera');

  await page.mouse.move(810,820);
  await page.mouse.down();
  await page.mouse.move(1120,810,{steps:25});
  await page.mouse.up();
  await settle();
  const orbit = await state();
  check(JSON.stringify(orbit.position) !== JSON.stringify(reset.position), 'Dragging orbits the real 3D tree');
  check(orbit.visibleLabels.length > 0 && orbit.visibleLabels.length <= 3, 'Dragging never displays all six labels');
  await page.locator('#zoom-in').click();
  await settle();
  check(JSON.stringify((await state()).position) !== JSON.stringify(orbit.position), 'Zoom changes camera distance');
  await page.screenshot({path:'E:/Bizmasi/output/playwright/flowering-tree-closeup.png'});
  await page.locator('#reset').click();
  await settle();

  await page.locator('#fullscreen').click();
  check(await page.evaluate(() => !!document.fullscreenElement), 'Fullscreen opens');
  await page.evaluate(() => document.exitFullscreen());
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(() => window.__bizmasiScene.focus(3));
  await page.waitForTimeout(120);
  const a = (await state()).position;
  await page.waitForTimeout(120);
  check((await state()).position.every((n,i) => Math.abs(n-a[i]) < .01), 'Reduced motion completes rotation immediately');

  await page.locator('#reset').click();
  await page.setViewportSize({width:390,height:844});
  await settle();
  check(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'Mobile page has no horizontal overflow');
  const mobile = await state();
  check(mobile.visibleLabels.length >= 1 && mobile.visibleLabels.length <= 3, 'Mobile shows only readable front-facing branches');
  for (let i = 0; i < 6; i++) {
    await page.evaluate(index => window.__bizmasiScene.focus(index), i);
    await settle();
    check((await state()).visibleLabels.includes(i), 'Mobile rotation can reveal branch ' + (i+1));
  }
  await page.locator('.tree-label').nth(5).click();
  check(await page.locator('#detail .doc-card').count() === 2, 'Mobile branch opens the document bottom sheet');
  await page.screenshot({path:'E:/Bizmasi/output/playwright/flowering-tree-mobile-detail.png'});
  await page.keyboard.press('Escape');
  await page.locator('#reset').click();
  await settle();
  await page.screenshot({path:'E:/Bizmasi/output/playwright/flowering-tree-mobile.png'});
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('#reset').click();
  await settle();
  check(errors.length === 0, 'No JavaScript runtime errors');
  return {results, errors, desktop:initial, mobile};
}
