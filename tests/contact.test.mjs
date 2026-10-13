import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { base, visit, evaluate, screenshot, close, command } from './helpers/browser.mjs';

async function open(width = 1100) {
  assert.equal((await fetch(new URL('/contacto', base))).status, 200);
  await visit(width, '/contacto');
}

const expectedCopy = [
  'Nuevo proyectos: Para un nuevo encargo escríbenos o llámanos a: estudio@juanvegaarquitectos.com +34 956 50 48 00',
  'Prensa: Para artículos de publicación, entrevistas y solicitudes de imágenes, el estudio responde directamente. prensa@juanvegaarquitectos.com',
  'Oficina: Calle Pozo del Olivar 14, 11403 Jerez de la Frontera (Cádiz, España). De lunes a jueves, de 8:00 a 19:00h. Viernes, de 8:00 a 15:00h.',
  'Colaboraciones: Envía tu portafolio a: cv@juanvegaarquitectos.com',
];

test('Contacto preserves the supplied copy, photo crop and desktop composition', async () => {
  await open();
  const state = await evaluate(`(() => {
    const rect = s => { const r = document.querySelector(s).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; };
    const photo = document.querySelector('.contact-photo');
    return {title:document.title,lang:document.documentElement.lang,h1:document.querySelector('h1').textContent.trim(),
      active:document.querySelector('.site-nav [aria-current="page"]').textContent.trim(),
      copy:[...document.querySelectorAll('.contact-block')].map(e=>e.innerText.trim().replace(/\\s+/g,' ')),
      links:[...document.querySelectorAll('.contact-details a')].map(e=>e.getAttribute('href')),
      rects:['.site-header','.contact-photo','.contact-reflections','.site-footer'].map(rect),
      photo:{src:photo.getAttribute('src'),width:photo.naturalWidth,height:photo.naturalHeight},
      cards:[...document.querySelectorAll('.reflection-card')].map(e=>e.innerText.trim().replace(/\\s+/g,' ')),
      images:[...document.images].every(e=>e.complete&&e.naturalWidth>0),
      overflow:document.documentElement.scrollWidth>innerWidth};
  })()`);
  assert.equal(state.title, 'Contacto — Juan Vega Arquitectos');
  assert.equal(state.lang, 'es');
  assert.equal(state.h1, 'Contacto');
  assert.equal(state.active, 'Contacto');
  assert.deepEqual(state.copy, expectedCopy);
  assert.deepEqual(state.links, ['mailto:estudio@juanvegaarquitectos.com','tel:+34956504800','mailto:prensa@juanvegaarquitectos.com','mailto:cv@juanvegaarquitectos.com']);
  assert.deepEqual(state.photo, {src:'/images/contact/office.png',width:536,height:670});
  const expected = [{x:0,y:0,width:1100,height:52},{x:561,y:205,width:536,height:670},{x:0,y:875,width:1100,height:283},{x:0,y:1158,width:1100,height:168}];
  state.rects.forEach((r,i)=>Object.keys(r).forEach(k=>assert.ok(Math.abs(r[k]-expected[i][k])<1.1,JSON.stringify({i,k,r}))));
  assert.equal(state.cards.length,3);
  assert.ok(state.cards.every(s=>s==='2026 Cada proyecto como una pieza propia La escala o el presupuesto no determinan el cuidado. Nos importa encontrar equilibrio entre técnica, sensibilidad y economía para construir espacios duraderos.'));
  assert.equal(state.images,true);
  assert.equal(state.overflow,false);
  await screenshot('contact-desktop');
});

test('all approved pages navigate to Contacto and previous destinations still work', async () => {
  for (const path of ['/','/arquitectura','/estudio']) {
    await visit(1100,path);
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.site-nav a')].map(e=>e.getAttribute('href'))"), ['/arquitectura','/estudio','/contacto']);
    await evaluate("document.querySelector('.site-nav a:nth-child(3)').click()");
    await evaluate("new Promise(r=>setTimeout(r,150))");
    assert.equal(await evaluate('location.pathname'),'/contacto');
  }
  for (const [selector,destination] of [['.brand','/'],['.site-nav a:first-child','/arquitectura'],['.site-nav a:nth-child(2)','/estudio']]) {
    await open();
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    await evaluate("new Promise(r=>setTimeout(r,150))");
    assert.equal(await evaluate('location.pathname'),destination);
  }
});

test('Contacto is readable without overflow at mobile, tablet and desktop widths', async () => {
  for (const width of [320,375,600,601,768,1100,1440]) {
    await open(width);
    const state = await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,
      boxes:[...document.querySelectorAll('.contact-block,.contact-details a,.reflection-card,.site-nav a')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,height:r.height,scroll:e.scrollWidth,client:e.clientWidth};}),
      assets:[...document.images].every(e=>e.complete&&e.naturalWidth>0),
      font:parseFloat(getComputedStyle(document.querySelector('.contact-block')).fontSize),
      photo:(()=>{const r=document.querySelector('.contact-photo').getBoundingClientRect();return {width:r.width,height:r.height};})()})`);
    assert.equal(state.overflow,false,`Overflow at ${width}`);
    assert.ok(state.boxes.every(r=>r.x>=0&&r.right<=width+1&&r.width>0&&r.height>0&&r.scroll<=r.client+1),JSON.stringify({width,boxes:state.boxes}));
    assert.equal(state.assets,true);
    assert.ok(state.font>= (width<=900?12:10));
    assert.ok(Math.abs(state.photo.width/state.photo.height-0.8)<0.01);
    if ([320,375,768,1440].includes(width)) await screenshot(`contact-${width}`);
  }
  await open(375);
  await evaluate("document.querySelector('.skip-link').focus()");
  assert.equal(await evaluate("document.activeElement.className"),'skip-link');
  await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate('location.hash'),'#contact-page-title');
});

test('contact copy scales on large screens while preserving reference, tablet and mobile sizes', async () => {
  for (const width of [375,768,1100,1440,1920,2560]) {
    await open(width);
    const state = await evaluate(`({
      sizes:[...document.querySelectorAll('.contact-block h2,.contact-block p,.contact-block a')].map(e=>({font:parseFloat(getComputedStyle(e).fontSize),line:parseFloat(getComputedStyle(e).lineHeight)})),
      overflow:document.documentElement.scrollWidth>innerWidth,
      blocks:[...document.querySelectorAll('.contact-block')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,bottom:r.bottom,height:r.height};})
    })`);
    const font = width<=600 ? 13 : width<=900 ? 12 : Math.min(20,width/110);
    const line = width<=600 ? 19 : width<=900 ? 17 : font*1.3;
    assert.ok(state.sizes.every(s=>Math.abs(s.font-font)<0.02&&Math.abs(s.line-line)<0.03),JSON.stringify({width,expected:{font,line},actual:state.sizes}));
    assert.equal(state.overflow,false,`Overflow at ${width}`);
    assert.ok(state.blocks.every((b,i)=>b.x>=0&&b.right<=width+1&&b.height>0&&(i===0||b.bottom-b.height>=state.blocks[i-1].bottom)),JSON.stringify({width,blocks:state.blocks}));
    if ([1440,1920,2560].includes(width)) await screenshot(`contact-text-${width}`);
  }
});

after(close);
