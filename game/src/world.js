import * as THREE from 'three';
import { CITY, roadCenter, PHYS } from './config.js';
import { group } from './physics.js';

// Small seeded RNG so the city (and thus minimap + spawns) is identical every load.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LANE_OFFSET = CITY.road * 0.24; // right-hand lane offset from road centerline

export function buildWorld(scene, RAPIER, world) {
  const rand = mulberry32(1337);
  const half = CITY.span / 2;

  // ---- Lighting & sky ----
  scene.background = new THREE.Color(0x0b1626);
  scene.fog = new THREE.Fog(0x0b1626, 90, 260);

  const hemi = new THREE.HemisphereLight(0x9fc4ff, 0x1a2030, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.15);
  sun.position.set(80, 130, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = half + 20;
  sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
  sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 400;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  // ---- Ground (asphalt) collider + mesh ----
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1d2333, roughness: 0.96 });
  const ground = new THREE.Mesh(new THREE.BoxGeometry(CITY.span + 40, 2, CITY.span + 40), groundMat);
  ground.position.y = -1;
  ground.receiveShadow = true;
  scene.add(ground);
  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0));
  world.createCollider(
    RAPIER.ColliderDesc.cuboid((CITY.span + 40) / 2, 1, (CITY.span + 40) / 2)
      .setFriction(1.0)
      .setCollisionGroups(group(PHYS.worldGroup, 0xffff)),
    groundBody
  );

  // ---- Perimeter walls so vehicles can't launch off the map edge ----
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0e1420, roughness: 1 });
  const wallH = 8, wallT = 2, ext = half + 2;
  const wallSpecs = [
    [0, ext, CITY.span + 8, wallT], [0, -ext, CITY.span + 8, wallT],
    [ext, 0, wallT, CITY.span + 8], [-ext, 0, wallT, CITY.span + 8],
  ];
  for (const [wx, wz, ww, wd] of wallSpecs) {
    const wm = new THREE.Mesh(new THREE.BoxGeometry(ww, wallH, wd), wallMat);
    wm.position.set(wx, wallH / 2, wz); scene.add(wm);
    const wb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(wx, wallH / 2, wz));
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(ww / 2, wallH / 2, wd / 2).setCollisionGroups(group(PHYS.worldGroup, 0xffff)),
      wb
    );
  }

  // ---- Road surface + lane markings (visual only; drive on the flat ground) ----
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x14161d, roughness: 0.9 });
  const markMat = new THREE.MeshBasicMaterial({ color: 0xf4d35e });
  const roadGeoms = [];
  const markGeoms = [];
  const cell = CITY.block + CITY.road;
  for (let i = 0; i <= CITY.blocks; i++) {
    const c = roadCenter(i);
    // vertical road (runs along Z)
    roadGeoms.push(planeXZ(c, 0, CITY.road, CITY.span, 0.02));
    // horizontal road (runs along X)
    roadGeoms.push(planeXZ(0, c, CITY.span, CITY.road, 0.02));
    // dashed centre line, vertical
    for (let z = -half + 3; z < half; z += 8) markGeoms.push(planeXZ(c, z + 1.5, 0.35, 3, 0.03));
    for (let x = -half + 3; x < half; x += 8) markGeoms.push(planeXZ(x + 1.5, c, 3, 0.35, 0.03));
  }
  addMerged(scene, roadGeoms, roadMat, true);
  addMerged(scene, markGeoms, markMat, false);

  // ---- Sidewalks (raised curb slabs over each block) ----
  const walkMat = new THREE.MeshStandardMaterial({ color: 0x39415a, roughness: 0.95 });
  const walkGeoms = [];
  const curbH = 0.16;
  const buildings = [];      // {x,z,w,d} footprints
  const buildingBoxes = [];  // for spawn-clearance checks
  const bmat = [
    new THREE.MeshStandardMaterial({ color: 0x3a4d74, roughness: 0.8, metalness: 0.05 }),
    new THREE.MeshStandardMaterial({ color: 0x5a4a6b, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x3e6070, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0x6b5340, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x445a52, roughness: 0.82 }),
  ];
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });

  for (let bi = 0; bi < CITY.blocks; bi++) {
    for (let bj = 0; bj < CITY.blocks; bj++) {
      const cx = -half + CITY.road + CITY.block / 2 + bi * cell;
      const cz = -half + CITY.road + CITY.block / 2 + bj * cell;
      // sidewalk slab fills the block footprint
      walkGeoms.push(boxAt(cx, curbH / 2, cz, CITY.block, curbH, CITY.block));

      // buildings: 1-3 boxes packed into the block interior with a walkable margin
      const margin = 3.2;
      const inner = CITY.block - margin * 2;
      const layout = rand() < 0.5 ? 1 : (rand() < 0.6 ? 2 : 4);
      const cells = layout === 1 ? [[0, 0, inner, inner]] :
        layout === 2 ? [[-inner / 4, 0, inner / 2 - 1, inner], [inner / 4, 0, inner / 2 - 1, inner]] :
          [[-inner / 4, -inner / 4, inner / 2 - 1.2, inner / 2 - 1.2],
           [inner / 4, -inner / 4, inner / 2 - 1.2, inner / 2 - 1.2],
           [-inner / 4, inner / 4, inner / 2 - 1.2, inner / 2 - 1.2],
           [inner / 4, inner / 4, inner / 2 - 1.2, inner / 2 - 1.2]];

      for (const [ox, oz, w, d] of cells) {
        const bx = cx + ox, bz = cz + oz;
        const h = 10 + Math.floor(rand() * 5) * 7; // 10..38
        const mat = bmat[Math.floor(rand() * bmat.length)];
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(bx, h / 2 + curbH, bz);
        mesh.castShadow = true; mesh.receiveShadow = true;
        scene.add(mesh);
        // window emissive strip decal on one face for city glow
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.82, h * 0.82), winMat.clone());
        glow.material.color.setHSL(0.10 + rand() * 0.08, 0.9, 0.5 + rand() * 0.15);
        glow.material.transparent = true; glow.material.opacity = 0.14 + rand() * 0.12;
        glow.position.set(bx, h / 2 + curbH, bz + d / 2 + 0.06);
        scene.add(glow);

        const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(bx, h / 2 + curbH, bz));
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2)
            .setCollisionGroups(group(PHYS.worldGroup, 0xffff)),
          body
        );
        buildings.push({ x: bx, z: bz, w, d });
        buildingBoxes.push({ x: bx, z: bz, w: w + 2, d: d + 2 });
      }
    }
  }
  addMerged(scene, walkGeoms, walkMat, true);

  // ---- Road graph (intersection nodes + 4-neighbour adjacency) ----
  const nodes = [];
  const idx = (i, j) => i * (CITY.blocks + 1) + j;
  for (let i = 0; i <= CITY.blocks; i++) {
    for (let j = 0; j <= CITY.blocks; j++) {
      nodes.push({ i, j, x: roadCenter(i), z: roadCenter(j), neighbors: [] });
    }
  }
  for (let i = 0; i <= CITY.blocks; i++) {
    for (let j = 0; j <= CITY.blocks; j++) {
      const n = nodes[idx(i, j)];
      if (i > 0) n.neighbors.push(idx(i - 1, j));
      if (i < CITY.blocks) n.neighbors.push(idx(i + 1, j));
      if (j > 0) n.neighbors.push(idx(i, j - 1));
      if (j < CITY.blocks) n.neighbors.push(idx(i, j + 1));
    }
  }
  const graph = {
    nodes, idx,
    node: (i, j) => nodes[idx(i, j)],
    // Right-hand lane target position when travelling from node a -> node b.
    lanePos(a, b, offset = LANE_OFFSET) {
      const dx = Math.sign(b.x - a.x), dz = Math.sign(b.z - a.z);
      // offset to the right of travel direction: right = rotate dir by -90deg
      // dir (dx,dz) -> right (dz, -dx)
      return { x: b.x + dz * offset, z: b.z - dx * offset };
    },
    // Index of the intersection node nearest a world position.
    nearest(x, z) {
      let bi = 0, bd = Infinity;
      for (let k = 0; k < nodes.length; k++) {
        const d = (nodes[k].x - x) ** 2 + (nodes[k].z - z) ** 2;
        if (d < bd) { bd = d; bi = k; }
      }
      return bi;
    },
  };

  // Spawn clearance helper
  function isClear(x, z, r = 2.5) {
    for (const b of buildingBoxes) {
      if (Math.abs(x - b.x) < b.w / 2 + r && Math.abs(z - b.z) < b.d / 2 + r) return false;
    }
    return true;
  }

  // Player spawn: on a road near the centre.
  const spawn = { x: roadCenter(Math.floor(CITY.blocks / 2)), z: roadCenter(Math.floor(CITY.blocks / 2)) - 6 };

  return { graph, buildings, buildingBoxes, isClear, spawn, half, sidewalkY: curbH };
}

