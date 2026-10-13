import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { base, visit, evaluate, screenshot, close } from './helpers/browser.mjs';

test('home preserves the public root page and renders the Figma desktop composition', async () => {
  assert.equal((await fetch(base)).status, 200);
  await visit(1100);
  const state = await evaluate(`(() => {
    const rect = selector => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r && { x:r.x, y:r.y, width:r.width, height:r.height }; };
    return {
      lang: document.documentElement.lang,
      title: document.title,
      heading: document.querySelector('h1')?.textContent.trim(),
      sections: [...document.querySelectorAll('main > section')].map(s => s.id),
      hero: rect('#inicio'), studio: rect('#estudio'), gallery: rect('.project-grid'),
      team: rect('#equipo'), projects: rect('#proyectos'), footer: rect('#contacto'),
      cards: document.querySelectorAll('.project-card').length,
      rows: document.querySelectorAll('.project-index tbody tr').length,
      portraits: document.querySelectorAll('.team-card--placeholder').length,
      font: document.fonts.check('700 20px Inter'),
      assets: [...document.images].map(i => ({ src:i.getAttribute('src'), loaded:i.complete && i.naturalWidth>0, width:i.getBoundingClientRect().width, height:i.getBoundingClientRect().height })),
      anchors: [...document.querySelectorAll('a[href^="#"]')].map(a => ({ href:a.getAttribute('href'), exists:!!document.getElementById(a.hash.slice(1)) })),
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  })()`);
  assert.equal(state.lang, 'es');
  assert.match(state.title, /Juan Vega/);
  assert.equal(state.heading, 'Juan Vega Arquitectos');
  assert.deepEqual(state.sections, ['inicio', 'estudio', 'arquitectura', 'filosofia', 'equipo', 'proyectos']);
  assert.equal(state.cards, 9);
  assert.equal(state.rows, 10);
  assert.equal(state.portraits, 2);
  assert.equal(state.font, true);
  assert.equal(state.overflow, false);
  for (const [name, y, height] of [['hero',0,632],['studio',662,580],['gallery',1313,2244],['team',3901,559],['projects',4460,557],['footer',5017,168]]) {
    assert.ok(Math.abs(state[name].y - y) <= 2, `${name} top: ${state[name].y} vs ${y}`);
    assert.ok(Math.abs(state[name].height - height) <= 2, `${name} height: ${state[name].height} vs ${height}`);
  }
  assert.ok(state.assets.length >= 20);
  for (const asset of state.assets) {
    assert.ok(asset.src.startsWith('/images/'), `Non-local asset: ${asset.src}`);
    assert.ok(asset.loaded && asset.width > 0 && asset.height > 0, `Invalid image geometry: ${JSON.stringify(asset)}`);
  }
  for (const anchor of state.anchors) assert.ok(anchor.exists, `Missing anchor: ${anchor.href}`);
  await screenshot('home-desktop');
});

test('home adapts to mobile, tablet, and wide desktop without clipping content or images', async () => {
  for (const width of [375, 768, 1440]) {
    await visit(width);
    const state = await evaluate(`(() => {
      const cards = [...document.querySelectorAll('.project-card')].map(c => { const r=c.getBoundingClientRect(); return {x:r.x,right:r.right,width:r.width,height:r.height}; });
      return { width:innerWidth, overflow:document.documentElement.scrollWidth>innerWidth, cards,
        images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),
        heading:!!document.querySelector('h1'),
        navigation:[...document.querySelectorAll('.site-nav a')].map(a=>({text:a.textContent.trim(),width:a.getBoundingClientRect().width})),
        copy:[...document.querySelectorAll('.project-card h3')].every(h=>h.getBoundingClientRect().right <= innerWidth),
        footer:document.querySelector('#contacto')?.getBoundingClientRect().height,
      };
    })()`);
    assert.equal(state.overflow, false, `Horizontal overflow at ${width}`);
    assert.equal(state.images, true);
    assert.equal(state.heading, true);
    assert.equal(state.cards.length, 9);
    assert.ok(state.cards.every(c=>c.width>0&&c.height>0&&c.x>=0&&c.right<=width), `Clipped cards at ${width}`);
    assert.equal(state.copy, true);
    assert.ok(state.navigation.every(a=>a.width>0));
    assert.ok(state.footer>0);
    await screenshot(`home-${width}`);
  }
});

after(close);
