# Nocturne City — vertical slice

An original open-world 3D action game in the "drive around a city and cause
trouble" genre, built as a browser-deployable vertical slice. All world content,
vehicle names, and branding are original — Vireo Dart (hatchback), Brunderk
Hauler (truck), the Nocturne City district, and its police force.

Rendering is [Three.js](https://threejs.org); physics (vehicles, character
controller, world collision) is [Rapier](https://rapier.rs) compiled to WASM.
The whole thing builds to static files and deploys to a single URL.

## Play

```bash
cd game
npm install
npm run dev      # http://localhost:5173
```

Click the canvas to capture the mouse for camera look.

### Controls

| Input | On foot | In a vehicle |
| --- | --- | --- |
| `W` `A` `S` `D` | Walk / strafe | Throttle, steer, brake/reverse |
| `Shift` | Run | — |
| `Space` | Jump | Handbrake (slides the car) |
| `F` | Enter nearest vehicle | Exit vehicle |
| Mouse | Look / orbit camera | Look around |
| `P` or `Esc` | Pause | Pause |

Walk or drive into a glowing marker beam to start a mission. Objectives show
top-left; the minimap, wanted stars, cash, health, and speedometer fill the rest
of the HUD. Progress autosaves every 20 seconds and at each mission checkpoint —
reload the page to resume.

## Build & deploy

```bash
cd game
npm run build           # outputs static files to game/dist/
npm run preview         # serve the build locally at http://localhost:4173
```

`game/dist/` is fully self-contained (the Rapier WASM is inlined) and can be
served from any static host — Netlify, Vercel, GitHub Pages, S3, etc. The Vite
config uses relative asset paths (`base: './'`), so it works from any subpath.

## What's in the slice

- **City district** — a 6×6 block grid with roads, dashed lane markings, raised
  sidewalks, and ~100 buildings, all with collision. A perimeter wall keeps you
  in bounds. `src/world.js` also builds the road graph the AI drives on.
- **On-foot player** — walk, run, and jump via a Rapier kinematic character
  controller with auto-step and ground snapping (`src/player.js`).
- **Two vehicles with distinct handling** (`src/vehicles.js`) — the *Vireo Dart*
  is a light, quick, sharp-steering hatchback; the *Brunderk Hauler* is a heavy,
  sluggish, understeering truck. Both use Rapier's raycast vehicle controller.
- **Traffic & pedestrians** — AI cars follow right-hand lanes on the road graph,
  yield at occupied intersections, and brake for obstacles (`src/traffic.js`);
  pedestrians walk sidewalk loops and flee from speeding cars (`src/peds.js`).
- **Wanted / heat system** (`src/wanted.js`) — offenses raise a 0–5 star level;
  police cruisers spawn to match, pursue along the road graph, and shoot at 3+
  stars. Break contact and the level decays; get caught on foot and you're busted.
- **Third-person camera** (`src/camera.js`) — orbits on foot, trails the car
  while driving, and pulls in to avoid clipping buildings.
- **HUD** (`src/hud.js`) — canvas minimap with blips, health bar, wanted stars,
  cash, speedometer, objective panel, and toasts.
- **Two missions** (`src/missions.js`) — *Courier Run* (timed delivery) and
  *Heat's On* (raise heat, then evade to the safehouse), each with a start
  trigger, live objectives, fail/complete states, and a cash reward.
- **Checkpoint save** (`src/save.js`) — player transform, current vehicle,
  health, cash, heat, and mission progress persist to `localStorage`.

## Verification

`verify/harness.mjs` boots the built game in headless Chromium and drives every
system end-to-end, asserting measured outcomes (movement distances, distinct
vehicle handling, wanted escalation, pursuit closing distance, mission
completion, save/resume). Run it against a running preview:

```bash
cd game && npm run build && (npm run preview &) && sleep 4
export PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome  # or your Chromium
node verify/harness.mjs http://localhost:4173/
```

### Performance note

The simulation (physics + all AI + HUD) costs about **2 ms per frame**, leaving
the rest of a 16.7 ms/60fps budget for rendering. The scene is deliberately
light: merged road geometry, boxy buildings, simple entity meshes, and a single
shadow-casting light. If the framerate drops on weaker hardware the game steps
quality down automatically (pixel ratio, then shadows). Note that the headless
verifier runs on a software renderer (SwiftShader) and its FPS number does **not**
represent real-GPU performance — the `cpuSimMsPerFrame` metric is the
GPU-independent signal.
