import * as THREE from 'three';
import { PHYS } from './config.js';
import { group } from './physics.js';

// Two hand-tuned vehicle profiles with materially different feel.
export const VEHICLE_TYPES = {
  // Nimble hatchback: light, quick off the line, grippy, tight fast steering.
  // Speeds are in m/s (Rapier currentVehicleSpeed is m/s in this build).
  dart: {
    name: 'Vireo Dart',
    body: { w: 1.7, h: 0.65, l: 3.7 },
    mass: 900,
    wheelRadius: 0.36, wheelBase: 1.3, track: 0.82, wheelY: -0.22,
    engineForce: 3800, brakeForce: 95, reverseForce: 1600, linDamp: 0.08,
    maxSteer: 0.60, steerSpeed: 4.4,
    suspStiffness: 34, suspRelax: 2.5, suspCompress: 1.9, suspRest: 0.32, maxTravel: 0.18,
    maxSuspForce: 35000,
    frictionSlip: 2.6, sideFriction: 0.95,
    topSpeed: 22, color: 0xff5d5d, // ~79 km/h
  },
  // Heavy truck: sluggish accel, big momentum, wide understeery slow steering.
  hauler: {
    name: 'Brunderk Hauler',
    body: { w: 2.3, h: 1.05, l: 5.4 },
    mass: 2600,
    wheelRadius: 0.55, wheelBase: 1.9, track: 1.05, wheelY: -0.35,
    engineForce: 6400, brakeForce: 150, reverseForce: 2800, linDamp: 0.14,
    maxSteer: 0.44, steerSpeed: 2.3,
    suspStiffness: 46, suspRelax: 2.6, suspCompress: 2.0, suspRest: 0.55, maxTravel: 0.3,
    maxSuspForce: 110000,
    frictionSlip: 2.0, sideFriction: 1.2,
    topSpeed: 16, color: 0xE0A43B, // ~58 km/h
  },
};

export class Vehicle {
  constructor(RAPIER, world, scene, typeKey, pos, heading = 0) {
    this.RAPIER = RAPIER; this.world = world;
    this.type = VEHICLE_TYPES[typeKey];
    this.typeKey = typeKey;
    const T = this.type;

    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, heading, 0));
    // rest ride height: chassis centre sits a full uncompressed suspension + radius above ground
    const rideY = -T.wheelY + T.suspRest + T.wheelRadius;
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(pos.x, pos.y ?? rideY, pos.z)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
      .setLinearDamping(T.linDamp)
      .setAngularDamping(1.1) // resist spin/roll for stable arcade handling
      .setCanSleep(false);
    this.body = world.createRigidBody(bodyDesc);

    const half = { x: T.body.w / 2, y: T.body.h / 2, z: T.body.l / 2 };
    const colDesc = RAPIER.ColliderDesc.cuboid(half.x, half.y, half.z)
      .setDensity(0) // all mass comes from setAdditionalMassProperties below
      .setCollisionGroups(group(PHYS.vehicleGroup, PHYS.worldGroup | PHYS.vehicleGroup | PHYS.playerGroup | PHYS.npcGroup))
      .setFriction(0.6);
    this.collider = world.createCollider(colDesc, this.body);
    // Explicit mass + lowered centre of mass so the vehicle resists rollover.
    const m = T.mass;
    const w = T.body.w, h = T.body.h, l = T.body.l;
    const inertia = {
      x: m / 12 * (h * h + l * l),
      y: m / 12 * (w * w + l * l),
      z: m / 12 * (w * w + h * h),
    };
    this.body.setAdditionalMassProperties(
      m, { x: 0, y: -h * 0.5, z: 0 }, inertia, { x: 0, y: 0, z: 0, w: 1 }, true
    );

    this.vc = world.createVehicleController(this.body);
    const dir = { x: 0, y: -1, z: 0 };
    // axle (1,0,0) makes wheel-forward = +Z (the car's visual front), so engine
    // force and currentVehicleSpeed are positive when driving forward.
    const axle = { x: 1, y: 0, z: 0 };
    const hw = T.track, hl = T.wheelBase;
    const cp = (x, z) => ({ x, y: T.wheelY, z });
    // wheel order: 0 FL, 1 FR, 2 RL, 3 RR
    this.wheelPos = [cp(-hw, hl), cp(hw, hl), cp(-hw, -hl), cp(hw, -hl)];
    for (const p of this.wheelPos) {
      this.vc.addWheel(p, dir, axle, T.suspRest, T.wheelRadius);
    }
    for (let i = 0; i < 4; i++) {
      this.vc.setWheelSuspensionStiffness(i, T.suspStiffness);
      this.vc.setWheelSuspensionRelaxation(i, T.suspRelax);
      this.vc.setWheelSuspensionCompression(i, T.suspCompress);
      this.vc.setWheelMaxSuspensionTravel(i, T.maxTravel);
      this.vc.setWheelMaxSuspensionForce(i, T.maxSuspForce);
      this.vc.setWheelFrictionSlip(i, T.frictionSlip);
      this.vc.setWheelSideFrictionStiffness(i, T.sideFriction);
    }

    this.steer = 0;
    this.occupied = false;
    this.mesh = buildVehicleMesh(T);
    scene.add(this.mesh);
    this.wheelMeshes = this.mesh.userData.wheels;
    this._wheelRot = 0;
  }

  get heading() {
    const r = this.body.rotation();
    const q = new THREE.Quaternion(r.x, r.y, r.z, r.w);
    const f = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    return Math.atan2(f.x, f.z);
  }
  get position() { const t = this.body.translation(); return new THREE.Vector3(t.x, t.y, t.z); }
  get speed() { return this.vc.currentVehicleSpeed(); }   // m/s, +ve = forward
  get speedMS() { return this.vc.currentVehicleSpeed(); }  // m/s (alias for clarity)
  get speedKmh() { return this.vc.currentVehicleSpeed() * 3.6; }
  get speedAbs() { const v = this.body.linvel(); return Math.hypot(v.x, v.z); } // total planar speed

  // control input: throttle [-1..1], steerInput [-1..1], handbrake bool
  control(dt, throttle, steerInput, handbrake) {
    const T = this.type;
    // steering easing
    const targetSteer = steerInput * T.maxSteer;
    this.steer += (targetSteer - this.steer) * Math.min(1, dt * T.steerSpeed);
    this.vc.setWheelSteering(0, this.steer);
    this.vc.setWheelSteering(1, this.steer);

    const spd = this.speed; // +ve = moving forward (km/h)
    let engine = 0, brake = 0;
    const overTop = Math.abs(spd) > T.topSpeed;
    if (throttle > 0.02) {
      if (spd < -1.0) { brake = T.brakeForce; } // moving backward -> brake to stop first
      else engine = overTop ? 0 : throttle * T.engineForce;
    } else if (throttle < -0.02) {
      if (spd > 1.0) brake = T.brakeForce; // moving forward -> brake to stop first
      else engine = throttle * T.reverseForce; // throttle<0 -> negative engine force -> reverse
    } else {
      brake = 6; // light engine braking
    }
    // rear-wheel drive
    this.vc.setWheelEngineForce(2, engine);
    this.vc.setWheelEngineForce(3, engine);
    const hb = handbrake ? T.brakeForce * 2.2 : 0;
    this.vc.setWheelBrake(0, brake);
    this.vc.setWheelBrake(1, brake);
    this.vc.setWheelBrake(2, brake + hb);
    this.vc.setWheelBrake(3, brake + hb);

    // reduce sideways grip on handbrake for slides
    const side = handbrake ? T.sideFriction * 0.35 : T.sideFriction;
    this.vc.setWheelSideFrictionStiffness(2, side);
    this.vc.setWheelSideFrictionStiffness(3, side);
  }

  idle() {
    for (let i = 0; i < 4; i++) { this.vc.setWheelEngineForce(i, 0); this.vc.setWheelBrake(i, this.type.brakeForce); }
  }

  step(dt) {
    this.vc.updateVehicle(dt, this.RAPIER.QueryFilterFlags?.EXCLUDE_KINEMATIC ?? 0, undefined,
      (c) => c !== this.collider);
  }

  render() {
    const t = this.body.translation();
    const r = this.body.rotation();
    this.mesh.position.set(t.x, t.y, t.z);
    this.mesh.quaternion.set(r.x, r.y, r.z, r.w);
    // wheels
    this._wheelRot -= this.speedMS * 0.06;
    for (let i = 0; i < 4; i++) {
      const wm = this.wheelMeshes[i];
      const susp = this.vc.wheelSuspensionLength(i) ?? this.type.suspRest;
      wm.position.y = this.type.wheelY - (susp - this.type.suspRest);
      wm.rotation.set(0, i < 2 ? this.steer : 0, 0);
      wm.children[0].rotation.x = this._wheelRot;
    }
  }
}

