import * as THREE from 'three';
import { PHYS } from './config.js';
import { group } from './physics.js';

// Wanted/heat: offenses raise stars (0-5). Police units spawn to match the star
// level and pursue the player. Stars decay after sustained evasion (no police
// within spot range). Getting caught on foot busts you.
const SPOT_RANGE = 46;      // police within this range keep the heat "hot"
const EVADE_PER_STAR = 7;   // seconds of evasion to drop one star
const OFFENSE = { ped: 34, ram: 8, copHit: 20 };

export class WantedSystem {
  constructor(RAPIER, world, scene, worldData) {
    this.RAPIER = RAPIER; this.world = world; this.scene = scene; this.wd = worldData;
    this.heat = 0;          // 0..100
    this.level = 0;         // 0..5 stars
    this.police = [];       // pursuit cars
    this.evadeTimer = 0;
    this.bustTimer = 0;
    this.spawnCd = 0;
    this.alertT = 0; // >0 while actively hunted; gates police reinforcements
    this._rng = 55512;
  }
  rnd() { this._rng = (this._rng * 1664525 + 1013904223) >>> 0; return this._rng / 4294967296; }

  clear() {
    this.heat = 0; this.level = 0; this.evadeTimer = 0; this.bustTimer = 0;
    for (const p of this.police) this.despawn(p);
    this.police.length = 0;
  }

  addHeat(n) {
    this.heat = Math.min(100, this.heat + n);
    this.evadeTimer = 0;
    this.alertT = 6; // fresh offense → police actively hunt for a while
    this.recalcLevel();
  }
  recalcLevel() {
    const l = this.heat <= 0 ? 0 : Math.min(5, 1 + Math.floor(this.heat / 20));
    this.level = l;
  }

  playerPos(ctx) {
    return ctx.state.mode === 'drive' ? ctx.state.vehicle.position : ctx.player.position;
  }

  update(dt, ctx) {
    const pp = this.playerPos(ctx);

    // ---- decay via evasion ----
    let anyClose = false;
    for (const p of this.police) {
      if (Math.hypot(p.pos.x - pp.x, p.pos.z - pp.z) < SPOT_RANGE) { anyClose = true; break; }
    }
    // stay on alert while a cop can see you; otherwise the alert winds down and
    // reinforcements stop, which is what makes evading possible.
    if (anyClose) this.alertT = Math.max(this.alertT, 3);
    this.alertT = Math.max(0, this.alertT - dt);

    if (this.level > 0 && (!anyClose || this.police.length === 0)) {
      this.evadeTimer += dt;
      if (this.evadeTimer >= EVADE_PER_STAR) {
        this.evadeTimer = 0;
        this.heat = Math.max(0, this.heat - 20);
        this.recalcLevel();
        if (this.level === 0) ctx.hud.toast('EVADED', 'You lost the cops');
      }
    } else {
      this.evadeTimer = Math.max(0, this.evadeTimer - dt * 0.5);
    }

    // ---- maintain police count to match star level ----
    const want = this.level; // 1 star -> 1 unit ... 5 -> 5
    this.spawnCd -= dt;
    // Only send reinforcements while actively hunted — once you've broken contact
    // (alert wound down) no new cops appear, so you can outrun the rest and evade.
    if (this.police.length < want && this.spawnCd <= 0 && this.alertT > 0) {
      this.spawnPolice(ctx, pp);
      this.spawnCd = 1.4;
    }
    while (this.police.length > want) this.despawn(this.police.pop());

    // ---- drive police toward player ----
    for (const p of this.police) this.drivePolice(p, dt, pp, ctx);

    // ---- gunfire pressure at 3+ stars: nearby cops with line of sight hurt you ----
    if (this.level >= 3) {
      for (const p of this.police) {
        const d = Math.hypot(p.pos.x - pp.x, p.pos.z - pp.z);
        if (d < 15 && d > 2 && this.lineClear(p.pos.x, p.pos.z, pp.x, pp.z)) {
          ctx.damage(this.level * 1.5 * dt);
        }
      }
    }

    // ---- bust check (on foot, cop adjacent) ----
    if (ctx.state.mode === 'foot' && this.level > 0) {
      let near = false;
      for (const p of this.police) if (Math.hypot(p.pos.x - pp.x, p.pos.z - pp.z) < 3.5) near = true;
      if (near) {
        this.bustTimer += dt;
        if (this.bustTimer > 2.2) { this.bust(ctx); }
      } else this.bustTimer = Math.max(0, this.bustTimer - dt);
    } else this.bustTimer = 0;
  }

