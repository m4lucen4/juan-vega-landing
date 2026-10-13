import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

export const base = process.env.HOME_URL ?? 'http://localhost:4321';
const debug = process.env.CHROME_DEBUG_URL ?? 'http://127.0.0.1:9222';
let socket;
let target;
let sequence = 0;
const pending = new Map();

export async function command(method, params = {}) {
  const id = ++sequence;
  const promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timeout });
  });
  socket.send(JSON.stringify({ id, method, params }));
  return promise;
}

async function connect() {
  target = await (await fetch(`${debug}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    const request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timeout);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
  };
  await command('Page.enable');
}

export async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
  return result.result.value;
}

export async function visit(width, path = '/') {
  if (!socket) await connect();
  await command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
  const url = new URL(path, base).href;
  await command('Page.navigate', { url });
  // Wait for the new document, not the outgoing page's load state.
  await evaluate(`new Promise((resolve, reject) => {
    const deadline = Date.now() + 10000;
    const ready = async () => {
      if (location.href !== ${JSON.stringify(url)} || document.readyState !== 'complete') {
        if (Date.now() > deadline) return reject(new Error('Navigation readiness timeout'));
        return setTimeout(ready, 25);
      }
      await document.fonts.ready;
      // Loading offscreen lazy images explicitly avoids decode() waiting forever.
      for (const image of document.images) image.loading = 'eager';
      await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    };
    ready();
  })`);
}

export async function screenshot(name) {
  const height = await evaluate('document.documentElement.scrollHeight');
  const width = await evaluate('innerWidth');
  const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height, scale: 1 } });
  await mkdir('.astro/visual', { recursive: true });
  await writeFile(`.astro/visual/${name}.png`, Buffer.from(result.data, 'base64'));
}

export async function close() {
  if (target) await fetch(`${debug}/json/close/${target.id}`);
  socket?.close();
}
