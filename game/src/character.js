import * as THREE from 'three';

// Shared stylized-but-anatomical humanoid used by the player and pedestrians.
// Feet rest at y=0. Two-segment arms and legs (elbows/knees), neck, hair, hands
// and feet, driven by a natural phased walk cycle. Geometries are cached and
// shared across every character; only materials (colours) vary per person.

const CAP = (r, l, cs = 5, rs = 8) => new THREE.CapsuleGeometry(r, l, cs, rs);
const G = {
  head: new THREE.SphereGeometry(0.135, 14, 12),
  hair: new THREE.SphereGeometry(0.15, 14, 10),
  neck: new THREE.CylinderGeometry(0.06, 0.07, 0.12, 8),
  torso: CAP(0.16, 0.42),
  hips: CAP(0.15, 0.12),
  thigh: CAP(0.11, 0.36),
  shin: CAP(0.09, 0.36),
  foot: new THREE.BoxGeometry(0.13, 0.09, 0.28),
  upperArm: CAP(0.07, 0.26),
  foreArm: CAP(0.06, 0.24),
  hand: new THREE.BoxGeometry(0.09, 0.13, 0.07),
};

// A two-segment limb hanging from a pivot at the joint. Returns the pivot group
// with userData.lower = the knee/elbow pivot so the walk cycle can bend it.
function limb(upperGeo, upperLen, lowerGeo, lowerLen, matUpper, matLower, foot, matFoot) {
  const pivot = new THREE.Group();
  const upper = new THREE.Mesh(upperGeo, matUpper);
  upper.position.y = -upperLen / 2; upper.castShadow = true;
  pivot.add(upper);
  const lower = new THREE.Group();
  lower.position.y = -upperLen;
  const lowerMesh = new THREE.Mesh(lowerGeo, matLower);
  lowerMesh.position.y = -lowerLen / 2; lowerMesh.castShadow = true;
  lower.add(lowerMesh);
  if (foot) {
    const f = new THREE.Mesh(G.foot, matFoot);
    f.position.set(0, -lowerLen + 0.02, 0.06); f.castShadow = true;
    lower.add(f);
  }
  pivot.add(lower);
  pivot.userData.lower = lower;
  return pivot;
}

export function buildCharacter(opts = {}) {
  const skin = new THREE.MeshStandardMaterial({ color: opts.skin ?? 0xd9a066, roughness: 0.72 });
  const shirt = new THREE.MeshStandardMaterial({ color: opts.shirt ?? 0x3a6f8f, roughness: 0.62 });
  const pants = new THREE.MeshStandardMaterial({ color: opts.pants ?? 0x2a2f3a, roughness: 0.8 });
  const hairM = new THREE.MeshStandardMaterial({ color: opts.hair ?? 0x2a1c12, roughness: 0.85 });
  const shoe = new THREE.MeshStandardMaterial({ color: opts.shoe ?? 0x14161c, roughness: 0.6 });

  const g = new THREE.Group();
  const root = new THREE.Group(); // bobs during the walk
  g.add(root);

  // torso + hips
  const hips = new THREE.Mesh(G.hips, pants); hips.position.y = 0.9; hips.castShadow = true; root.add(hips);
  const torso = new THREE.Mesh(G.torso, shirt); torso.position.y = 1.18; torso.castShadow = true; root.add(torso);
  const neck = new THREE.Mesh(G.neck, skin); neck.position.y = 1.46; root.add(neck);
  const head = new THREE.Mesh(G.head, skin); head.position.y = 1.62; head.castShadow = true; root.add(head);
  const hair = new THREE.Mesh(G.hair, hairM);
  hair.position.set(0, 1.66, -0.02); hair.scale.set(1, 0.85, 1.05); root.add(hair);

  // legs (hips ~0.9 down to feet)
  const legL = limb(G.thigh, 0.36, G.shin, 0.36, pants, pants, true, shoe);
  const legR = limb(G.thigh, 0.36, G.shin, 0.36, pants, pants, true, shoe);
  legL.position.set(-0.1, 0.9, 0); legR.position.set(0.1, 0.9, 0);
  root.add(legL); root.add(legR);

  // arms (shoulders ~1.4)
  const armL = limb(G.upperArm, 0.26, G.foreArm, 0.24, shirt, skin, false);
  const armR = limb(G.upperArm, 0.26, G.foreArm, 0.24, shirt, skin, false);
  const handL = new THREE.Mesh(G.hand, skin); handL.position.y = -0.24; armL.userData.lower.add(handL);
  const handR = new THREE.Mesh(G.hand, skin); handR.position.y = -0.24; armR.userData.lower.add(handR);
  armL.position.set(-0.24, 1.4, 0); armR.position.set(0.24, 1.4, 0);
  root.add(armL); root.add(armR);

  g.userData = { root, legs: [legL, legR], arms: [armL, armR], baseY: 0, phase: Math.random() * 6.28 };
  return g;
}

// Advance a character's walk cycle. dt drives the phase; moving/running set gait.
export function animateCharacter(g, dt, speed) {
  const u = g.userData; if (!u) return;
  const moving = speed > 0.15;
  const rate = speed > 5 ? 13 : 9;
  u.phase += (moving ? rate : 0) * dt;
  const p = u.phase;
  const amp = Math.min(1, speed / 4) * (speed > 5 ? 0.75 : 0.5);

  const [legL, legR] = u.legs, [armL, armR] = u.arms;
  // hips swing
  legL.rotation.x = Math.sin(p) * amp;
  legR.rotation.x = Math.sin(p + Math.PI) * amp;
  // knees bend during the leg's recovery (never hyperextend)
  legL.userData.lower.rotation.x = Math.max(0, -Math.sin(p - 0.6)) * amp * 1.4;
  legR.userData.lower.rotation.x = Math.max(0, -Math.sin(p + Math.PI - 0.6)) * amp * 1.4;
  // arms counter-swing with a slight fixed elbow bend
  armL.rotation.x = Math.sin(p + Math.PI) * amp * 0.8;
  armR.rotation.x = Math.sin(p) * amp * 0.8;
  armL.userData.lower.rotation.x = 0.25 + Math.max(0, Math.sin(p)) * amp * 0.4;
  armR.userData.lower.rotation.x = 0.25 + Math.max(0, Math.sin(p + Math.PI)) * amp * 0.4;
  // subtle vertical bob at twice the stride
  u.root.position.y = moving ? Math.abs(Math.sin(p)) * 0.045 * amp : 0;

  // ease limbs back to rest when idle
  if (!moving) {
    for (const part of [legL, legR, armL, armR]) {
      part.rotation.x *= 0.8; part.userData.lower.rotation.x *= 0.8;
    }
    armL.userData.lower.rotation.x = 0.25; armR.userData.lower.rotation.x = 0.25;
  }
}
