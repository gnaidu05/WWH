// Checkpoint save/resume via localStorage. Persists player transform, current
// vehicle, health, cash, wanted heat, and mission progress.
const KEY = 'nocturne_slice_save_v1';

export class SaveSystem {
  save(ctx) {
    try {
      const st = ctx.state;
      const onFoot = st.mode === 'foot';
      const p = onFoot ? ctx.player.position : st.vehicle.position;
      const data = {
        t: Date.now(),
        mode: st.mode,
        px: p.x, pz: p.z,
        vehIndex: onFoot ? -1 : ctx.vehicles.indexOf(st.vehicle),
        health: st.health,
        cash: st.cash,
        heat: ctx.wanted.heat,
        missions: ctx.missions.serialize(),
        vehicles: ctx.vehicles.map(v => {
          const tr = v.body.translation(); const r = v.body.rotation();
          return { x: tr.x, y: tr.y, z: tr.z, rx: r.x, ry: r.y, rz: r.z, rw: r.w };
        }),
      };
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) { console.warn('save failed', e); return false; }
  }

  hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
  clear() { try { localStorage.removeItem(KEY); } catch (e) {} }

  // Applies saved data onto the live context. Returns true if a save was loaded.
  load(ctx) {
    let data;
    try { const raw = localStorage.getItem(KEY); if (!raw) return false; data = JSON.parse(raw); }
    catch (e) { return false; }
    if (!data) return false;

    const st = ctx.state;
    st.health = data.health ?? 100;
    st.cash = data.cash ?? 0;
    ctx.state._missions = data.missions;
    if (data.heat) { ctx.wanted.heat = data.heat; ctx.wanted.recalcLevel(); }

    // restore parked vehicle transforms
    if (Array.isArray(data.vehicles)) {
      data.vehicles.forEach((vd, i) => {
        const v = ctx.vehicles[i]; if (!v) return;
        v.body.setTranslation({ x: vd.x, y: vd.y, z: vd.z }, true);
        v.body.setRotation({ x: vd.rx, y: vd.ry, z: vd.rz, w: vd.rw }, true);
        v.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        v.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      });
    }

    if (data.mode === 'drive' && data.vehIndex >= 0 && ctx.vehicles[data.vehIndex]) {
      ctx.enterVehicle(ctx.vehicles[data.vehIndex]);
    } else {
      ctx.player.teleport(data.px, data.pz, 2);
    }
    return true;
  }
}
