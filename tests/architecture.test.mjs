import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { base, visit, evaluate, screenshot, close } from './helpers/browser.mjs';

const names = ["Torre D'Arenas", 'La Riva Sherryhomes', 'Hotel Soho Boutique Catedral', 'Edificio Áncora', 'Casa Nogal', 'Casa Carabela', '3 Horacias', 'Albareda 20', '100 Viviendas Austro', 'La Choza 2.0', 'Vivienda Avd. Andalucía', 'Vivienda CG'];
async function open(width = 1100) {
  assert.equal((await fetch(new URL('/arquitectura', base))).status, 200);
  await visit(width, '/arquitectura');
}
const visibleNames = () => evaluate("[...document.querySelectorAll('.catalogue-item:not([hidden]) h3')].map(h=>h.textContent.trim())");
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);

test('Arquitectura renders the Figma grid, originals, header and footer at 1100px', async () => {
  await open();
  const state = await evaluate(`(() => {
    const rect = s => { const r = document.querySelector(s).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; };
    return {lang:document.documentElement.lang,heading:document.querySelector('h1').textContent.trim(),
      counter:document.querySelector('[data-project-count]').textContent.trim(),
      header:rect('.site-header'),grid:rect('.architecture-catalogue'),footer:rect('.site-footer'),
      cards:[...document.querySelectorAll('.catalogue-item')].map(i=>{const r=i.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}),
      images:[...document.images].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height})),
      active:document.querySelector('.site-nav [aria-current="page"]')?.textContent.trim(),
      overflow:document.documentElement.scrollWidth>innerWidth};
  })()`);
  assert.equal(state.lang, 'es');
  assert.equal(state.heading, 'Arquitectura');
  assert.equal(state.counter, '27 proyectos');
  assert.equal(state.active, 'Arquitectura');
  assert.equal(state.overflow, false);
  assert.deepEqual(await visibleNames(), names);
  assert.equal(state.header.height, 52);
  assert.equal(state.grid.y, 202);
  assert.equal(state.footer.y, 2032);
  assert.equal(state.footer.height, 168);
  for (const [index, card] of state.cards.entries()) {
    assert.ok(Math.abs(card.x - [0,370,741][index%3]) < 2);
    assert.equal(card.y, 202 + Math.floor(index/3)*460);
    assert.ok(Math.abs(card.width - [359,360,359][index%3]) < 2);
    assert.equal(card.height, 450);
  }
  assert.equal(state.images.length, 14);
  for (const image of state.images) {
    assert.ok(image.src.startsWith('/images/architecture/'));
    assert.ok(image.loaded && image.width > 0 && image.height > 0, JSON.stringify(image));
  }
  await screenshot('architecture-desktop');
});

test('mock type/state filters combine, show empty results and reset without losing projects', async () => {
  await open();
  const stateFor = async selector => {
    await click(selector);
    return evaluate(`({names:[...document.querySelectorAll('.catalogue-item:not([hidden]) h3')].map(h=>h.textContent.trim()),
      count:document.querySelector('[data-project-count]').textContent.trim(),
      pressed:document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-pressed'),
      empty:!document.querySelector('[data-empty]').hidden})`);
  };
  let state = await stateFor('[data-filter="type"][data-value="residencial"]');
  assert.equal(state.names.length, 10);
  assert.equal(state.count, '10 proyectos');
  assert.equal(state.pressed, 'true');
  state = await stateFor('[data-filter="status"][data-value="en-progreso"]');
  assert.deepEqual(state.names, ['La Riva Sherryhomes', 'Vivienda Avd. Andalucía']);
  assert.equal(state.count, '2 proyectos');
  state = await stateFor('[data-filter="status"][data-value="proyecto"]');
  assert.deepEqual(state.names, ['100 Viviendas Austro', 'Vivienda CG']);
  state = await stateFor('[data-filter="status"][data-value="construido"]');
  assert.equal(state.names.length, 6);
  state = await stateFor('[data-filter="type"][data-value="rehabilitacion"]');
  assert.deepEqual(state.names, ['Hotel Soho Boutique Catedral', 'Albareda 20']);
  state = await stateFor('[data-filter="type"][data-value="cultural"]');
  assert.deepEqual(state.names, []);
  assert.equal(state.count, '0 proyectos');
  assert.equal(state.empty, true);
  await click('[data-reset]');
  assert.deepEqual(await visibleNames(), names);
  assert.equal(await evaluate("document.querySelector('[data-project-count]').textContent.trim()"), '27 proyectos');
  assert.equal(await evaluate("document.querySelector('[data-empty]').hidden"), true);
});

