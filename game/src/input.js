// Keyboard + pointer input. Frame-stable: edge events buffered, cleared each frame.
export class Input {
  constructor(domElement) {
    this.dom = domElement;
    this.keys = new Set();
    this.pressed = new Set();   // edge: went down this frame
    this.released = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.pointerLocked = false;
    this._downQueue = [];
    this._upQueue = [];

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const k = e.code;
      if (!this.keys.has(k)) this._downQueue.push(k);
      this.keys.add(k);
      // prevent page scroll on gameplay keys
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(k)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      const k = e.code;
      this.keys.delete(k);
      this._upQueue.push(k);
    });
    window.addEventListener('blur', () => { this.keys.clear(); });

    document.addEventListener('mousemove', (e) => {
      if (this.pointerLocked) { this.mouseDX += e.movementX; this.mouseDY += e.movementY; }
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = (document.pointerLockElement === this.dom);
    });
    this.dom.addEventListener('click', () => {
      if (!this.pointerLocked) this.dom.requestPointerLock?.();
    });
  }

  requestLock() { this.dom.requestPointerLock?.(); }

  down(code) { return this.keys.has(code); }
  justPressed(code) { return this.pressed.has(code); }
  justReleased(code) { return this.released.has(code); }

  // Called once per frame BEFORE systems read input.
  beginFrame() {
    this.pressed = new Set(this._downQueue);
    this.released = new Set(this._upQueue);
    this._downQueue.length = 0;
    this._upQueue.length = 0;
  }
  // Called once per frame AFTER systems read input, to reset mouse deltas.
  endFrame() {
    this.mouseDX = 0; this.mouseDY = 0;
  }

  // Semantic axes for movement (WASD / arrows).
  moveAxis() {
    let x = 0, y = 0;
    if (this.down('KeyW') || this.down('ArrowUp')) y += 1;
    if (this.down('KeyS') || this.down('ArrowDown')) y -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    return { x, y };
  }
}