  // Offense detection runs each rendered frame after physics.
  postStep(dt, ctx) {
    const st = ctx.state;
    if (st.mode === 'drive') {
      const v = st.vehicle;
      const spd = v.speedAbs; // total planar speed — a hit from any angle counts
      if (spd > 4) {
        if (ctx.peds.hitTest(v.position.x, v.position.z, 1.7)) {
          this.addHeat(OFFENSE.ped);
          ctx.hud.toast('HIT & RUN', '+heat', 900);
        }
      }
      // rammed a police cruiser
      for (const p of this.police) {
        if (Math.hypot(p.pos.x - v.position.x, p.pos.z - v.position.z) < 2.6 && spd > 6) {
          this.addHeat(OFFENSE.copHit * dt * 6);
        }
      }
    }
  }

  bust(ctx) {
    ctx.hud.toast('BUSTED', 'Hauled downtown', 1600);
    this.clear();
    ctx.state.health = 100;
    if (ctx.state.mode === 'drive') ctx.exitVehicle(true);
    ctx.player.teleport(this.wd.spawn.x, this.wd.spawn.z, 2);
  }

  spawnPolice(ctx, pp) {
    // Spawn on a road intersection near the player so the cruiser always starts
    // on clear tarmac (a random point could land inside a building and freeze).
    const ang = this.rnd() * Math.PI * 2;
    const r = 30 + this.rnd() * 14;
    const px = pp.x + Math.cos(ang) * r, pz = pp.z + Math.sin(ang) * r;
    const node = this.wd.graph.nodes[this.wd.graph.nearest(px, pz)];
    const lim = this.wd.half - 4;
    let sx = Math.max(-lim, Math.min(lim, node.x));
    let sz = Math.max(-lim, Math.min(lim, node.z));
    const RAPIER = this.RAPIER;
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(sx, 0.5, sz)
    );
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.9, 0.5, 2.1)
        .setCollisionGroups(group(PHYS.npcGroup, PHYS.playerGroup | PHYS.vehicleGroup | PHYS.npcGroup)),
      body
    );
    const mesh = buildPoliceMesh();
    this.scene.add(mesh);
    this.police.push({ body, mesh, pos: new THREE.Vector3(sx, 0.5, sz), heading: 0, speed: 0, blink: 0 });
  }

  // Sample the segment for building clearance (cheap line-of-sight test).
  lineClear(x0, z0, x1, z1) {
    const d = Math.hypot(x1 - x0, z1 - z0);
    const steps = Math.max(1, Math.ceil(d / 2));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      if (!this.wd.isClear(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 0.8)) return false;
    }
    return true;
  }

  despawn(p) {
    if (!p) return;
    this.scene.remove(p.mesh);
    try { this.world.removeRigidBody(p.body); } catch (e) {}
  }

  drivePolice(p, dt, pp, ctx) {
    const graph = this.wd.graph;
    const dist = Math.hypot(pp.x - p.pos.x, pp.z - p.pos.z);

    // Aim point: drive straight at the player when close and in line of sight,
    // otherwise route toward the player along road-graph waypoints (reliable in
    // the dense grid where pure local steering gets boxed into pockets).
    let aimX, aimZ;
    if (dist < 14 && this.lineClear(p.pos.x, p.pos.z, pp.x, pp.z)) {
      aimX = pp.x; aimZ = pp.z; p.wp = -1;
    } else {
      if (p.wp === undefined || p.wp < 0) p.wp = graph.nearest(p.pos.x, p.pos.z);
      let node = graph.nodes[p.wp];
      if (Math.hypot(node.x - p.pos.x, node.z - p.pos.z) < 5) {
        // advance to the neighbour that most reduces distance to the player
        let best = p.wp, bd = Infinity;
        for (const ni of node.neighbors) {
          const n = graph.nodes[ni];
          const d = (n.x - pp.x) ** 2 + (n.z - pp.z) ** 2;
          if (d < bd) { bd = d; best = ni; }
        }
        p.wp = best; node = graph.nodes[best];
      }
      aimX = node.x; aimZ = node.z;
    }

    const desired = Math.atan2(aimX - p.pos.x, aimZ - p.pos.z);
    let hd = desired - p.heading;
    while (hd > Math.PI) hd -= Math.PI * 2;
    while (hd < -Math.PI) hd += Math.PI * 2;
    p.heading += hd * Math.min(1, dt * 4.5);

    const targetSpeed = dist > 5 ? 13 + this.level : Math.max(0, dist - 2.2) * 3;
    p.speed += (targetSpeed - p.speed) * Math.min(1, dt * 4);

    let nx = p.pos.x + Math.sin(p.heading) * p.speed * dt;
    let nz = p.pos.z + Math.cos(p.heading) * p.speed * dt;
    if (!this.wd.isClear(nx, nz, 1.1)) { nx = p.pos.x; nz = p.pos.z; p.speed *= 0.5; }
    const lim = this.wd.half - 2;
    p.pos.x = Math.max(-lim, Math.min(lim, nx));
    p.pos.z = Math.max(-lim, Math.min(lim, nz));

    // stuck-recovery: if a cop barely moves while still far, snap onto the road graph
    const moved = Math.hypot(p.pos.x - (p.lx ?? p.pos.x), p.pos.z - (p.lz ?? p.pos.z));
    p.stuckT = moved < 0.02 && dist > 6 ? (p.stuckT || 0) + dt : 0;
    if (p.stuckT > 1.5) {
      const n = graph.nodes[graph.nearest(p.pos.x, p.pos.z)];
      p.pos.x = n.x; p.pos.z = n.z; p.wp = -1; p.stuckT = 0;
    }
    p.lx = p.pos.x; p.lz = p.pos.z;
    p.body.setNextKinematicTranslation({ x: p.pos.x, y: 0.5, z: p.pos.z });
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.heading, 0));
    p.body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
  }

  render() {
    const t = performance.now() / 120;
    for (const p of this.police) {
      p.mesh.position.set(p.pos.x, 0.5, p.pos.z);
      p.mesh.rotation.y = p.heading;
      // flashing lightbar
      const on = Math.floor(t) % 2 === 0;
      const [l1, l2] = p.mesh.userData.lights;
      l1.material.opacity = on ? 1 : 0.15;
      l2.material.opacity = on ? 0.15 : 1;
    }
  }
}

function buildPoliceMesh() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1b2740, roughness: 0.4, metalness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 4.1), bodyMat);
  body.position.y = 0.1; body.castShadow = true; g.add(body);
  const white = new THREE.MeshStandardMaterial({ color: 0xdfe6ef, roughness: 0.5 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.4, 1.4), white);
  door.position.set(0, 0.05, 0); g.add(door);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.3 }));
  cab.position.set(0, 0.6, -0.1); cab.castShadow = true; g.add(cab);
  // lightbar
  const redM = new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true });
  const blueM = new THREE.MeshBasicMaterial({ color: 0x3b7bff, transparent: true });
  const r = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.3), redM);
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.3), blueM);
  r.position.set(-0.35, 0.98, 0); b.position.set(0.35, 0.98, 0);
  g.add(r); g.add(b);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0d0f13, roughness: 0.9 });
  for (const [x, z] of [[-0.8, 1.3], [0.8, 1.3], [-0.8, -1.3], [0.8, -1.3]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12), tireMat);
    w.rotation.z = Math.PI / 2; w.position.set(x, -0.25, z); g.add(w);
  }
  g.userData.lights = [r, b];
  return g;
}
