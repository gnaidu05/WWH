import * as THREE from 'three';
import { CITY, roadCenter, PHYS } from './config.js';
import { group } from './physics.js';
import { buildCharacter, animateCharacter } from './character.js';

// Pedestrians walk sidewalk loops around blocks and flee from danger
// (nearby speeding vehicles or gunfire/heat). Kinematic capsules.
const SKIN = [0xd9a066, 0xc98a5e, 0xe0b088, 0xa9713f];
const CLOTH = [0x4a6f8f, 0x8f4a5a, 0x4a8f6a, 0x6a5a8f, 0x8f7a4a, 0x3a3f4a];

export class PedSystem {
  constructor(RAPIER, world, scene, worldData, count = 42) {
    this.RAPIER = RAPIER; this.world = world; this.scene = scene; this.wd = worldData;
    this.peds = [];
    this._rng = 918273;
    // Build sidewalk waypoint loops: perimeter of each block, inset from road.
    this.loops = this.buildLoops();
    for (let i = 0; i < count; i++) this.spawn();
  }
  rnd() { this._rng = (this._rng * 1664525 + 1013904223) >>> 0; return this._rng / 4294967296; }

  buildLoops() {
    const loops = [];
    const cell = CITY.block + CITY.road;
    const half = CITY.span / 2;
    const inset = CITY.road / 2 + 1.0; // just onto the sidewalk from the road edge
    for (let bi = 0; bi < CITY.blocks; bi++) {
      for (let bj = 0; bj < CITY.blocks; bj++) {
        const cx = -half + CITY.road + CITY.block / 2 + bi * cell;
        const cz = -half + CITY.road + CITY.block / 2 + bj * cell;
        const e = CITY.block / 2 - 1.0;
        loops.push([
          { x: cx - e, z: cz - e }, { x: cx + e, z: cz - e },
          { x: cx + e, z: cz + e }, { x: cx - e, z: cz + e },
        ]);
      }
    }
    return loops;
  }

  spawn() {
    const RAPIER = this.RAPIER;
    const loop = this.loops[(this.rnd() * this.loops.length) | 0];
    const wp = (this.rnd() * loop.length) | 0;
    const p = loop[wp];
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(p.x, 1.0, p.z)
    );
    // Peds collide with the on-foot player but NOT with vehicles — a car mows
    // through them (peds.hitTest handles the kill), so it never decelerates below
    // the offense speed threshold before the overlap registers.
    this.world.createCollider(
      RAPIER.ColliderDesc.capsule(0.5, 0.35)
        .setCollisionGroups(group(PHYS.npcGroup, PHYS.playerGroup)),
      body
    );
    const HAIR = [0x241a12, 0x0e0c0a, 0x5a4632, 0x8a7a5a, 0x3a2a1a];
    const SHOE = [0x14161c, 0x2a2320, 0x3a3f4a];
    const mesh = buildCharacter({
      skin: SKIN[(this.rnd() * SKIN.length) | 0],
      shirt: CLOTH[(this.rnd() * CLOTH.length) | 0],
      pants: CLOTH[(this.rnd() * CLOTH.length) | 0],
      hair: HAIR[(this.rnd() * HAIR.length) | 0],
      shoe: SHOE[(this.rnd() * SHOE.length) | 0],
    });
    this.scene.add(mesh);
    this.peds.push({
      body, mesh, loop, wp, dir: this.rnd() < 0.5 ? 1 : -1,
      pos: new THREE.Vector3(p.x, 1.0, p.z),
      heading: 0, speed: 1.1 + this.rnd() * 0.5, flee: 0, alive: true,
    });
  }

  update(dt, ctx) {
    const state = ctx.state;
    const threat = state.mode === 'drive' ? state.vehicle : null;
    const threatSpeed = threat ? Math.abs(threat.speedMS) : 0;
    const wanted = ctx.wanted.level;

    for (const ped of this.peds) {
      if (!ped.alive) continue;
      // detect nearby threat -> flee
      let fleeDir = null;
      const px = ped.pos.x, pz = ped.pos.z;
      if (threat && threatSpeed > 4) {
        const d = Math.hypot(threat.position.x - px, threat.position.z - pz);
        if (d < 9) { fleeDir = new THREE.Vector3(px - threat.position.x, 0, pz - threat.position.z).normalize(); ped.flee = 2.0; }
      }
      if (wanted >= 3) ped.flee = Math.max(ped.flee, 0.5); // panic in heavy heat
      ped.flee = Math.max(0, ped.flee - dt);

      let tx, tz, spd;
      if (fleeDir || ped.flee > 0) {
        const fd = fleeDir || new THREE.Vector3(Math.sin(ped.heading), 0, Math.cos(ped.heading));
        tx = px + fd.x; tz = pz + fd.z; spd = 3.4;
      } else {
        const t = ped.loop[ped.wp];
        tx = t.x; tz = t.z; spd = ped.speed;
        if (Math.hypot(tx - px, tz - pz) < 0.6) {
          ped.wp = (ped.wp + ped.dir + ped.loop.length) % ped.loop.length;
        }
      }
      const dx = tx - px, dz = tz - pz;
      const dl = Math.hypot(dx, dz) || 1;
      ped.heading = Math.atan2(dx / dl, dz / dl);
      const step = Math.min(dl, spd * dt);
      ped.pos.x += (dx / dl) * step;
      ped.pos.z += (dz / dl) * step;
      // keep inside map
      const lim = this.wd.half - 2;
      ped.pos.x = Math.max(-lim, Math.min(lim, ped.pos.x));
      ped.pos.z = Math.max(-lim, Math.min(lim, ped.pos.z));

      ped.body.setNextKinematicTranslation({ x: ped.pos.x, y: 1.0, z: ped.pos.z });
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ped.heading, 0));
      ped.body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
      ped._spd = spd;
    }
  }

  // Kill a pedestrian near a point (car hits). Returns true if one was hit.
  hitTest(x, z, r = 1.6) {
    for (const ped of this.peds) {
      if (!ped.alive) continue;
      if (Math.hypot(ped.pos.x - x, ped.pos.z - z) < r) {
        ped.alive = false;
        ped.mesh.rotation.z = Math.PI / 2; // ragdoll-ish flop
        ped.mesh.position.y = 0.4;
        // remove collider so it doesn't block
        this.world.removeRigidBody(ped.body);
        // respawn a replacement after a while by recycling
        setTimeout(() => this.recycle(ped), 8000);
        return true;
      }
    }
    return false;
  }

  recycle(ped) {
    const i = this.peds.indexOf(ped);
    if (i >= 0) { this.scene.remove(ped.mesh); this.peds.splice(i, 1); this.spawn(); }
  }

  render(dt = 0.016) {
    for (const ped of this.peds) {
      ped.mesh.position.set(ped.pos.x, ped.alive ? 0 : 0.4, ped.pos.z);
      if (ped.alive) {
        ped.mesh.rotation.y = ped.heading;
        animateCharacter(ped.mesh, dt, ped._spd || 0);
      }
    }
  }
}

