import * as THREE from 'three';
import { PHYS } from './config.js';
import { group } from './physics.js';
import { buildCharacter, animateCharacter } from './character.js';

// On-foot player: Rapier kinematic-position body + capsule, driven by a
// KinematicCharacterController for collide-and-slide, autostep and snap-to-ground.
export class Player {
  constructor(RAPIER, world, scene, spawn) {
    this.RAPIER = RAPIER;
    this.world = world;
    this.radius = 0.4;
    this.halfH = 0.62; // half height of the cylindrical part

    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(spawn.x, 2, spawn.z);
    this.body = world.createRigidBody(bodyDesc);
    const colDesc = RAPIER.ColliderDesc.capsule(this.halfH, this.radius)
      .setCollisionGroups(group(PHYS.playerGroup, PHYS.worldGroup | PHYS.vehicleGroup))
      .setFriction(0.4);
    this.collider = world.createCollider(colDesc, this.body);

    this.controller = world.createCharacterController(0.08);
    this.controller.enableAutostep(0.4, 0.2, true);
    this.controller.enableSnapToGround(0.5);
    this.controller.setApplyImpulsesToDynamicBodies(true);
    this.controller.setCharacterMass(80);

    this.velY = 0;
    this.grounded = false;
    this.heading = 0;
    this.speed2d = 0;
    this.visible = true;

    // ---- mesh: stylized humanoid ----
    this.mesh = buildCharacter({ skin: 0xd9a066, shirt: 0x2f6f8f, pants: 0x2a2f3a, hair: 0x241a12, shoe: 0x14161c });
    scene.add(this.mesh);
    this.group = this.mesh;
    this._lastT = 0;
  }

  get position() { const t = this.body.translation(); return new THREE.Vector3(t.x, t.y, t.z); }
  // feet position (for camera target we use chest)
  get chest() { const t = this.body.translation(); return new THREE.Vector3(t.x, t.y + 0.3, t.z); }

  setEnabled(on) {
    this.visible = on;
    this.mesh.visible = on;
    // park the body far below when disabled so it doesn't collide
    this.body.setEnabled(on);
  }

  teleport(x, z, y = 2) {
    this.body.setNextKinematicTranslation({ x, y, z });
    this.body.setTranslation({ x, y, z }, true);
    this.velY = 0;
  }

  update(dt, input, camYaw) {
    if (!this.visible) return;
    const move = input.moveAxis();
    const running = input.down('ShiftLeft') || input.down('ShiftRight');
    const walkSpeed = running ? 7.2 : 3.6;

    // camera-relative movement direction
    let dir = new THREE.Vector3(0, 0, 0);
    if (move.x !== 0 || move.y !== 0) {
      const forward = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
      const right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
      dir.addScaledVector(forward, move.y).addScaledVector(right, move.x);
      if (dir.lengthSq() > 0) dir.normalize();
    }

    // gravity + jump
    this.velY += PHYS.gravity * dt;
    if (this.grounded && this.velY < 0) this.velY = -1; // stick
    if (this.grounded && input.justPressed('Space')) this.velY = 8.4;

    const desired = {
      x: dir.x * walkSpeed * dt,
      y: this.velY * dt,
      z: dir.z * walkSpeed * dt,
    };
    this.controller.computeColliderMovement(this.collider, desired);
    this.grounded = this.controller.computedGrounded();
    const corr = this.controller.computedMovement();
    const t = this.body.translation();
    const nx = t.x + corr.x, ny = t.y + corr.y, nz = t.z + corr.z;
    this.body.setNextKinematicTranslation({ x: nx, y: ny, z: nz });

    // face movement direction
    this.speed2d = Math.hypot(dir.x, dir.z) * walkSpeed;
    if (dir.lengthSq() > 0.001) {
      this.heading = Math.atan2(dir.x, dir.z);
    }

    // fell off world safety
    if (ny < -10) this.teleport(t.x, t.z, 3);
  }

  render(t) {
    if (!this.visible) return;
    const dt = Math.min(0.05, Math.max(0, t - this._lastT)); this._lastT = t;
    const p = this.body.translation();
    this.mesh.position.set(p.x, p.y - (this.halfH + this.radius), p.z);
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, this.heading, 0.3);
    animateCharacter(this.mesh, dt, this.speed2d);
  }
}