function buildVehicleMesh(T) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: T.color, roughness: 0.4, metalness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.2, metalness: 0.3 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x15181f, roughness: 0.7 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(T.body.w, T.body.h, T.body.l), bodyMat);
  chassis.castShadow = true; chassis.position.y = 0.05; g.add(chassis);
  // cabin
  const cabH = T.body.h * (T.name.includes('Hauler') ? 1.2 : 1.0);
  const cabL = T.body.l * (T.name.includes('Hauler') ? 0.42 : 0.5);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(T.body.w * 0.9, cabH, cabL), glassMat);
  cab.position.set(0, T.body.h * 0.6 + 0.05, T.name.includes('Hauler') ? T.body.l * 0.18 : -0.1);
  cab.castShadow = true; g.add(cab);
  // cargo box for the hauler
  if (T.name.includes('Hauler')) {
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(T.body.w * 1.02, T.body.h * 1.4, T.body.l * 0.5), trimMat);
    cargo.position.set(0, T.body.h * 0.6, -T.body.l * 0.22);
    cargo.castShadow = true; g.add(cargo);
  }
  // headlights
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
  for (const sx of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.14, 0.06), hlMat);
    hl.position.set(sx * T.body.w * 0.32, 0.05, T.body.l / 2);
    g.add(hl);
  }

  // wheels
  const wheels = [];
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0d0f13, roughness: 0.9 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0xb8c0cc, metalness: 0.7, roughness: 0.3 });
  const hw = T.track, hl2 = T.wheelBase;
  const positions = [[-hw, hl2], [hw, hl2], [-hw, -hl2], [hw, -hl2]];
  for (const [x, z] of positions) {
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(T.wheelRadius, T.wheelRadius, 0.28, 16), tireMat);
    tire.rotation.z = Math.PI / 2; tire.castShadow = true;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(T.wheelRadius * 0.5, T.wheelRadius * 0.5, 0.3, 8), hubMat);
    hub.rotation.z = Math.PI / 2;
    tire.add(hub);
    wg.add(tire);
    wg.position.set(x, T.wheelY, z);
    g.add(wg);
    wheels.push(wg);
  }
  g.userData.wheels = wheels;
  return g;
}
