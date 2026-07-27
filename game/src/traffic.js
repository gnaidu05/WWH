import * as THREE from 'three';
import { PHYS } from './config.js';
import { group } from './physics.js';

// AI traffic: kinematic cars that follow the road graph in right-hand lanes,
// yield at occupied intersections, and brake for cars/obstacles ahead.
const CAR_COLORS = [0x8fb4d6, 0xd67d7d, 0x88c9a1, 0xd6c07d, 0xb69bd6, 0xcfd3d8, 0x7d97d6];

export class TrafficSystem {
  constructor(RAPIER, world, scene, worldData, count = 26) {
    this.RAPIER = RAPIER; this.world = world; this.scene = scene; this.wd = worldData;
    this.graph = worldData.graph;
    this.cars = [];
    this.occupied = new Map(); // nodeIndex -> car (intersection claim)
    this._rng = 20260710;

    const nodes = this.graph.nodes;
    let placed = 0, tries = 0;
    while (placed < count && tries < count * 20) {
      tries++;
      const a = nodes[(this.rnd() * nodes.length) | 0];
      if (!a.neighbors.length) continue;
      const b = nodes[a.neighbors[(this.rnd() * a.neighbors.length) | 0]];
      const car = this.makeCar(a, b);
      // avoid stacking spawns
      const lp = this.graph.lanePos(a, b);
      if (this.cars.some(c => Math.hypot(c.body.translation().x - lp.x, c.body.translation().z - lp.z) < 7)) continue;
      this.cars.push(car); placed++;
    }
  }

  rnd() { this._rng = (this._rng * 1664525 + 1013904223) >>> 0; return this._rng / 4294967296; }

  makeCar(from, to) {
    const RAPIER = this.RAPIER;
    const lp = this.graph.lanePos(from, to);
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(lp.x, 0.5, lp.z)
    );
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.9, 0.5, 2.1)
        .setCollisionGroups(group(PHYS.npcGroup, PHYS.playerGroup | PHYS.vehicleGroup | PHYS.npcGroup)),
      body
    );
    const color = CAR_COLORS[(this.rnd() * CAR_COLORS.length) | 0];
    const mesh = buildTrafficMesh(color);
    this.scene.add(mesh);
    return {
      body, mesh, from, to,
      pos: new THREE.Vector3(lp.x, 0.5, lp.z),
      heading: Math.atan2(to.x - from.x, to.z - from.z),
      speed: 0, maxSpeed: 8 + this.rnd() * 4,
      claim: -1,
    };
  }

  update(dt, ctx) {
    const playerV = ctx.state.vehicle;
    for (const car of this.cars) {
      const target = this.graph.lanePos(car.from, car.to);
      const dx = target.x - car.pos.x, dz = target.z - car.pos.z;
      const dist = Math.hypot(dx, dz);
      const desiredHeading = Math.atan2(dx, dz);

      // ---- obstacle / car-ahead braking ----
      let stop = false;
      const aheadX = car.pos.x + Math.sin(car.heading) * 5;
      const aheadZ = car.pos.z + Math.cos(car.heading) * 5;
      for (const other of this.cars) {
        if (other === car) continue;
        const od = Math.hypot(other.pos.x - aheadX, other.pos.z - aheadZ);
        if (od < 3.2) { stop = true; break; }
      }
      // player vehicle ahead
      if (!stop && playerV) {
        const p = playerV.position;
        if (Math.hypot(p.x - aheadX, p.z - aheadZ) < 3.6) stop = true;
      }

      // ---- intersection yield: claim target node within 6 units ----
      const toIdx = car.to.index;
      if (dist < 7 && car.claim !== toIdx) {
        const holder = this.occupied.get(toIdx);
        if (holder && holder !== car) stop = true; // someone owns it, wait
        else { this.occupied.set(toIdx, car); car.claim = toIdx; }
      }

      const targetSpeed = stop ? 0 : car.maxSpeed;
      car.speed += (targetSpeed - car.speed) * Math.min(1, dt * 3);

      // smooth heading
      let hd = desiredHeading - car.heading;
      while (hd > Math.PI) hd -= Math.PI * 2;
      while (hd < -Math.PI) hd += Math.PI * 2;
      car.heading += hd * Math.min(1, dt * 4);

      // advance
      const step = car.speed * dt;
      car.pos.x += Math.sin(car.heading) * step;
      car.pos.z += Math.cos(car.heading) * step;

      // reached the target node -> pick next segment
      if (dist < 2.2) {
        if (car.claim === toIdx) { this.occupied.delete(toIdx); car.claim = -1; }
        const prev = car.from;
        car.from = car.to;
        // choose next neighbour, avoid immediate U-turn unless dead-end
        const opts = car.from.neighbors.filter(ni => this.graph.nodes[ni] !== prev);
        const pick = (opts.length ? opts : car.from.neighbors)[(this.rnd() * (opts.length || car.from.neighbors.length)) | 0];
        car.to = this.graph.nodes[pick];
      }

      car.body.setNextKinematicTranslation({ x: car.pos.x, y: 0.5, z: car.pos.z });
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, car.heading, 0));
      car.body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
    }
  }

  // Report a car near a point (for wanted collisions etc.)
  render() {
    for (const car of this.cars) {
      car.mesh.position.set(car.pos.x, 0.5, car.pos.z);
      car.mesh.rotation.y = car.heading;
    }
  }
}

function buildTrafficMesh(color) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 4.0), bodyMat);
  body.position.y = 0.1; body.castShadow = true; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 2.0), glassMat);
  cab.position.set(0, 0.6, -0.1); cab.castShadow = true; g.add(cab);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0d0f13, roughness: 0.9 });
  for (const [x, z] of [[-0.8, 1.3], [0.8, 1.3], [-0.8, -1.3], [0.8, -1.3]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12), tireMat);
    w.rotation.z = Math.PI / 2; w.position.set(x, -0.25, z); g.add(w);
  }
  return g;
}
