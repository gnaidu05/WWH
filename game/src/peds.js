import * as THREE from 'three';
import { PHYS } from './config.js';
import { group } from './physics.js';
import { buildCharacter, animateCharacter } from './character.js';

// Pedestrians stroll the real road network (offset onto the roadside) and flee
// from danger (nearby speeding vehicles or heavy police heat). Kinematic bodies.
const SKIN = [0xd9a066, 0xc98a5e, 0xe0b088, 0xa9713f, 0x8a5a3a, 0xf0c090];
const CLOTH = [0x4a6f8f, 0x8f4a5a, 0x4a8f6a, 0x6a5a8f, 0x8f7a4a, 0x3a3f4a, 0xb04a3a, 0x2a7a8a];
const PED_OFFSET = 3.4; // metres to the roadside of the road centreline

export class PedSystem {
  constructor(RAPIER, world, scene, worldData, count = 46) {
    this.RAPIER = RAPIER; this.world = world; this.scene = scene; this.wd = worldData;
    this.graph = worldData.graph;
    this.peds = [];
    this._rng = 918273;
    for (let i = 0; i < count; i++) this.spawn();
  }
  rnd() { this._rng = (this._rng * 1664525 + 1013904223) >>> 0; return this._rng / 4294967296; }

  // pick a random graph node that has at least one neighbour
  randEdge() {
    const nodes = this.graph.nodes;
    for (let t = 0; t < 30; t++) {
      const a = nodes[(this.rnd() * nodes.length) | 0];
      if (a.neighbors.length) return { from: a, to: nodes[a.neighbors[(this.rnd() * a.neighbors.length) | 0]] };
    }
    const a = nodes[0]; return { from: a, to: nodes[a.neighbors[0]] };
  }

  spawn() {
    const RAPIER = this.RAPIER;
    const e = this.randEdge();
    const lp = this.graph.lanePos(e.from, e.to, PED_OFFSET);
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(lp.x, 1.0, lp.z)
    );
    // Peds collide with the on-foot player but NOT with vehicles — a car mows
    // through them (peds.hitTest handles the kill).
    this.world.createCollider(
      RAPIER.ColliderDesc.capsule(0.5, 0.35).setCollisionGroups(group(PHYS.npcGroup, PHYS.playerGroup)),
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
      body, mesh, from: e.from, to: e.to,
      pos: new THREE.Vector3(lp.x, 1.0, lp.z),
      heading: 0, speed: 1.0 + this.rnd() * 0.6, flee: 0, alive: true,
    });
  }

  update(dt, ctx) {
    const state = ctx.state;
    const threat = state.mode === 'drive' ? state.vehicle : null;
    const threatSpeed = threat ? Math.abs(threat.speedMS) : 0;
    const wanted = ctx.wanted.level;
    const graph = this.graph;

    for (const ped of this.peds) {
      if (!ped.alive) continue;
      const px = ped.pos.x, pz = ped.pos.z;
      let fleeDir = null;
      if (threat && threatSpeed > 4) {
        const d = Math.hypot(threat.position.x - px, threat.position.z - pz);
        if (d < 9) { fleeDir = new THREE.Vector3(px - threat.position.x, 0, pz - threat.position.z).normalize(); ped.flee = 2.0; }
      }
      if (wanted >= 3) ped.flee = Math.max(ped.flee, 0.5);
      ped.flee = Math.max(0, ped.flee - dt);

      let tx, tz, spd;
      if (fleeDir || ped.flee > 0) {
        const fd = fleeDir || new THREE.Vector3(Math.sin(ped.heading), 0, Math.cos(ped.heading));
        tx = px + fd.x; tz = pz + fd.z; spd = 3.4;
      } else {
        let t = graph.lanePos(ped.from, ped.to, PED_OFFSET);
        // reached this segment's roadside target -> advance to a neighbour
        if (Math.hypot(t.x - px, t.z - pz) < 1.5) {
          const opts = ped.to.neighbors.filter(ni => graph.nodes[ni] !== ped.from);
          const list = opts.length ? opts : ped.to.neighbors;
          ped.from = ped.to;
          ped.to = graph.nodes[list[(this.rnd() * list.length) | 0]];
          t = graph.lanePos(ped.from, ped.to, PED_OFFSET);
        }
        tx = t.x; tz = t.z; spd = ped.speed;
      }
      const dx = tx - px, dz = tz - pz;
      const dl = Math.hypot(dx, dz) || 1;
      ped.heading = Math.atan2(dx / dl, dz / dl);
      const step = Math.min(dl, spd * dt);
      ped.pos.x += (dx / dl) * step;
      ped.pos.z += (dz / dl) * step;
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