test('Grid/Lista toggles layout and keeps the filter selection', async () => {
  await open();
  await click('[data-filter="status"][data-value="en-progreso"]');
  await click('[data-view="list"]');
  assert.equal(await evaluate("document.querySelector('.architecture-catalogue').dataset.view"), 'list');
  assert.equal(await evaluate("document.querySelector('[data-view=list]').getAttribute('aria-pressed')"), 'true');
  assert.deepEqual(await visibleNames(), ['La Riva Sherryhomes', 'Vivienda Avd. Andalucía']);
  await click('[data-view="grid"]');
  assert.equal(await evaluate("document.querySelector('.architecture-catalogue').dataset.view"), 'grid');
  assert.deepEqual(await visibleNames(), ['La Riva Sherryhomes', 'Vivienda Avd. Andalucía']);
});

test('home links to Arquitectura and interior navigation returns to home and the Estudio route', async () => {
  await visit(1100);
  assert.equal(await evaluate("document.querySelector('.site-nav a').getAttribute('href')"), '/arquitectura');
  assert.equal(await evaluate("document.querySelector('.selected-projects .arrow-link').getAttribute('href')"), '/arquitectura');
  // Drive the real anchor navigation, then let visit synchronize to its target.
  await click('.site-nav a');
  await evaluate("new Promise(resolve=>setTimeout(resolve,100))");
  assert.equal(await evaluate('location.pathname'), '/arquitectura');
  await open();
  assert.equal(await evaluate("document.querySelector('.brand').getAttribute('href')"), '/');
  assert.equal(await evaluate("document.querySelector('.site-nav a:nth-child(2)').getAttribute('href')"), '/estudio');
  assert.equal(await evaluate("document.querySelector('.site-nav a:nth-child(3)').getAttribute('href')"), '/contacto');
  await click('.brand');
  await evaluate("new Promise(resolve=>setTimeout(resolve,100))");
  assert.equal(await evaluate('location.pathname'), '/');
  await visit(1100, '/#estudio');
  assert.equal(await evaluate("!!document.querySelector('#estudio')"), true);
});

test('responsive grid/list and all filter controls stay inside mobile, tablet and desktop', async () => {
  for (const width of [375, 768, 1440]) {
    await open(width);
    const state = await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,
      images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),
      cards:[...document.querySelectorAll('.catalogue-item')].map(c=>{const r=c.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,height:r.height};}),
      controls:[...document.querySelectorAll('.architecture-toolbar button,.site-nav a')].map(c=>{const r=c.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width};})})`);
    assert.equal(state.overflow, false, `Overflow at ${width}`);
    assert.equal(state.images, true);
    assert.ok([...state.cards, ...state.controls].every(c=>c.width>0&&c.x>=0&&c.right<=width+1));
    assert.ok(state.cards.every(c=>c.height>0));
    await screenshot(`architecture-${width}`);
    await click('[data-view="list"]');
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false);
    await click('[data-filter="type"][data-value="cultural"]');
    assert.equal(await evaluate("document.querySelector('[data-empty]').hidden"), false);
    await click('[data-reset]');
    assert.equal((await visibleNames()).length, 12);
  }
});

after(close);
