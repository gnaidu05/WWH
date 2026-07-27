// DOM + canvas HUD: minimap, health bar, wanted stars, cash, speedometer,
// mission objective panel, toasts, and interaction prompt.
export class HUD {
  constructor(worldData) {
    this.wd = worldData;
    const root = document.getElementById('hud');
    root.innerHTML = `
      <div id="minimap-wrap"><canvas id="minimap" width="190" height="190"></canvas></div>
      <div class="hud-tr">
        <div id="wanted-wrap"><span class="stars" id="stars"></span></div>
        <div id="cash">$0</div>
      </div>
      <div class="hud-bl" style="left: 220px; bottom: 16px;">
        <div class="label">Health</div>
        <div class="bar" id="hpbar"><i style="width:100%"></i></div>
      </div>
      <div class="hud-br">
        <div id="speedo">0<small>km/h</small></div>
        <div id="gearline"></div>
      </div>
      <div class="hud-tl"><div id="objective" class="hidden">
        <div class="obj-title">Objective</div><div class="obj-body"></div></div></div>
      <div id="mtimer" class="hidden"><span class="mt-label">TIME</span><span class="mt-val">0:00</span></div>
      <div id="toast"></div>
      <div id="prompt"></div>
      <div id="controls"></div>
      <div id="attrib">Punawale, Pune · Map data © OpenStreetMap contributors (ODbL)</div>
      <div class="pausewrap hidden" id="pausewrap"><div class="pausecard">
        <h2>PAUSED</h2><p>Press P or Esc to resume · progress autosaves</p></div></div>
    `;
    this.mm = document.getElementById('minimap');
    this.ctx2d = this.mm.getContext('2d');
    this.starsEl = document.getElementById('stars');
    this.cashEl = document.getElementById('cash');
    this.hpbar = document.getElementById('hpbar');
    this.speedo = document.getElementById('speedo');
    this.gearline = document.getElementById('gearline');
    this.objective = document.getElementById('objective');
    this.objBody = this.objective.querySelector('.obj-body');
    this.objTitle = this.objective.querySelector('.obj-title');
    this.toastEl = document.getElementById('toast');
    this.promptEl = document.getElementById('prompt');
    this.pauseEl = document.getElementById('pausewrap');
    this.controlsEl = document.getElementById('controls');
    this.mtimer = document.getElementById('mtimer');
    this.mtimerVal = this.mtimer.querySelector('.mt-val');
    this._toastT = 0;
    this._lastLevel = -1;
    this._lastMode = null;
  }

  toast(title, sub = '', ms = 1400) {
    this.toastEl.innerHTML = `${title}${sub ? `<span class="sub">${sub}</span>` : ''}`;
    this.toastEl.classList.add('show');
    this._toastT = performance.now() + ms;
  }
  setObjective(title, body) {
    if (!body) { this.objective.classList.add('hidden'); return; }
    this.objective.classList.remove('hidden');
    this.objTitle.textContent = title || 'Objective';
    this.objBody.textContent = body;
  }
  setPrompt(text) {
    if (!text) { this.promptEl.classList.remove('show'); return; }
    this.promptEl.innerHTML = text;
    this.promptEl.classList.add('show');
  }
  setPaused(on) { this.pauseEl.classList.toggle('hidden', !on); }

