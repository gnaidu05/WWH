import * as THREE from 'three';
import { PHYS } from './config.js';
import { group } from './physics.js';
import MAP from './punawale.json';

// Builds the real Punawale (Pune) district from bundled OpenStreetMap data:
// drivable road ribbons, extruded building footprints with collision, a
// navigation graph (shared OSM nodes = intersections) that the traffic and
// police AI drive on, and a player-following sun so shadows stay crisp across
// the ~2km map. Returns the same worldData shape as the procedural builder.
export function buildOSMWorld(scene, RAPIER, world) {
  const half = MAP.meta.half;

  // ---- sky / fog / light (bright hazy daytime for map legibility) ----
  scene.background = new THREE.Color(0xaec6dd);
  scene.fog = new THREE.Fog(0xaec6dd, 150, 430);
  scene.add(new THREE.HemisphereLight(0xdae8f5, 0x6a6a5a, 1.25));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const S = 140; // shadow frustum follows the player
  Object.assign(sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 1, far: 420 });
  sun.shadow.bias = -0.0005;
  scene.add(sun); scene.add(sun.target);
  const sunFollow = (x, z) => {
    sun.position.set(x + 90, 160, z + 60);
    sun.target.position.set(x, 0, z);
  };
  sunFollow(0, 0);

  // ---- ground ----
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(half * 2 + 60, 2, half * 2 + 60),
    new THREE.MeshStandardMaterial({ color: 0x585a44, roughness: 1 })
  );
  ground.position.y = -1; ground.receiveShadow = true; scene.add(ground);
  const gBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(half + 30, 1, half + 30).setFriction(1.0)
    .setCollisionGroups(group(PHYS.worldGroup, 0xffff)), gBody);

  // ---- roads (merged ribbon + dashed centre lines) ----
  const roadPos = [], markPos = [];
  for (const r of MAP.roads) {
    const pts = r.p, hwid = r.w / 2;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = pts[i], [x2, z2] = pts[i + 1];
      let dx = x2 - x1, dz = z2 - z1; const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
      const px = -dz * hwid, pz = dx * hwid; // perpendicular
      // quad (two triangles) for the ribbon
      pushQuad(roadPos, x1 + px, z1 + pz, x1 - px, z1 - pz, x2 - px, z2 - pz, x2 + px, z2 + pz, 0.02);
      // dashed centre line for wider roads
      if (r.w >= 6 && !r.o) {
        for (let d = 0; d < len - 2; d += 6) {
          const a = d / len, b = Math.min(1, (d + 3) / len);
          const mw = 0.28;
          pushQuad(markPos,
            x1 + dx * len * a - dz * mw, z1 + dz * len * a + dx * mw,
            x1 + dx * len * a + dz * mw, z1 + dz * len * a - dx * mw,
            x1 + dx * len * b + dz * mw, z1 + dz * len * b - dx * mw,
            x1 + dx * len * b - dz * mw, z1 + dz * len * b + dx * mw, 0.04);
        }
      }
    }
  }
  addTriMesh(scene, roadPos, new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: 0.92 }), true);
  addTriMesh(scene, markPos, new THREE.MeshBasicMaterial({ color: 0xd9c56b }), false);

  // ---- buildings (extruded footprints + convex-hull colliders) ----
  const bmat = [0x59617a, 0x6b5a6e, 0x4e6f6a, 0x7a6450, 0x566079].map(c =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.86, metalness: 0.04 }));
  const buildingBoxes = [];
  const geoms = [];
  MAP.buildings.forEach((b, bi) => {
    const poly = b.poly;
    // AABB for helpers (isClear, camera, spawn)
    let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
    for (const [x, z] of poly) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); minz = Math.min(minz, z); maxz = Math.max(maxz, z); }
    buildingBoxes.push({ x: (minx + maxx) / 2, z: (minz + maxz) / 2, w: maxx - minx, d: maxz - minz });

    const shape = new THREE.Shape();
    poly.forEach((p, i) => i ? shape.lineTo(p[0], -p[1]) : shape.moveTo(p[0], -p[1]));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: b.h, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    geo.clearGroups();
    geoms.push({ geo, mat: bi % bmat.length });

    // convex-hull collider (bottom+top ring); fall back to AABB box
    const hp = [];
    for (const [x, z] of poly) { hp.push(x, 0, z, x, b.h, z); }
    let made = false;
    try {
      const desc = RAPIER.ColliderDesc.convexHull(new Float32Array(hp));
      if (desc) {
        world.createCollider(desc.setCollisionGroups(group(PHYS.worldGroup, 0xffff)),
          world.createRigidBody(RAPIER.RigidBodyDesc.fixed()));
        made = true;
      }
    } catch (e) { /* degenerate footprint */ }
    if (!made) {
      const bx = (minx + maxx) / 2, bz = (minz + maxz) / 2;
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(bx, b.h / 2, bz));
      world.createCollider(RAPIER.ColliderDesc.cuboid((maxx - minx) / 2, b.h / 2, (maxz - minz) / 2)
        .setCollisionGroups(group(PHYS.worldGroup, 0xffff)), body);
    }
  });
  // merge buildings by material into a few meshes
  for (let m = 0; m < bmat.length; m++) {
    const g = geoms.filter(x => x.mat === m).map(x => x.geo);
    if (g.length) {
      const merged = mergeGeoms(g);
      const mesh = new THREE.Mesh(merged, bmat[m]);
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
      scene.add(mesh);
    }
  }

  // ---- perimeter walls ----
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x10161e, roughness: 1 });
  for (const [wx, wz, ww, wd] of [[0, half, half * 2, 3], [0, -half, half * 2, 3], [half, 0, 3, half * 2], [-half, 0, 3, half * 2]]) {
    const wm = new THREE.Mesh(new THREE.BoxGeometry(ww, 10, wd), wallMat); wm.position.set(wx, 5, wz); scene.add(wm);
    const wb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(wx, 5, wz));
    world.createCollider(RAPIER.ColliderDesc.cuboid(ww / 2, 5, wd / 2).setCollisionGroups(group(PHYS.worldGroup, 0xffff)), wb);
  }

  // ---- navigation graph ----
  const nodes = MAP.nodes.map(([x, z], i) => ({ x, z, neighbors: MAP.neighbors[i], index: i }));
  const graph = {
    nodes,
    lanePos(a, b, offset = 1.7) {
      let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      // right of travel = (dz, -dx)
      return { x: b.x + dz * offset, z: b.z - dx * offset };
    },
    nearest(x, z) {
      let bi = 0, bd = Infinity;
      for (let i = 0; i < nodes.length; i++) { const d = (nodes[i].x - x) ** 2 + (nodes[i].z - z) ** 2; if (d < bd) { bd = d; bi = i; } }
      return bi;
    },
  };

  function isClear(x, z, r = 2.5) {
    for (const b of buildingBoxes) if (Math.abs(x - b.x) < b.w / 2 + r && Math.abs(z - b.z) < b.d / 2 + r) return false;
    return true;
  }

  // player spawn: the road node nearest Punawale centre (origin)
  const sn = nodes[graph.nearest(0, 0)];
  const spawn = { x: sn.x, z: sn.z };

  return { graph, buildingBoxes, isClear, spawn, half, sidewalkY: 0, roads: MAP.roads, meta: MAP.meta, sunFollow };
}

// ---------- helpers ----------
function pushQuad(arr, ax, az, bx, bz, cx, cz, dx, dz, y) {
  arr.push(ax, y, az, bx, y, bz, cx, y, cz, ax, y, az, cx, y, cz, dx, y, dz);
}
function addTriMesh(scene, posArr, mat, receive) {
  if (!posArr.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArr), 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, mat);
  if (receive) mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);
}
// Merge geometries using position+normal only (recomputes normals).
function mergeGeoms(geoms) {
  let vc = 0;
  for (const g of geoms) vc += g.attributes.position.count;
  const pos = new Float32Array(vc * 3);
  let o = 0;
  for (const g of geoms) {
    const p = g.attributes.position;
    const idx = g.index ? g.index.array : null;
    if (idx) { for (let k = 0; k < idx.length; k++) { const v = idx[k]; pos[o++] = p.getX(v); pos[o++] = p.getY(v); pos[o++] = p.getZ(v); } }
    else { for (let k = 0; k < p.count; k++) { pos[o++] = p.getX(k); pos[o++] = p.getY(k); pos[o++] = p.getZ(k); } }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, o), 3));
  out.computeVertexNormals();
  return out;
}
