import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage']});
const p = await b.newPage({ viewport:{width:1280,height:720} });
const errs=[]; p.on('pageerror',e=>{if(!/Pointer/.test(e.message))errs.push(e.message)});
p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:4173/',{waitUntil:'load'});
await p.waitForFunction(()=>window.__ready===true||window.__bootError,null,{timeout:30000});
const boot=await p.evaluate(()=>window.__bootError||null);
if(boot) errs.push('BOOT:'+boot);
await p.waitForTimeout(1200);
const info=await p.evaluate(()=>{const g=window.__game;return {
  map:g.worldData.meta && g.worldData.meta.name, half:g.worldData.half,
  graphNodes:g.worldData.graph.nodes.length, roads:(g.worldData.roads||[]).length,
  buildings:g.worldData.buildingBoxes.length, peds:g.peds.peds.length, traffic:g.traffic.cars.length,
  spawn:[+g.worldData.spawn.x.toFixed(0), +g.worldData.spawn.z.toFixed(0)],
  m1:[+g.missions.pts.m1start.x.toFixed(0),+g.missions.pts.m1start.z.toFixed(0)],
  cpuMs:+(window.__cpuMs||0).toFixed(2)};});
console.log('info:', JSON.stringify(info));
// enter dart and drive forward on the real road for 3s, measure it moves and stays near roads
await p.evaluate(()=>{const g=window.__game;const v=g.vehicles[0];g.player.teleport(v.position.x+2,v.position.z,2);});
await p.waitForTimeout(300);
await p.evaluate(async()=>{window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyF'}));await new Promise(r=>setTimeout(r,80));window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyF'}));});
await p.waitForTimeout(300);
const z0=await p.evaluate(()=>({x:window.__game.state.vehicle.position.x,z:window.__game.state.vehicle.position.z}));
await p.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'})));
await p.waitForTimeout(3000);
await p.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'})));
const z1=await p.evaluate(()=>{const v=window.__game.state.vehicle;const g=window.__game.worldData.graph;
  const n=g.nodes[g.nearest(v.position.x,v.position.z)];
  return {x:v.position.x,z:v.position.z,kmh:+v.speedKmh.toFixed(1),distToRoad:+Math.hypot(n.x-v.position.x,n.z-v.position.z).toFixed(1)};});
console.log('drive:', JSON.stringify({moved:+Math.hypot(z1.x-z0.x,z1.z-z0.z).toFixed(1), kmh:z1.kmh, distToNearestRoadNode:z1.distToRoad}));
await p.screenshot({ path:'verify/shots/osm.png' });
console.log('errors:', errs.length, errs.slice(0,4));
await b.close();
