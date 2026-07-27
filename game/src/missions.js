import * as THREE from 'three';

// Two scripted missions with start triggers (walk/drive into the beam),
// objectives, timers, and completion states. Progress is checkpoint-saved.
export class MissionSystem {
  constructor(scene, worldData) {
    this.scene = scene; this.wd = worldData;
    this.beams = new Map();  // id -> mesh
    this.state = {
      m1: 'available',  // available | active | done
      m2: 'locked',     // locked | available | active | done
      timer: 0,
    };
    // Anchor mission points to real road nodes spread across the Punawale map.
    const g = worldData.graph;
    const h = worldData.half;
    const node = (ox, oz) => { const n = g.nodes[g.nearest(ox, oz)]; return { x: n.x, z: n.z }; };
    this.pts = {
      m1start: node(worldData.spawn.x + 12, worldData.spawn.z + 8),
      m1drop: node(h * 0.55, -h * 0.55),
      m2start: node(-h * 0.5, h * 0.35),
      safehouse: node(-h * 0.45, -h * 0.45),
    };
  }

  init(ctx) {
    this.ctx = ctx;
    // restore saved mission state if any (ctx.save already loaded into state)
    if (ctx.state._missions) Object.assign(this.state, ctx.state._missions);
    this.refreshBeams();
    this.applyObjective();
  }

  serialize() { return { ...this.state }; }
  restore(d) { if (d) Object.assign(this.state, d); }

  // Seconds left on the active timed objective, or null if none is running.
  activeTimer() { return this.state.m1 === 'active' ? Math.max(0, this.state.timer) : null; }

  refreshBeams() {
    // desired active beams by state
    const want = [];
    if (this.state.m1 === 'available') want.push(['m1', this.pts.m1start, 0x5de1ff]);
    if (this.state.m1 === 'active') want.push(['m1drop', this.pts.m1drop, 0x7bffb0]);
    if (this.state.m2 === 'available') want.push(['m2', this.pts.m2start, 0xff9a3b]);
    if (this.state.m2 === 'active') want.push(['safe', this.pts.safehouse, 0x7bffb0]);
    // remove stale
    for (const [id, mesh] of this.beams) {
      if (!want.find(w => w[0] === id)) { this.scene.remove(mesh); this.beams.delete(id); }
    }
    for (const [id, p, color] of want) {
      if (!this.beams.has(id)) { const m = buildBeam(color); m.position.set(p.x, 0, p.z); this.scene.add(m); this.beams.set(id, m); }
    }
  }

  markers() {
    const out = [];
    for (const [id, mesh] of this.beams) {
      out.push({ x: mesh.position.x, z: mesh.position.z, color: '#' + mesh.userData.color.toString(16).padStart(6, '0') });
    }
    return out;
  }

  applyObjective() {
    const s = this.state;
    if (s.m1 === 'available') this.ctx.hud.setObjective('Courier Run', 'Cyan marker downtown — step into it to start the job.');
    else if (s.m1 === 'active') this.ctx.hud.setObjective('Courier Run', `Deliver the parcel to the docks. Time: ${Math.ceil(s.timer)}s`);
    else if (s.m2 === 'available') this.ctx.hud.setObjective("Heat's On", 'Orange marker to the west — step in to start.');
    else if (s.m2 === 'active') this.ctx.hud.setObjective("Heat's On", `Reach 3 stars, shake the cops, then reach the safehouse.`);
    else this.ctx.hud.setObjective(null, null);
  }

  playerPos(ctx) { return ctx.state.mode === 'drive' ? ctx.state.vehicle.position : ctx.player.position; }
  near(pp, pt, r = 3.2) { return Math.hypot(pp.x - pt.x, pp.z - pt.z) < r; }

  update(dt, ctx) {
    const pp = this.playerPos(ctx);
    const s = this.state;

    // ---- Mission 1: Courier Run ----
    if (s.m1 === 'available' && this.near(pp, this.pts.m1start)) {
      s.m1 = 'active'; s.timer = 75;
      ctx.hud.toast('COURIER RUN', 'Deliver to the docks before time runs out');
      this.refreshBeams(); this.applyObjective();
    } else if (s.m1 === 'active') {
      s.timer -= dt;
      // live-update timer text roughly once per second
      if (Math.ceil(s.timer) !== this._lastT) { this._lastT = Math.ceil(s.timer); this.applyObjective(); }
      if (s.timer <= 0) {
        s.m1 = 'available'; // failed -> retry available
        ctx.hud.toast('MISSION FAILED', 'Out of time — try again');
        this.refreshBeams(); this.applyObjective();
      } else if (this.near(pp, this.pts.m1drop, 3.6)) {
        s.m1 = 'done';
        if (s.m2 === 'locked') s.m2 = 'available';
        ctx.addCash(2500);
        ctx.hud.toast('DELIVERED', '+$2,500 · Checkpoint saved');
        this.refreshBeams(); this.applyObjective();
        ctx.save.save(ctx);
      }
    }

    // ---- Mission 2: Heat's On ----
    if (s.m2 === 'available' && this.near(pp, this.pts.m2start)) {
      s.m2 = 'active';
      ctx.wanted.addHeat(45); // kick heat up so pursuit begins
      s.m2phase = 'raise';
      ctx.hud.toast("HEAT'S ON", 'Get to 3 stars, then lose them');
      this.refreshBeams(); this.applyObjective();
    } else if (s.m2 === 'active') {
      if (s.m2phase === 'raise') {
        if (ctx.wanted.level >= 3) {
          s.m2phase = 'evade';
          ctx.hud.setObjective("Heat's On", 'Now shake the cops and reach the safehouse (green).');
        } else {
          ctx.hud.setObjective("Heat's On", `Raise your heat to 3 stars (now ${ctx.wanted.level}). Run over cones… or people.`);
        }
      } else if (s.m2phase === 'evade') {
        if (this.near(pp, this.pts.safehouse, 3.6) && ctx.wanted.level <= 1) {
          s.m2 = 'done';
          ctx.addCash(4000);
          ctx.hud.toast('MISSION COMPLETE', '+$4,000 · Checkpoint saved');
          this.refreshBeams(); this.applyObjective();
          ctx.save.save(ctx);
        } else if (this.near(pp, this.pts.safehouse, 3.6)) {
          ctx.hud.setObjective("Heat's On", 'Too hot! Lose more cops before entering the safehouse.');
        }
      }
    }
  }

  render(t) {
    for (const [id, mesh] of this.beams) {
      mesh.rotation.y = t * 1.2;
      mesh.userData.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
      mesh.userData.beam.material.opacity = 0.25 + Math.sin(t * 4) * 0.08;
    }
  }
}

function buildBeam(color) {
  const g = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 14, 20, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.position.y = 7; g.add(beam);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.12, 8, 24),
    new THREE.MeshBasicMaterial({ color })
  );
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; g.add(ring);
  g.userData = { beam, ring, color };
  return g;
}
