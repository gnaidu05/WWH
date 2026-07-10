import * as THREE from 'three';
import { CITY, roadCenter, PHYS } from './config.js';
import { group } from './physics.js';

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
    const mesh = buildPedMesh(SKIN[(this.rnd() * SKIN.length) | 0], CLOTH[(this.rnd() * CLOTH.length) | 0]);
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

  render(t) {
    for (const ped of this.peds) {
      ped.mesh.position.set(ped.pos.x, ped.alive ? 0 : 0.4, ped.pos.z);
      if (ped.alive) {
        ped.mesh.rotation.y = ped.heading;
        const bob = Math.sin((performance.now() / 1000) * (ped._spd > 2 ? 14 : 9)) * (ped._spd > 0.1 ? 0.5 : 0);
        if (ped.mesh.userData.legs) {
          ped.mesh.userData.legs[0].rotation.x = bob;
          ped.mesh.userData.legs[1].rotation.x = -bob;
        }
      }
    }
  }
}

function buildPedMesh(skin, cloth) {
  const g = new THREE.Group();
  const cm = new THREE.MeshStandardMaterial({ color: cloth, roughness: 0.7 });
  const sm = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.42, 4, 6), cm);
  torso.position.y = 1.05; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), sm);
  head.position.y = 1.5; head.castShadow = true; g.add(head);
  const legGeo = new THREE.CapsuleGeometry(0.1, 0.44, 4, 6);
  const pm = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.8 });
  const legL = new THREE.Group(), legR = new THREE.Group();
  const l1 = new THREE.Mesh(legGeo, pm); l1.position.y = -0.3; legL.add(l1);
  const l2 = new THREE.Mesh(legGeo, pm); l2.position.y = -0.3; legR.add(l2);
  legL.position.set(-0.12, 0.66, 0); legR.position.set(0.12, 0.66, 0);
  g.add(legL); g.add(legR);
  g.userData.legs = [legL, legR];
  return g;
}
