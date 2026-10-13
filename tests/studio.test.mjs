import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { base, visit, evaluate, screenshot, close } from './helpers/browser.mjs';

const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
async function open(width = 1100) {
  assert.equal((await fetch(new URL('/estudio', base))).status, 200);
  await visit(width, '/estudio');
}

test('Estudio reproduces the source sections, copy and eight original assets at 1100px', async () => {
  await open();
  const state = await evaluate(`(() => {
    const rect = s => { const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}; };
    return {title:document.title,h1:document.querySelector('h1').textContent.trim(),lang:document.documentElement.lang,
      active:document.querySelector('.site-nav [aria-current="page"]').textContent.trim(),
      sections:['.site-header','.studio-intro','.studio-banner','.studio-stats','.studio-workspace','.studio-overview','.studio-approach','.studio-people','.studio-services','.studio-awards','.site-footer'].map(rect),
      approach:[...document.querySelectorAll('.studio-approach__photo')].map(i=>{const r=i.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}),
      stats:[...document.querySelectorAll('.studio-stats dt')].map(i=>i.textContent.trim()),
      people:[...document.querySelectorAll('.studio-team-card h3')].map(i=>i.textContent.trim()),
      services:[...document.querySelectorAll('.studio-services li')].map(i=>i.textContent.trim().replace(/\\s+/g,' ')),
      awards:[...document.querySelectorAll('.studio-awards li')].map(i=>i.textContent.trim().replace(/\\s+/g,' ')),
      images:[...document.images].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height})),
      overflow:document.documentElement.scrollWidth>innerWidth};
  })()`);
  assert.equal(state.title, 'Estudio — Juan Vega Arquitectos');
  assert.equal(state.lang, 'es');
  assert.equal(state.h1, 'Cada encargo comienza escuchando.');
  assert.equal(state.active, 'Estudio');
  assert.equal(state.overflow, false);
  const ys=[0,52,202,552,627,1200,1319,2726,4072,4356,4638];
  const heights=[52,150,350,75,573,119,1407,1346,284,282,168];
  state.sections.forEach((r,i)=>{assert.ok(Math.abs(r.y-ys[i])<2,JSON.stringify({i,r}));assert.ok(Math.abs(r.height-heights[i])<2,JSON.stringify({i,r}));});
  state.approach.forEach((r,i)=>{assert.ok(Math.abs(r.x-[275,688,275][i])<2);assert.ok(Math.abs(r.y-(1319+i*469))<0.1);assert.ok(Math.abs(r.height-469)<0.1);});
  assert.deepEqual(state.stats,['2009','20','27+','3']);
  assert.deepEqual(state.people,['Álvaro González Camacho','Juan Pedro Herrero','Gonzalo Herrero','Cayetano Gómez','Antonio Páez','Jesús Rodriguez','Alfredo Sampalo','María Ángeles Moreira','Alarife Ingeniería']);
  assert.equal(state.services.length,10);
  assert.equal(state.services[0],'01 Diseño conceptual');
  assert.equal(state.services[4],'05 Diseño de producto');
  assert.equal(state.services[9],'10 Diseño conceptual');
  assert.equal(state.awards.length,5);
  assert.ok(state.awards.every(s=>s==='2026 Nombre del premio o reconocimiento — Entidad que lo otorga'));
  assert.equal(state.images.length,8);
  assert.ok(state.images.every(i=>i.src.startsWith('/images/studio/')&&i.loaded&&i.width>0&&i.height>0));
  await screenshot('studio-desktop');
});

test('home and Arquitectura navigate to Estudio, and all previous navigation still works', async () => {
  for(const path of ['/','/arquitectura']) {
    await visit(1100,path);
    assert.equal(await evaluate("document.querySelector('.site-nav a:nth-child(2)').getAttribute('href')"),'/estudio');
    assert.equal(await evaluate("document.querySelector('.footer-column__body a').getAttribute('href')"),'/estudio');
    if(path==='/') {
      assert.equal(await evaluate("document.querySelector('.studio-copy .arrow-link').getAttribute('href')"),'/estudio');
      assert.equal(await evaluate("document.querySelector('.team-section .arrow-link').getAttribute('href')"),'/estudio#equipo');
    }
    await click('.site-nav a:nth-child(2)');
    await evaluate("new Promise(resolve=>setTimeout(resolve,150))");
    assert.equal(await evaluate('location.pathname'),'/estudio');
  }
  await open();
  await click('.site-nav a:nth-child(3)');
  await evaluate("new Promise(resolve=>setTimeout(resolve,150))");
  assert.equal(await evaluate('location.pathname'),'/contacto');
  await open();
  await click('.site-nav a:first-child');
  await evaluate("new Promise(resolve=>setTimeout(resolve,150))");
  assert.equal(await evaluate('location.pathname'),'/arquitectura');
  await open();
  await click('.brand');
  await evaluate("new Promise(resolve=>setTimeout(resolve,150))");
  assert.equal(await evaluate('location.pathname'),'/');
});

test('Estudio stays readable and within mobile, tablet and wide desktop without broken assets', async () => {
  for(const width of [320,375,768,1440]) {
    await open(width);
    const state=await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,
      images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),
      boxes:[...document.querySelectorAll('.studio-team-card,.studio-services li,.studio-awards li,.site-nav a')].map(i=>{const r=i.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,height:r.height,scroll:i.scrollWidth,client:i.clientWidth};}),
      photos:[...document.querySelectorAll('main img')].map(i=>{const r=i.getBoundingClientRect();return {width:r.width,height:r.height};})})`);
    assert.equal(state.overflow,false,`Overflow at ${width}`);
    assert.equal(state.images,true);
    assert.ok(state.boxes.every(r=>r.x>=0&&r.right<=width+1&&r.width>0&&r.height>0&&r.scroll<=r.client+1),JSON.stringify({width,boxes:state.boxes}));
    assert.ok(state.photos.every(r=>r.width>0&&r.height>0));
    await screenshot(`studio-${width}`);
  }
});

after(close);
