import * as THREE from 'three';
import { initPhysics } from './physics.js';
import { Input } from './input.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { Vehicle } from './vehicles.js';
import { ChaseCamera } from './camera.js';
import { roadCenter, CITY } from './config.js';
import { TrafficSystem } from './traffic.js';
import { PedSystem } from './peds.js';
import { WantedSystem } from './wanted.js';
import { HUD } from './hud.js';
import { MissionSystem } from './missions.js';
import { SaveSystem } from './save.js';

const loadingMsg = document.getElementById('loading-msg');
const setMsg = (m) => { if (loadingMsg) loadingMsg.textContent = m; };

async function boot() {
  setMsg('Starting physics…');
  const { RAPIER, world } = await initPhysics();

  // ---- renderer / scene / camera ----
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 500);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  setMsg('Building city district…');
  const worldData = buildWorld(scene, RAPIER, world);
  const input = new Input(canvas);
  const chase = new ChaseCamera(camera, worldData.buildingBoxes);

  // ---- entities ----
  const player = new Player(RAPIER, world, scene, worldData.spawn);

  // Vehicles parked around the central intersection on roads.
  const mid = Math.floor(CITY.blocks / 2);
  const vehicles = [
    new Vehicle(RAPIER, world, scene, 'dart',
      { x: roadCenter(mid) + 3, z: roadCenter(mid) + 8 }, Math.PI),
    new Vehicle(RAPIER, world, scene, 'hauler',
      { x: roadCenter(mid) - 4, z: roadCenter(mid) + 16 }, Math.PI),
    new Vehicle(RAPIER, world, scene, 'dart',
      { x: roadCenter(mid - 1) + 3, z: roadCenter(mid) - 20 }, 0),
  ];

  setMsg('Spawning traffic & pedestrians…');
  const traffic = new TrafficSystem(RAPIER, world, scene, worldData);
  const peds = new PedSystem(RAPIER, world, scene, worldData);
  const wanted = new WantedSystem(RAPIER, world, scene, worldData);
  const hud = new HUD(worldData);
  const missions = new MissionSystem(scene, worldData);
  const save = new SaveSystem();

  // ---- game state ----
  const state = {
    mode: 'foot',          // 'foot' | 'drive'
    vehicle: null,         // current Vehicle
    health: 100,
    cash: 0,
    paused: false,
    time: 0,
  };

  const ctx = {
    RAPIER, world, scene, camera, renderer, input, chase,
    player, vehicles, worldData, traffic, peds, wanted, hud, missions, save, state,
    enterVehicle, exitVehicle, addCash, damage, respawnPlayer, findNearestVehicle,
  };

  function addCash(n) { state.cash += n; }
  function damage(n) {
    state.health = Math.max(0, state.health - n);
    if (state.health <= 0) respawnPlayer();
  }
  function respawnPlayer() {
    // wasted -> respawn at spawn, drop wanted, keep cash
    if (state.mode === 'drive') exitVehicle(true);
    state.health = 100;
    wanted.clear();
    hud.toast('WASTED', 'You woke up back downtown');
    player.teleport(worldData.spawn.x, worldData.spawn.z, 2);
  }

  function findNearestVehicle(maxDist = 3.2) {
    const p = player.position; let best = null, bd = maxDist;
    for (const v of vehicles) {
      if (v.occupied) continue;
      const d = Math.hypot(v.position.x - p.x, v.position.z - p.z);
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }

  function enterVehicle(v) {
    state.mode = 'drive';
    state.vehicle = v;
    v.occupied = true;
    player.setEnabled(false);
    chase.yaw = v.heading + Math.PI;
  }
  function exitVehicle(silent) {
    const v = state.vehicle;
    if (!v) return;
    v.occupied = false;
    v.idle();
    // place player beside the driver door
    const h = v.heading;
    const side = new THREE.Vector3(Math.cos(h), 0, -Math.sin(h)); // vehicle's left
    const p = v.position;
    let ex = p.x + side.x * 2.2, ez = p.z + side.z * 2.2;
    if (!worldData.isClear(ex, ez, 0.6)) { ex = p.x - side.x * 2.2; ez = p.z - side.z * 2.2; }
    player.setEnabled(true);
    player.teleport(ex, ez, v.position.y + 1);
    state.mode = 'foot';
    state.vehicle = null;
  }

  // Try to resume from save
  const resumed = save.load(ctx);
  if (resumed) hud.toast('CHECKPOINT', 'Session resumed');

  missions.init(ctx);

  // ---- fixed-step loop ----
  const FIXED = 1 / 60;
  let acc = 0;
  let last = 0;
  let fpsAcc = 0, fpsFrames = 0, fps = 60;
  world.timestep = FIXED;

  // hide loading
  const loadingEl = document.getElementById('loading');
  loadingEl.classList.add('hidden');
  setTimeout(() => loadingEl.remove(), 700);
  input.requestLock();

  function frame(nowMs) {
    requestAnimationFrame(frame);
    const now = nowMs / 1000;
    let dt = last ? now - last : FIXED;
    last = now;
    dt = Math.min(dt, 0.1);
    state.time += dt;

    const _cpu0 = performance.now();
    input.beginFrame();

    // pause toggle
    if (input.justPressed('KeyP') || input.justPressed('Escape')) {
      state.paused = !state.paused;
      hud.setPaused(state.paused);
    }

    if (!state.paused) {
      // --- input-driven control ---
      handleInteract();
      const camYaw = updateControlAndCamera(dt);

      // --- fixed physics steps ---
      acc += dt;
      let steps = 0;
      while (acc >= FIXED && steps < 5) {
        stepControls(FIXED);
        traffic.update(FIXED, ctx);
        peds.update(FIXED, ctx);
        wanted.update(FIXED, ctx);
        // Vehicle controllers raycast + apply forces to their chassis, which
        // world.step() then integrates — so updateVehicle must run first.
        for (const v of vehicles) v.step(FIXED);
        world.step();
        acc -= FIXED; steps++;
      }

      // --- post-physics gameplay ---
      missions.update(dt, ctx);
      wanted.postStep(dt, ctx);

      // crash damage: a big single-frame speed drop means a real impact
      if (state.mode === 'drive') {
        const sp = state.vehicle.speedAbs;
        if (state._lastVS !== undefined) {
          const drop = state._lastVS - sp;
          if (drop > 9) damage(Math.min(35, (drop - 9) * 3));
        }
        state._lastVS = sp;
      } else state._lastVS = undefined;

      // slow health regen once you're clean
      if (wanted.level === 0 && state.health < 100) state.health = Math.min(100, state.health + 6 * dt);
    }

    // --- render sync ---
    player.render(state.time);
    for (const v of vehicles) v.render();
    traffic.render();
    peds.render(dt);
    wanted.render();
    missions.render(state.time);

    // fps
    fpsFrames++; fpsAcc += dt;
    if (fpsAcc >= 0.5) {
      fps = fpsFrames / fpsAcc; fpsFrames = 0; fpsAcc = 0;
      maybeAdaptQuality(fps);
    }

    hud.update(ctx, fps);
    window.__fps = Math.round(fps);
    // CPU (simulation + gameplay + hud) cost, excluding GPU render. Smoothed.
    const _cpu = performance.now() - _cpu0;
    window.__cpuMs = (window.__cpuMs || _cpu) * 0.9 + _cpu * 0.1;
    renderer.render(scene, camera);
    input.endFrame();

    // autosave every ~20s
    if (Math.floor(state.time / 20) !== frame._lastSave) {
      frame._lastSave = Math.floor(state.time / 20);
      if (frame._lastSave > 0) save.save(ctx);
    }
  }
  frame._lastSave = 0;

  // If sustained framerate is low on weaker hardware, step quality down once.
  let _qualityTier = 0, _lowStreak = 0;
  function maybeAdaptQuality(currentFps) {
    if (window.__ready !== true) return;
    if (currentFps < 45) _lowStreak++; else _lowStreak = 0;
    if (_lowStreak >= 4 && _qualityTier < 2) {
      _qualityTier++;
      if (_qualityTier === 1) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
        sunLower();
      } else {
        renderer.shadowMap.enabled = false;
        scene.traverse(o => { if (o.isMesh) o.castShadow = false; });
        renderer.shadowMap.needsUpdate = true;
      }
      _lowStreak = 0;
    }
  }
  function sunLower() {
    // shrink shadow map resolution
    const sun = scene.children.find(c => c.isDirectionalLight);
    if (sun && sun.shadow) { sun.shadow.mapSize.set(1024, 1024); sun.shadow.map?.dispose(); sun.shadow.map = null; }
  }

  function handleInteract() {
    if (input.justPressed('KeyF')) {
      if (state.mode === 'foot') {
        const v = findNearestVehicle();
        if (v) enterVehicle(v);
      } else {
        exitVehicle();
      }
    }
  }

  let _throttle = 0, _steer = 0, _hand = false;
  function updateControlAndCamera(dt) {
    chase.addMouse(input.mouseDX, input.mouseDY);
    if (state.mode === 'foot') {
      const yaw = chase.updateFoot(player.chest, dt);
      return yaw;
    } else {
      const v = state.vehicle;
      chase.updateVehicle(v.position, v.heading, v.speedMS, dt);
      return chase.yaw;
    }
  }

  function stepControls(fdt) {
    if (state.mode === 'foot') {
      player.update(fdt, input, chase.yaw);
    } else {
      const v = state.vehicle;
      const mv = input.moveAxis();
      const throttle = mv.y;             // W/S
      const steer = -mv.x;               // A/D  (A = left)
      const hand = input.down('Space');
      v.control(fdt, throttle, steer, hand);
    }
  }

  frame(0);

  // expose for verifier/debug
  window.__game = ctx;
  window.__ready = true;
}

boot().catch((e) => {
  console.error(e);
  setMsg('Boot error: ' + (e?.message || e));
  window.__bootError = String(e?.stack || e);
});