// ---------- geometry helpers ----------
function planeXZ(cx, cz, w, d, y) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  g.translate(cx, y, cz);
  return g;
}
function boxAt(cx, cy, cz, w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(cx, cy, cz);
  return g;
}
function addMerged(scene, geoms, mat, shadow) {
  if (!geoms.length) return;
  const merged = mergeGeometries(geoms);
  const mesh = new THREE.Mesh(merged, mat);
  if (shadow) mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);
}
// Minimal geometry merge (position + normal + uv), avoids extra dependency.
function mergeGeometries(geoms) {
  let vc = 0, ic = 0;
  for (const g of geoms) { vc += g.attributes.position.count; ic += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(vc * 3);
  const nor = new Float32Array(vc * 3);
  const uv = new Float32Array(vc * 2);
  const index = new Uint32Array(ic);
  let vo = 0, io = 0, base = 0;
  for (const g of geoms) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    pos.set(p.array, vo * 3);
    if (n) nor.set(n.array, vo * 3); else nor.fill(0, vo * 3, vo * 3 + p.count * 3);
    if (u) uv.set(u.array, vo * 2);
    const gi = g.index ? g.index.array : null;
    if (gi) { for (let k = 0; k < gi.length; k++) index[io + k] = gi[k] + base; io += gi.length; }
    else { for (let k = 0; k < p.count; k++) index[io + k] = base + k; io += p.count; }
    vo += p.count; base += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(index, 1));
  out.computeVertexNormals();
  return out;
}
