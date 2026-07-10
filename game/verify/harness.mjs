// Boots the built game in headless Chromium, drives it end-to-end, and reports
// measured state for every scope item. Usage: node verify/harness.mjs [url]
import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4173/';
const shot = (n) => `verify/shots/${n}.png`;
const errors = [], logs = [];
const out = { steps: [], errors, logs };
function log(step, data) { out.steps.push({ step, ...data }); console.log('▶', step, JSON.stringify(data)); }

function keydown(page, code) { return page.evaluate(c => window.dispatchEvent(new KeyboardEvent('keydown', { code: c })), code); }
function keyup(page, code) { return page.evaluate(c => window.dispatchEvent(new KeyboardEvent('keyup', { code: c })), code); }
async function tap(page, code, ms = 90) { await keydown(page, code); await page.waitForTimeout(ms); await keyup(page, code); }
async function hold(page, codes, ms) { for (const c of codes) await keydown(page, c); await page.waitForTimeout(ms); for (const c of codes) await keyup(page, c); }

const snap = (page) => page.evaluate(() => {
  const g = window.__game; if (!g) return null;
  const pp = g.state.mode === 'drive' ? g.state.vehicle.position : g.player.position;
  return {
    mode: g.state.mode, health: Math.round(g.state.health), cash: g.state.cash,
    stars: g.wanted.level, police: g.wanted.police.length,
    peds: g.peds.peds.filter(p => p.alive).length, traffic: g.traffic.cars.length,
    px: +pp.x.toFixed(2), pz: +pp.z.toFixed(2),
    kmh: g.state.mode === 'drive' ? +g.state.vehicle.speedKmh.toFixed(1) : 0,
    m1: g.missions.state.m1, m2: g.missions.state.m2,
    cpuMs: +(window.__cpuMs || 0).toFixed(2),
  };
});
const enterVeh = async (page, idx) => {
  await page.evaluate(i => { const g = window.__game; const v = g.vehicles[i]; g.player.teleport(v.position.x + 1.6, v.position.z, 2); }, idx);
  await page.waitForTimeout(250); await tap(page, 'KeyF'); await page.waitForTimeout(250);
};
// Drive forward for ms, return {distance, peakKmh, headingDeltaDeg} optionally steering.
async function driveTest(page, ms, steerCode) {
  const p0 = await page.evaluate(() => { const v = window.__game.state.vehicle; return { x: v.position.x, z: v.position.z, h: v.heading }; });
  const codes = steerCode ? ['KeyW', steerCode] : ['KeyW'];
  for (const c of codes) await keydown(page, c);
  let peak = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await page.waitForTimeout(120);
    const k = await page.evaluate(() => Math.abs(window.__game.state.vehicle.speedKmh));
    if (k > peak) peak = k;
  }
  for (const c of codes) await keyup(page, c);
  const p1 = await page.evaluate(() => { const v = window.__game.state.vehicle; return { x: v.position.x, z: v.position.z, h: v.heading }; });
  let dh = (p1.h - p0.h) * 180 / Math.PI; while (dh > 180) dh -= 360; while (dh < -180) dh += 360;
  return { distance: +Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(1), peakKmh: +peak.toFixed(1), headingDeltaDeg: +dh.toFixed(1) };
}

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', m => { logs.push(m.text()); if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => { if (!/Pointer Lock/.test(e.message)) errors.push('PAGEERROR: ' + e.message); });

