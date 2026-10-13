import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { base, visit, evaluate, command, screenshot, close } from './helpers/browser.mjs';

const route = '/arquitectura/proyecto-ejemplo';
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const waitForNavigation = () => evaluate('new Promise(resolve => setTimeout(resolve, 150))');

test('every Arquitectura card opens the shared detail in grid/list and with keyboard', async () => {
  await visit(1100, '/arquitectura');
  const links = await evaluate("[...document.querySelectorAll('.catalogue-item .project-card__link')].map(a => ({href:a.getAttribute('href'),name:a.getAttribute('aria-label')}))");
  assert.equal(links.length, 12);
  assert.ok(links.every(a => a.href === route && a.name.length > 5));
  const first = await evaluate("(() => {const r=document.querySelector('.project-card').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
  await command('Input.dispatchMouseEvent', { type:'mousePressed', ...first, button:'left', clickCount:1 });
  await command('Input.dispatchMouseEvent', { type:'mouseReleased', ...first, button:'left', clickCount:1 });
  await waitForNavigation();
  assert.equal(await evaluate('location.pathname'), route);
  await visit(1100, '/arquitectura');
  await click('[data-view="list"]');
  await click('[data-filter="status"][data-value="en-progreso"]');
  assert.equal(await evaluate("document.querySelector('.architecture-catalogue').dataset.view"), 'list');
  await evaluate("document.querySelector('.catalogue-item:not([hidden]) .project-card__link').focus()");
  // Keyboard modality is established by real Tab navigation, not focus() alone.
  await command('Input.dispatchKeyEvent', {type:'keyDown', key:'Tab', code:'Tab', windowsVirtualKeyCode:9});
  await command('Input.dispatchKeyEvent', {type:'keyUp', key:'Tab', code:'Tab', windowsVirtualKeyCode:9});
  await command('Input.dispatchKeyEvent', {type:'keyDown', key:'Tab', code:'Tab', windowsVirtualKeyCode:9, modifiers:8});
  await command('Input.dispatchKeyEvent', {type:'keyUp', key:'Tab', code:'Tab', windowsVirtualKeyCode:9, modifiers:8});
  assert.equal(await evaluate("document.activeElement.matches('.project-card__link')"), true);
  assert.notEqual(await evaluate('getComputedStyle(document.activeElement).outlineStyle'), 'none');
  await command('Input.dispatchKeyEvent', {type:'keyDown', key:'Enter', code:'Enter', windowsVirtualKeyCode:13});
  await command('Input.dispatchKeyEvent', {type:'keyUp', key:'Enter', code:'Enter', windowsVirtualKeyCode:13});
  await waitForNavigation();
  assert.equal(await evaluate('location.pathname'), route);
});

test('detail reproduces reference structure, copy, assets and desktop geometry', async () => {
  assert.equal((await fetch(new URL(route, base))).status, 200);
  await visit(1100, route);
  const state = await evaluate(`(() => {
    const rect = s => {const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
    return {lang:document.documentElement.lang,title:document.querySelector('h1').textContent.trim(),
      header:rect('.site-header'),hero:rect('.project-detail-hero'),facts:rect('.project-facts'),
      first:rect('.project-gallery--exterior'),plans:rect('.project-plans'),footer:rect('.site-footer'),
      active:document.querySelector('.site-nav [aria-current="page"]')?.textContent.trim(),
      factsCopy:[...document.querySelectorAll('.project-facts dd')].map(d=>d.textContent.trim()),
      text:[...document.querySelectorAll('.project-narrative p')].map(p=>p.textContent.trim()).join(' '),
      photos:[...document.querySelectorAll('.project-photo')].map(i=>{const r=i.getBoundingClientRect();return {src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,x:r.x,y:r.y,width:r.width,height:r.height};}),
      plansCopy:[...document.querySelectorAll('.project-plan figcaption')].map(c=>c.textContent.trim()),
      planLinks:[...document.querySelectorAll('.project-plan a')].map(a=>a.getAttribute('href'))};
  })()`);
  assert.equal(state.lang, 'es');
  assert.equal(state.title, 'La Riva Sherryhomes');
  assert.equal(state.active, 'Arquitectura');
  assert.deepEqual(state.factsCopy, ['Jerez de la Frontera', '2026', 'Residencial', '700 m²', 'Terminado', 'Privado']);
  assert.ok(state.text.includes('regeneración urbana mediante la reutilización de estructuras existentes'));
  assert.ok(state.text.includes('economía circular aplicado a la edificación'));
  assert.ok(state.text.includes('residencial sostenible y de alta calidad espacial'));
  assert.equal(state.header.height, 52);
  assert.equal(state.hero.y, 52);
  assert.ok(Math.abs(state.hero.height - 400) < .1);
  assert.equal(state.facts.height, 75);
  assert.ok(Math.abs(state.first.y - 642) < .1);
  assert.ok(Math.abs(state.footer.y - 4948) < 5, JSON.stringify(state.footer));
  assert.equal(state.photos.length, 14);
  assert.ok(state.photos.every(i=>i.loaded && i.src.startsWith('/images/project/')));
  const slots = [
    ['hero',0,52,1100,400], ['facade',0,642,723,590], ['roof',733,642,367,590],
    ['garden',0,1242,367,390], ['pool',377,1242,723,570],
    ['interior',0,2017,723,590], ['arches',733,2017,367,590],
    ['pergola',0,2617,367,326], ['elevation',377,2617,723,326],
    ['gate',0,3240,360,527], ['passage',370,3240,360,527], ['courtyard',740,3240,360,527],
    ['stair',557,3777,268,363], ['landing',832,3777,268,363],
  ];
  for (const [index,[name,x,y,width,height]] of slots.entries()) {
    const photo = state.photos[index];
    assert.equal(photo.src, `/images/project/${name}.png`);
    for (const [key,value] of Object.entries({x,y,width,height})) assert.ok(Math.abs(photo[key]-value)<.1, `${name} ${key}: ${photo[key]}`);
  }
  assert.deepEqual(state.plansCopy, ['01','02','03','04','05','06']);
  for (const href of state.planLinks) assert.equal((await fetch(new URL(href, base))).status, 200);
  await screenshot('project-detail-desktop');
});

test('responsive detail preserves every asset and readable copy without overflow', async () => {
  for (const width of [320,375,600,601,768,1100,1440,1920]) {
    await visit(width, route);
    const state = await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,
      images:[...document.images].map(i=>{const r=i.getBoundingClientRect();return {loaded:i.complete&&i.naturalWidth>0,x:r.x,right:r.right,width:r.width,height:r.height};}),
      textSize:parseFloat(getComputedStyle(document.querySelector('.project-narrative p')).fontSize),
      facts:[...document.querySelectorAll('.project-facts>div')].map(i=>{const r=i.getBoundingClientRect();return {x:r.x,right:r.right};}),
      links:[...document.querySelectorAll('.project-adjacent a,.site-nav a')].map(a=>{const r=a.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,height:r.height};})})`);
    assert.equal(state.overflow, false, `Overflow at ${width}`);
    assert.equal(state.images.length, 22);
    assert.ok(state.images.every(i=>i.loaded&&i.width>0&&i.height>0&&i.x>=-1&&i.right<=width+1), `Images at ${width}`);
    assert.ok([...state.facts,...state.links].every(r=>r.x>=-1&&r.right<=width+1), `Controls at ${width}`);
    assert.ok(state.textSize >= (width<=800?13:12), `Readability at ${width}`);
    if ([375,768,1440,1920].includes(width)) await screenshot(`project-detail-${width}`);
  }
});

test('detail return links work and shared home cards remain unchanged', async () => {
  await visit(1100, route);
  assert.equal(await evaluate("document.querySelector('.brand').getAttribute('href')"), '/');
  assert.equal(await evaluate("document.querySelector('.site-nav a:nth-child(2)').getAttribute('href')"), '/estudio');
  assert.equal(await evaluate("document.querySelector('.site-nav a:nth-child(3)').getAttribute('href')"), '/contacto');
  for (const [selector,hash] of [['.project-adjacent a:first-child','#torre-darenas'],['.project-adjacent a:last-child','#hotel-soho']]) {
    await visit(1100, route);
    await click(selector);
    await waitForNavigation();
    assert.equal(await evaluate('location.pathname'), '/arquitectura');
    assert.equal(await evaluate('location.hash'), hash);
  }
  await visit(1100, route);
  await click('.brand');
  await waitForNavigation();
  assert.equal(await evaluate('location.pathname'), '/');
  await visit(1100);
  assert.equal(await evaluate("document.querySelectorAll('.selected-projects .project-card').length"), 9);
  assert.equal(await evaluate("document.querySelectorAll('.selected-projects .project-card__link').length"), 0);
  assert.equal(await evaluate("document.querySelector('.brand').getAttribute('href')"), '#inicio');
  assert.equal(await evaluate("[...document.querySelectorAll('.project-index a[href^=\"#\"]')].every(a=>document.querySelector(a.getAttribute('href'))!==null)"), true);
});

after(close);
