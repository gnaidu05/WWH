import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage']});
const page = await browser.newPage();
await page.goto('http://localhost:4173/', {waitUntil:'load'});
await page.waitForFunction(()=>window.__ready===true);
await page.waitForTimeout(600);
const kd=c=>page.evaluate(x=>window.dispatchEvent(new KeyboardEvent('keydown',{code:x})),c);
const ku=c=>page.evaluate(x=>window.dispatchEvent(new KeyboardEvent('keyup',{code:x})),c);
async function run(idx,label){
  await page.evaluate(i=>{const g=window.__game;const v=g.vehicles[i];g.player.teleport(v.position.x+1.6,v.position.z,2);},idx);
  await page.waitForTimeout(150);
  await page.evaluate(async()=>{window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyF'}));await new Promise(r=>setTimeout(r,80));window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyF'}));});
  await page.waitForTimeout(150);
  // settle at proper ride height on clear road, no drop
  const upright=async()=>page.evaluate(()=>{const g=window.__game;const v=g.state.vehicle;const q=v.body.rotation();
    // world up dot local up
    const uy=1-2*(q.x*q.x+q.z*q.z); return +uy.toFixed(3);});
  await page.evaluate(()=>{const g=window.__game;const v=g.state.vehicle;
    const xs=[...new Set(g.worldData.graph.nodes.map(n=>+n.x.toFixed(2)))].sort((a,b)=>Math.abs(a)-Math.abs(b));
    const rideY=-v.type.wheelY+v.type.suspRest+v.type.wheelRadius;
    v.body.setTranslation({x:xs[0]+2,y:rideY,z:-g.worldData.half+20},true);
    v.body.setRotation({x:0,y:0,z:0,w:1},true);v.body.setLinvel({x:0,y:0,z:0},true);v.body.setAngvel({x:0,y:0,z:0},true);
    for(const c of g.traffic.cars){ if(Math.abs(c.pos.x-(xs[0]+2))<10) c.pos.x+=60; }});
  await page.waitForTimeout(500);
  // straight-line top speed over 12s wall (slow-mo headless)
  await kd('KeyW'); let peak=0; let minUp=1;
  const t0=Date.now(); while(Date.now()-t0<12000){await page.waitForTimeout(200);
    const k=await page.evaluate(()=>Math.abs(window.__game.state.vehicle.speedKmh)); if(k>peak)peak=k;
    const u=await upright(); if(u<minUp)minUp=u;}
  await ku('KeyW');
  // reset then sustained cornering: full throttle + steer for 8s, track total heading revolutions & upright
  await page.evaluate(()=>{const g=window.__game;const v=g.state.vehicle;const xs=[...new Set(g.worldData.graph.nodes.map(n=>+n.x.toFixed(2)))].sort((a,b)=>Math.abs(a)-Math.abs(b));
    const rideY=-v.type.wheelY+v.type.suspRest+v.type.wheelRadius;
    v.body.setTranslation({x:0,y:rideY,z:0},true);v.body.setRotation({x:0,y:0,z:0,w:1},true);v.body.setLinvel({x:0,y:0,z:0},true);v.body.setAngvel({x:0,y:0,z:0},true);});
  await page.waitForTimeout(400);
  await kd('KeyW'); await kd('KeyD');
  let totalTurn=0,lastH=await page.evaluate(()=>window.__game.state.vehicle.heading),cornerUp=1;
  const t1=Date.now(); while(Date.now()-t1<6000){await page.waitForTimeout(150);
    const h=await page.evaluate(()=>window.__game.state.vehicle.heading);
    let dh=h-lastH; while(dh>Math.PI)dh-=2*Math.PI; while(dh<-Math.PI)dh+=2*Math.PI; totalTurn+=dh; lastH=h;
    const u=await upright(); if(u<cornerUp)cornerUp=u;}
  await ku('KeyW'); await ku('KeyD');
  console.log(label, JSON.stringify({peakKmh:+peak.toFixed(1), minUprightStraight:minUp, cornerYawRateDegPerS:+(totalTurn*180/Math.PI/6).toFixed(1), minUprightCorner:cornerUp}));
  await page.evaluate(async()=>{window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyF'}));await new Promise(r=>setTimeout(r,80));window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyF'}));});
  await page.waitForTimeout(200);
}
await run(0,'DART  ');
await run(1,'HAULER');
await browser.close();