try {
  await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.__ready === true || window.__bootError, null, { timeout: 30000 });
  const bootErr = await page.evaluate(() => window.__bootError || null);
  if (bootErr) errors.push('BOOT: ' + bootErr);
  await page.evaluate(() => window.__game.save.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  await page.waitForTimeout(1200);
  log('boot', await snap(page));
  await page.screenshot({ path: shot('01-boot') });

  // ---- on-foot walk + run + jump ----
  let b = await snap(page);
  await hold(page, ['KeyW'], 1500);
  let a = await snap(page);
  log('walk', { moved: +Math.hypot(a.px - b.px, a.pz - b.pz).toFixed(2) });
  b = await snap(page);
  await hold(page, ['KeyW', 'ShiftLeft'], 1500);
  a = await snap(page);
  log('run', { moved: +Math.hypot(a.px - b.px, a.pz - b.pz).toFixed(2) });
  const preY = await page.evaluate(() => window.__game.player.position.y);
  await tap(page, 'Space', 60);
  await page.waitForTimeout(220);
  const peakY = await page.evaluate(() => window.__game.player.position.y);
  log('jump', { rose: +(peakY - preY).toFixed(2) });
  await page.screenshot({ path: shot('02-onfoot') });

  // ---- AI life: traffic + peds actually move ----
  const tSample = async () => page.evaluate(() => {
    const g = window.__game;
    const c = g.traffic.cars[0]; const p = g.peds.peds.find(x => x.alive);
    return { car: { x: c.pos.x, z: c.pos.z }, ped: { x: p.pos.x, z: p.pos.z } };
  });
  const s1 = await tSample(); await page.waitForTimeout(1500); const s2 = await tSample();
  log('ai-life', {
    trafficMoved: +Math.hypot(s2.car.x - s1.car.x, s2.car.z - s1.car.z).toFixed(2),
    pedMoved: +Math.hypot(s2.ped.x - s1.ped.x, s2.ped.z - s1.ped.z).toFixed(2),
  });

  // ---- Vehicle 1: Dart handling ----
  await enterVeh(page, 0);
  log('enter-dart', await snap(page));
  const dartFwd = await driveTest(page, 3500);
  await page.waitForTimeout(400);
  const dartTurn = await driveTest(page, 1600, 'KeyD');
  log('dart-handling', { accel: dartFwd, turn: dartTurn });
  await page.screenshot({ path: shot('03-dart') });

  // ---- Vehicle 2: Hauler handling ----
  await tap(page, 'KeyF'); await page.waitForTimeout(300); // exit
  await enterVeh(page, 1);
  log('enter-hauler', await snap(page));
  const haulFwd = await driveTest(page, 3500);
  await page.waitForTimeout(400);
  const haulTurn = await driveTest(page, 1600, 'KeyD');
  log('hauler-handling', { accel: haulFwd, turn: haulTurn });
  log('handling-contrast', {
    dartFasterKmh: +(dartFwd.peakKmh - haulFwd.peakKmh).toFixed(1),
    dartTurnsTighterDeg: +(Math.abs(dartTurn.headingDeltaDeg) - Math.abs(haulTurn.headingDeltaDeg)).toFixed(1),
  });
  await page.screenshot({ path: shot('04-hauler') });

  // ---- Wanted: raise via the real hit-and-run code path ----
  // Place the car just behind a live pedestrian and give it real forward speed
  // (along its heading) so currentVehicleSpeed > 4 and peds.hitTest fires.
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => {
      const g = window.__game; const v = g.state.vehicle;
      const alive = g.peds.peds.find(p => p.alive);
      if (alive && g.state.mode === 'drive') {
        const h = v.heading, fx = Math.sin(h), fz = Math.cos(h);
        v.body.setTranslation({ x: alive.pos.x - fx * 2, y: 0.7, z: alive.pos.z - fz * 2 }, true);
        v.body.setLinvel({ x: fx * 11, y: 0, z: fz * 11 }, true);
        v.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    });
    await page.waitForTimeout(280);
  }
  await page.waitForTimeout(2500);
  const wsnap = await snap(page);
  log('wanted-raised', wsnap);
  await page.screenshot({ path: shot('05-wanted') });

  // ---- Police pursue: distance to player should shrink ----
  const copDist = () => page.evaluate(() => {
    const g = window.__game; const pp = g.state.mode === 'drive' ? g.state.vehicle.position : g.player.position;
    if (!g.wanted.police.length) return null;
    return Math.min(...g.wanted.police.map(p => Math.hypot(p.pos.x - pp.x, p.pos.z - pp.z)));
  });
  // park the car and let police close in
  await page.evaluate(() => window.__game.state.vehicle.body.setLinvel({ x: 0, y: 0, z: 0 }, true));
  const d0 = await copDist(); await page.waitForTimeout(3000); const d1 = await copDist();
  log('police-pursuit', { distStart: d0 == null ? null : +d0.toFixed(1), distAfter: d1 == null ? null : +d1.toFixed(1), closedIn: d0 && d1 ? +(d0 - d1).toFixed(1) : null });

  // ---- Wanted decay: flee far and wait ----
  await page.evaluate(() => { const g = window.__game; const f = g.worldData.half - 6; g.state.vehicle.body.setTranslation({ x: -f, y: 0.6, z: -f }, true); });
  const starsHot = (await snap(page)).stars;
  await page.waitForTimeout(9000);
  const decay = await snap(page);
  log('wanted-decay', { starsHot, starsAfter: decay.stars, police: decay.police });

  // ---- Mission 1 ----
  await tap(page, 'KeyF'); await page.waitForTimeout(300);
  await page.evaluate(() => { const g = window.__game; g.wanted.clear(); const p = g.missions.pts.m1start; g.player.teleport(p.x, p.z, 2); });
  await page.waitForTimeout(700);
  log('m1-trigger', await snap(page));
  await page.evaluate(() => { const g = window.__game; const p = g.missions.pts.m1drop; g.player.teleport(p.x, p.z, 2); });
  await page.waitForTimeout(700);
  log('m1-complete', await snap(page));
  await page.screenshot({ path: shot('06-mission') });

  // ---- Mission 2 ----
  await page.evaluate(() => { const g = window.__game; const p = g.missions.pts.m2start; g.player.teleport(p.x, p.z, 2); });
  await page.waitForTimeout(900);
  const m2 = await snap(page);
  log('m2-trigger', m2);
  // evade phase: clear wanted and go to safehouse
  await page.evaluate(() => { const g = window.__game; g.wanted.clear(); const p = g.missions.pts.safehouse; g.player.teleport(p.x, p.z, 2); });
  await page.waitForTimeout(900);
  log('m2-complete', await snap(page));

  // ---- Save / resume ----
  await page.evaluate(() => window.__game.save.save(window.__game));
  const pre = await snap(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const post = await snap(page);
  log('save-resume', { preCash: pre.cash, postCash: post.cash, preM1: pre.m1, postM1: post.m1, preM2: pre.m2, postM2: post.m2 });

  // ---- FPS (software renderer) + CPU sim cost ----
  const fps = await page.evaluate(async () => {
    let f = 0, run = true; const t0 = performance.now();
    (function l() { f++; if (run) requestAnimationFrame(l); })();
    await new Promise(r => setTimeout(r, 3000)); run = false;
    return +(f / ((performance.now() - t0) / 1000)).toFixed(1);
  });
  const cpuMs = await page.evaluate(() => +(window.__cpuMs || 0).toFixed(2));
  log('perf', { swiftshaderFps: fps, cpuSimMsPerFrame: cpuMs, note: 'fps is software-rendered (swiftshader); cpuSimMs is GPU-independent' });
  await page.screenshot({ path: shot('07-final') });
} catch (e) {
  errors.push('HARNESS: ' + e.message + '\n' + e.stack);
} finally {
  out.errorCount = errors.length;
  console.log('\n===RESULT_JSON===\n' + JSON.stringify(out, null, 1) + '\n===END_RESULT===');
  await browser.close();
}
