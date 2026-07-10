import * as THREE from 'three';

// Third-person orbit camera. Works on foot (mouse-look orbit) and in vehicle
// (auto-trails behind heading). Raycasts against building boxes to avoid clipping.
export class ChaseCamera {
  constructor(camera, buildingBoxes) {
    this.cam = camera;
    this.boxes = buildingBoxes;
    this.yaw = 0;
    this.pitch = 0.32;
    this.dist = 7.5;
    this.targetDist = 7.5;
    this.pos = new THREE.Vector3(0, 5, 12);
    this.look = new THREE.Vector3();
    this.sensitivity = 0.0024;
  }

  addMouse(dx, dy) {
    this.yaw -= dx * this.sensitivity;
    this.pitch -= dy * this.sensitivity;
    this.pitch = Math.max(-0.25, Math.min(1.05, this.pitch));
  }

  // On-foot: free orbit. Returns the yaw so player can move relative to camera.
  updateFoot(targetPos, dt) {
    this.targetDist = 6.5;
    this._apply(targetPos, 1.7, dt);
    return this.yaw;
  }

  // In-vehicle: camera eases toward being behind the vehicle heading, but mouse
  // still nudges. heading = vehicle forward yaw (radians).
  updateVehicle(targetPos, heading, speed, dt) {
    // ease yaw toward heading when moving; leave alone when parked so player can look around
    const behind = heading + Math.PI;
    if (Math.abs(speed) > 1.2) {
      let d = behind - this.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.yaw += d * Math.min(1, dt * 2.6);
    }
    this.targetDist = 9.5 + Math.min(4, Math.abs(speed) * 0.12);
    this.pitch = THREE.MathUtils.lerp(this.pitch, 0.3, dt * 2);
    this._apply(targetPos, 2.2, dt);
  }

  _apply(target, height, dt) {
    this.dist += (this.targetDist - this.dist) * Math.min(1, dt * 6);
    const cp = Math.cos(this.pitch);
    const desired = new THREE.Vector3(
      target.x + Math.sin(this.yaw) * this.dist * cp,
      target.y + height + Math.sin(this.pitch) * this.dist,
      target.z + Math.cos(this.yaw) * this.dist * cp
    );
    // avoid clipping into buildings: shorten dist if the segment hits a box
    const clamped = this._collide(target, desired, height);
    this.pos.lerp(clamped, Math.min(1, dt * 12));
    this.cam.position.copy(this.pos);
    this.look.set(target.x, target.y + height * 0.6, target.z);
    this.cam.lookAt(this.look);
  }

  _collide(target, desired, height) {
    // sample a few points along the ray; if inside a building box, pull in
    const from = new THREE.Vector3(target.x, target.y + height, target.z);
    const dir = desired.clone().sub(from);
    const len = dir.length();
    dir.normalize();
    let maxT = len;
    for (const b of this.boxes) {
      const hw = b.w / 2 + 0.6, hd = b.d / 2 + 0.6;
      // march
      for (let t = 1; t < len; t += 1) {
        const px = from.x + dir.x * t, pz = from.z + dir.z * t;
        if (Math.abs(px - b.x) < hw && Math.abs(pz - b.z) < hd) { maxT = Math.min(maxT, t - 0.8); break; }
      }
    }
    maxT = Math.max(2.2, maxT);
    return from.add(dir.multiplyScalar(maxT));
  }
}
