const {chromium}=require('C:/Users/Jose G/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('path'),assert=require('assert');
(async()=>{
const browser=await chromium.launch({headless:true,channel:'chrome',env:{...process.env,TEMP:__dirname,TMP:__dirname}});
const page=await browser.newPage({viewport:{width:1280,height:950},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url='file:///'+path.resolve(__dirname,'../juego/index.html').replaceAll('\\','/');
await page.addInitScript(()=>{const s=sessionStorage.getItem('verification-seed');if(s){localStorage.setItem('indira-arcade-v3',s);sessionStorage.removeItem('verification-seed');}});
await page.goto(url);await page.clock.install();
const snap=()=>page.evaluate(()=>arcadeSnapshot());
const fresh=i=>[{phase:0,receipts:[],repair:0,client:{x:520,y:380},following:false},{furthest:100,caught:false,x:310,y:290,dash:0,dashCooldown:0},{carrying:false,boxes:0},{cards:[],escaped:false},{phase:0,coverage:0,toppings:0,lit:false}][i];
async function seed(level,t=0,m=fresh(level),player={x:380,y:360}){await page.evaluate(s=>sessionStorage.setItem('verification-seed',JSON.stringify(s)),{version:3,level,t,score:0,unlocked:level,m,player,jose:{x:340,y:390},supplies:[0,1,2,3].slice(0,level),storyClock:0,finished:false});await page.reload();await page.locator('#resume').click();await page.clock.runFor(50);}
async function press(key,time=100){await page.keyboard.down(key);await page.clock.runFor(time);await page.keyboard.up(key);}
async function walkTo(x,y){for(let i=0;i<12;i++){const s=await snap();if(s.transitionLeft!==null)return;const dx=x-s.player.x,dy=y-s.player.y;if(Math.abs(dx)<4&&Math.abs(dy)<4)return;if(Math.abs(dx)>=4)await press(dx>0?'ArrowRight':'ArrowLeft',Math.min(500,Math.abs(dx)/220*1000));if(Math.abs(dy)>=4)await press(dy>0?'ArrowDown':'ArrowUp',Math.min(500,Math.abs(dy)/220*1000));}throw Error(`No se pudo llegar a ${x},${y}: `+JSON.stringify(await snap()));}
// Tres encargos completos sin teletransporte.
await seed(0);for(const p of [[310,270],[405,225],[470,320]])await walkTo(...p);assert.equal((await snap()).m.phase,1);
await walkTo(640,235);await press('Space',1150);assert.equal((await snap()).m.phase,2);
await walkTo(520,380);assert((await snap()).m.following);await walkTo(250,300);await walkTo(165,220);assert.equal((await snap()).m.phase,3);assert.equal(await page.locator('#task-count').innerText(),'3/3');assert((await snap()).t<45);await page.clock.runFor(2400);assert.equal((await snap()).level,1);
console.log('OK encargos, progreso y transición temprana');
// Los mensajes nuevos esperan; pausa y guardado conservan el progreso.
await seed(0);await page.clock.runFor(600);const first=(await snap()).dialogue;assert(first.text.includes('cumpleaños'));assert(first.duration>=5&&first.duration<=7);
await walkTo(310,270);await walkTo(405,225);await walkTo(470,320);assert.equal((await snap()).dialogue.text,first.text);
await page.locator('#pause').click();const before=await snap();await page.clock.runFor(1500);assert.equal((await snap()).t,before.t);assert.equal((await snap()).storyClock,before.storyClock);await page.locator('#return').click();await page.reload();await page.locator('#resume').click();assert.equal((await snap()).m.phase,1);
await seed(1,5,{...fresh(1),x:425,y:218},{x:400,y:218});await press('Space');assert((await snap()).m.caught);await page.clock.runFor(9300);assert.equal((await snap()).level,2);
const routes=[[[130,300],[670,310]],[[270,420],[615,200]],[[155,190],[650,420]]];
for(let i=0;i<3;i++){await seed(2,5,{carrying:false,boxes:i},{x:routes[i][0][0],y:routes[i][0][1]});await press('Space');assert((await snap()).m.carrying);const b=routes[i][1];await seed(2,8,{carrying:true,boxes:i},{x:b[0],y:b[1]});await press('Space');assert.equal((await snap()).m.boxes,i+1);assert.equal(await page.locator('#task-count').innerText(),`${i+1}/3`);}
await page.clock.runFor(2400);assert.equal((await snap()).level,3);console.log('OK diálogos, pausa, persistencia, captura y tres cajas');
// Ruta física hasta ambas tarjetas y la puerta, con colisiones activas.
const grid=['111111111111111','100000100000001','101110101110101','100010000010101','111010111010101','100000100000001','101110101110101','100000000000001','111111111111111'];
function route(start,goal){const a=[Math.floor((start.x-40)/48),Math.floor((start.y-112)/48)],b=[Math.floor((goal[0]-40)/48),Math.floor((goal[1]-112)/48)],q=[a],parents=new Map([[a.join(),null]]);let end;for(let i=0;i<q.length;i++){const p=q[i];if(p[0]===b[0]&&p[1]===b[1]){end=p;break;}for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=[p[0]+dx,p[1]+dy],k=n.join();if(grid[n[1]]?.[n[0]]==='0'&&!parents.has(k)){parents.set(k,p);q.push(n);}}}assert(end,'No hay camino');const out=[];while(end){out.unshift([64+end[0]*48,136+end[1]*48]);end=parents.get(end.join());}return out;}
await seed(3,0,fresh(3),{x:112,y:184});for(const goal of [[304,184],[640,472]])for(const p of route((await snap()).player,goal))await walkTo(...p);
assert.equal((await snap()).m.cards.length,2);assert((await page.locator('#tip').innerText()).includes('PUERTA ABIERTA'));await page.screenshot({path:path.resolve(__dirname,'revision-salida-abierta.png'),fullPage:true});
for(const p of route((await snap()).player,[688,184])){if((await snap()).transitionLeft!==null)break;await walkTo(...p);}
assert((await snap()).m.escaped,'La puerta no activó el escape');assert((await snap()).t<55);await page.reload();await page.locator('#resume').click();await page.clock.runFor(2500);assert.equal((await snap()).level,4,'La salida no cambió de nivel');console.log('OK escape real por pasillos, puerta automática y reanudación');
// Cobertura mantenida, decoración por pulsaciones y velas en una acción.
await seed(4,3,fresh(4),{x:430,y:355});await press('Space',2500);assert.equal((await snap()).m.phase,1);assert.equal((await snap()).m.coverage,1);assert.equal((await snap()).m.toppings,0);
for(let i=0;i<3;i++){await press('Space',50);await page.clock.runFor(330);}assert.equal((await snap()).m.phase,2);assert.equal((await snap()).m.toppings,3);await page.screenshot({path:path.resolve(__dirname,'revision-tarta.png'),fullPage:true});
await press('Space',50);assert((await snap()).m.lit);await page.clock.runFor(2400);assert((await snap()).finished);assert(await page.locator('#gallery img').evaluateAll(xs=>xs.every(i=>i.complete&&i.naturalWidth>0)));await page.screenshot({path:path.resolve(__dirname,'revision-final.png'),fullPage:true});await page.reload();await page.locator('#remember').click();await page.clock.runFor(100);assert(await page.locator('#letter').count());
assert.equal(await page.evaluate(()=>ARCADE_LEVELS.reduce((s,l)=>s+l.duration,0)),275);for(let i=0;i<5;i++){await seed(i,[45,60,40,55,75][i]-.2);await page.clock.runFor(400);assert((await snap()).transitionLeft!==null);}console.log('OK tarta, fotos y límites de ayuda (275 segundos)');
// Eventos táctiles reales en la vista móvil.
await page.setViewportSize({width:390,height:844});await seed(0);await page.clock.runFor(800);assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
const r=await page.locator('#stick').boundingBox(),sx=r.x+r.width/2,sy=r.y+r.height/2,startX=(await snap()).player.x,cdp=await page.context().newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+35,y:sy}]});await page.clock.runFor(600);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert((await snap()).player.x>startX+50);await page.screenshot({path:path.resolve(__dirname,'revision-movil.png'),fullPage:true});
await seed(4,0,fresh(4),{x:430,y:355});const a=await page.locator('#action').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+30,y:a.y+30}]});await page.clock.runFor(2500);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await snap()).m.phase,1);assert.deepEqual(errors,[]);console.log('OK joystick y acción táctiles, sin errores de JavaScript');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
