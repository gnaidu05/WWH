import RAPIER from '@dimforge/rapier3d-compat';
import { PHYS } from './config.js';

// Thin wrapper so the rest of the game imports one physics context.
export async function initPhysics() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: PHYS.gravity, z: 0 });
  world.integrationParameters.numSolverIterations = 6;
  return { RAPIER, world };
}

export { RAPIER };

// Interaction group helper: (membership << 16) | filter
export function group(membership, filter) {
  return ((membership & 0xffff) << 16) | (filter & 0xffff);
}
