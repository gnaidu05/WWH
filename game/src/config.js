// Shared world constants. Every system (world, AI, minimap, missions) reads these
// so geometry stays consistent across modules.
export const CITY = {
  blocks: 6,          // 6x6 grid of blocks
  block: 46,          // block interior size (units)
  road: 12,           // road width (units)
  get span() { return this.blocks * (this.block + this.road) + this.road; },
  // world spans from -span/2 .. +span/2 on both X and Z, road centered on grid lines
};

// Returns X/Z world coordinate of the CENTER of road line index i (0..blocks).
export function roadCenter(i) {
  const cell = CITY.block + CITY.road;
  return -CITY.span / 2 + CITY.road / 2 + i * cell;
}

// All intersection node centers (grid of roadCenter x roadCenter).
export function intersectionCenters() {
  const pts = [];
  for (let i = 0; i <= CITY.blocks; i++) {
    for (let j = 0; j <= CITY.blocks; j++) {
      pts.push({ i, j, x: roadCenter(i), z: roadCenter(j) });
    }
  }
  return pts;
}

export const PHYS = {
  gravity: -22,
  playerGroup: 0x0001,
  vehicleGroup: 0x0002,
  worldGroup: 0x0004,
  npcGroup: 0x0008,
};
