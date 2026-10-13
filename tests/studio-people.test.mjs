import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { visit, evaluate, screenshot, close } from './helpers/browser.mjs';

const names = ['Juan Vega','Cristina Álvarez','Salvador Rubiales','Paola Domouso','María González Baro'];

test('Personas renders the five Figma portrait slots above the existing nine collaborator cards', async () => {
  await visit(1100,'/estudio');
  const state = await evaluate(`(() => {
    const rect = el => { const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}; };
    const image = document.querySelector('.studio-person-card img');
    return {
      names:[...document.querySelectorAll('.studio-person-card h3')].map(n=>n.textContent.trim()),
      roles:[...document.querySelectorAll('.studio-person-card__role')].map(n=>n.textContent.trim()),
      biographyLabels:[...document.querySelectorAll('.studio-person-card__biography')].map(n=>n.textContent.trim()),
      slots:[...document.querySelectorAll('.studio-person-card__photo')].map(rect),
      placeholders:document.querySelectorAll('.studio-person-card--placeholder').length,
      image:image?{src:image.getAttribute('src'),loaded:image.complete&&image.naturalWidth>0,rect:rect(image)}:null,
      team:rect(document.querySelector('.studio-team')),
      collaborators:[...document.querySelectorAll('.studio-team-card h3')].map(n=>n.textContent.trim()),
      overflow:document.documentElement.scrollWidth>innerWidth};
  })()`);
  assert.deepEqual(state.names,names);
  assert.deepEqual(state.roles,['Arquitecto principal, CEO',...Array(4).fill('Arquitecto')]);
  assert.deepEqual(state.biographyLabels,Array(5).fill('Biografía —'));
  assert.equal(state.placeholders,4);
  assert.equal(state.slots.length,5);
  for(const [index,r] of state.slots.entries()) {
    assert.ok(Math.abs(r.x-[310,565,820,310,565][index])<1);
    assert.ok(Math.abs(r.y-(index<3?2760:3258))<1);
    assert.ok(Math.abs(r.width-245)<1&&Math.abs(r.height-407)<1);
  }
  assert.equal(state.image.src,'/images/studio/juan-vega.jpg');
  assert.equal(state.image.loaded,true);
  assert.ok(Math.abs(state.image.rect.width/245-3.4676)<0.001);
  assert.ok(Math.abs(state.image.rect.x-(310-245*1.3354))<0.1);
  assert.ok(Math.abs(state.image.rect.height-407)<1);
  assert.ok(state.team.y>state.slots.at(-1).y+407);
  assert.deepEqual(state.collaborators,['Álvaro González Camacho','Juan Pedro Herrero','Gonzalo Herrero','Cayetano Gómez','Antonio Páez','Jesús Rodriguez','Alfredo Sampalo','María Ángeles Moreira','Alarife Ingeniería']);
  assert.equal(state.overflow,false);
  await screenshot('studio-people-desktop');
});

test('portrait slots and collaborator cards remain visible and ordered on mobile and tablet', async () => {
  for(const width of [320,375,768,1440]) {
    await visit(width,'/estudio');
    const state=await evaluate(`(() => {
      const bounds=n=>{const r=n.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:r.width,height:r.height};};
      return {overflow:document.documentElement.scrollWidth>innerWidth,
        names:[...document.querySelectorAll('.studio-person-card h3')].map(n=>n.textContent.trim()),
        cards:[...document.querySelectorAll('.studio-person-card')].map(bounds),
        slots:[...document.querySelectorAll('.studio-person-card__photo')].map(bounds),
        team:bounds(document.querySelector('.studio-team')),
        collaborators:document.querySelectorAll('.studio-team-card').length,
        loaded:document.querySelector('.studio-person-card img')?.naturalWidth>0};
    })()`);
    assert.equal(state.overflow,false);
    assert.deepEqual(state.names,names);
    assert.equal(state.cards.length,5);
    assert.ok(state.cards.every(r=>r.x>=0&&r.right<=width+1&&r.width>0&&r.height>0));
    assert.ok(state.slots.every(r=>r.width>0&&r.height>0));
    assert.ok(state.team.y>=state.cards.at(-1).bottom-1);
    assert.equal(state.collaborators,9);
    assert.equal(state.loaded,true);
    await screenshot(`studio-people-${width}`);
  }
});
after(close);