  update(ctx, fps) {
    const st = ctx.state;
    // stars
    if (ctx.wanted.level !== this._lastLevel) {
      let s = '';
      for (let i = 0; i < 5; i++) s += `<span class="${i < ctx.wanted.level ? 'star-on' : 'star-off'}">★</span>`;
      this.starsEl.innerHTML = s;
      this._lastLevel = ctx.wanted.level;
    }
    // cash + hp
    this.cashEl.textContent = '$' + st.cash.toLocaleString();
    const hp = Math.max(0, Math.round(st.health));
    this.hpbar.firstElementChild.style.width = hp + '%';
    this.hpbar.classList.toggle('low', hp <= 30);
    // speed
    if (st.mode === 'drive') {
      const kmh = Math.round(Math.abs(st.vehicle.speedKmh));
      this.speedo.innerHTML = `${kmh}<small>km/h</small>`;
      this.gearline.textContent = st.vehicle.type.name + (Math.abs(fps) ? `  ·  ${Math.round(fps)} fps` : '');
    } else {
      this.speedo.innerHTML = `${Math.round(ctx.player.speed2d * 3.6)}<small>km/h</small>`;
      this.gearline.textContent = `On foot  ·  ${Math.round(fps)} fps`;
    }
    // prompt for enter/exit
    if (st.mode === 'foot' && ctx.findNearestVehicle()) this.setPrompt('<b>F</b> — Get in vehicle');
    else if (st.mode === 'drive') this.setPrompt('<b>F</b> — Get out');
    else this.setPrompt('');

    // mode-aware on-screen controls
    if (st.mode !== this._lastMode) {
      this._lastMode = st.mode;
      this.controlsEl.innerHTML = st.mode === 'drive'
        ? `<span class="ck">Driving</span> <b>W</b> accelerate · <b>S</b> brake / reverse · <b>A</b>/<b>D</b> steer · <b>Space</b> handbrake · <b>F</b> exit car`
        : `<span class="ck">On foot</span> <b>W A S D</b> move · <b>Shift</b> run · <b>Space</b> jump · <b>F</b> get in vehicle · <b>Mouse</b> look`;
    }

    // prominent mission timer
    const tleft = ctx.missions.activeTimer();
    if (tleft == null) { this.mtimer.classList.add('hidden'); }
    else {
      this.mtimer.classList.remove('hidden');
      const m = Math.floor(tleft / 60), s = Math.floor(tleft % 60);
      this.mtimerVal.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      this.mtimer.classList.toggle('low', tleft <= 15);
    }

    // toast timeout
    if (this._toastT && performance.now() > this._toastT) { this.toastEl.classList.remove('show'); this._toastT = 0; }

    this.drawMinimap(ctx);
  }

  drawMinimap(ctx) {
    const c = this.ctx2d, W = 190, H = 190;
    const viewM = 360;            // metres of map shown across the minimap
    const scale = W / viewM;
    const pp = ctx.state.mode === 'drive' ? ctx.state.vehicle.position : ctx.player.position;
    const toMap = (x, z) => ({ mx: W / 2 + (x - pp.x) * scale, my: H / 2 + (z - pp.z) * scale });

    c.clearRect(0, 0, W, H);
    c.fillStyle = '#0a1424'; c.fillRect(0, 0, W, H);

    // real road network from the OSM data (only segments near the player)
    const roads = ctx.worldData.roads || [];
    c.strokeStyle = '#33507a'; c.lineJoin = 'round'; c.lineCap = 'round';
    const R = viewM * 0.65;
    for (const r of roads) {
      const pts = r.p;
      c.lineWidth = Math.max(1, r.w * scale * 0.8);
      let drawing = false;
      c.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const [x, z] = pts[i];
        if (Math.abs(x - pp.x) > R || Math.abs(z - pp.z) > R) { drawing = false; continue; }
        const m = toMap(x, z);
        if (!drawing) { c.moveTo(m.mx, m.my); drawing = true; } else c.lineTo(m.mx, m.my);
      }
      c.stroke();
    }

    // mission markers
    for (const m of ctx.missions.markers()) {
      const { mx, my } = toMap(m.x, m.z);
      c.fillStyle = m.color || '#ffd166';
      c.beginPath(); c.arc(mx, my, 4, 0, Math.PI * 2); c.fill();
    }
    // police blips
    c.fillStyle = '#5b8bff';
    for (const p of ctx.wanted.police) {
      const { mx, my } = toMap(p.pos.x, p.pos.z);
      c.beginPath(); c.arc(mx, my, 3, 0, Math.PI * 2); c.fill();
    }
    // player arrow
    const heading = ctx.state.mode === 'drive' ? ctx.state.vehicle.heading : ctx.player.heading;
    c.save();
    c.translate(W / 2, H / 2);
    c.rotate(-heading);
    c.fillStyle = '#7bffb0';
    c.beginPath(); c.moveTo(0, -6); c.lineTo(4, 5); c.lineTo(-4, 5); c.closePath(); c.fill();
    c.restore();

    // frame ring
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2;
    c.strokeRect(1, 1, W - 2, H - 2);
  }
}
