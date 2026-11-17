// Verificación aislada: solo fs/vm/assert. Sin navegador, red ni procesos secundarios.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),nodes=new Map(),all=[];
const noop=()=>{};const context=new Proxy({measureText:s=>({width:String(s).length*7})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.style={};this.dataset={};this.attrs={};this.hidden=false;this.textContent='';this.className='';this.parentNode=null;this._html='';this.parts=new Map();const names=new Set();this.classList={add:(...a)=>a.forEach(x=>names.add(x)),remove:(...a)=>a.forEach(x=>names.delete(x)),contains:x=>names.has(x),toggle:(x,v)=>{v=v===undefined?!names.has(x):v;v?names.add(x):names.delete(x);return v;}};all.push(this);}
 set innerHTML(v){this._html=v;this.children=[];for(const [,id]of v.matchAll(/id="([^"]+)"/g)){const e=new Element();e.id=id;nodes.set('#'+id,e);}}
 get innerHTML(){return this._html;}
 append(...a){for(const x of a){this.children.push(x);if(typeof x==='object')x.parentNode=this;}}
 replaceChildren(...a){this.children=[];this.append(...a);}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k]??null;}
 querySelector(s){if(!this.parts.has(s))this.parts.set(s,new Element());return this.parts.get(s);}
 addEventListener(){} setPointerCapture(){} remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);}
 getBoundingClientRect(){return {x:0,y:0,left:0,top:0,width:960,height:this.id==='game'?672:772};}
 get offsetHeight(){return 110;}
 getContext(){return context;} toDataURL(){return 'data:image/png;base64,';}
}
function $(s){if(!nodes.has(s)){const e=new Element();e.id=s.startsWith('#')?s.slice(1):'';nodes.set(s,e);}return nodes.get(s);}
const document={querySelector:$,querySelectorAll:s=>s.startsWith('.')?all.filter(n=>n.className.split(' ').includes(s.slice(1))):[],createElement:t=>new Element(t),createElementNS:(ns,t)=>new Element(t),createTextNode:t=>({textContent:t}),addEventListener:noop,hidden:false};
const storage=new Map(),window={devicePixelRatio:1,addEventListener:noop};const sandbox={window,document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:noop,performance:{now:()=>0},console,Math,JSON,Set,Map};vm.createContext(sandbox);
for(const f of ['dialogos.js','niveles.js','correos.js','inicio.js','transiciones.js'])vm.runInContext(fs.readFileSync(path.join(root,'juego',f),'utf8'),sandbox,{filename:f});Object.assign(sandbox,window);
let source=fs.readFileSync(path.join(root,'juego/app.js'),'utf8');const injection=`window.__test={loadLevel,openMail,openMission,openRoboChat,render,renderRescue,renderCorporateMail,renderMission,renderRoboChat,renderCredit,actMoving,dropCarriedBox,actionPress,say,move,mazeRoute,freshMovingModel,movingCount,
 set(s){if(s.t!==undefined)t=s.t;if(s.player)player=s.player;if(s.m)m=s.m;if(s.hit!==undefined)hit=s.hit;if(s.held!==undefined)actionHeld=s.held;actCooldown=0;},
 state(){return {level,t,mode,pendingLevel,mailIndex,chatTime,rescueTime,transitionLeft,m,player,score,supplies,finished};},
 tick(seconds){for(let left=seconds;left>1e-9;){const dt=Math.min(.02,left);left-=dt;if(mode==='play')update(dt);else if(mode==='chat')updateChat(dt);else if(mode==='rescue')updateRescue(dt);else if(mode==='mail')updateMail(dt);else if(mode==='mission')storyClock+=dt;}}
};`;
source=source.replace(/\}\)\(\);\s*$/,injection+'})();');vm.runInContext(source,sandbox,{filename:'app.js'});const h=window.__test,s=()=>h.state(),clean=x=>JSON.parse(JSON.stringify(x));
// Un componente para los cuatro correos, sin instrucciones ni narración externa.
for(let i=0;i<4;i++){h.openMail(i);assert($('#overlay').innerHTML.includes('class="outlook-window"'));assert(!$('#overlay').innerHTML.includes('class="mail-mission"'));assert(!$('#overlay').innerHTML.includes('class="mail-birthday"'));assert(!$('#overlay').innerHTML.includes('<blockquote>'));assert($('#context-next').onclick);}
assert.equal(window.CORREOS[2].from,'ADMINISTRACIÓN');assert.equal(window.CORREOS[2].subject,'Alerta de recaudación');assert(window.CORREOS[2].body.includes('Mohamed se ha llevado todo el dinero'));assert(window.CORREOS[3].bold.includes('Robo Pago'));assert(window.CORREOS[3].body.includes('no tienes 1000'));
h.openMail(0);$('#context-next').onclick();assert.equal(s().mode,'mission');assert.equal(s().pendingLevel,0);assert.equal($('#mission-start').textContent,''); // Botón real generado con el texto en la plantilla.
assert($('#overlay').innerHTML.includes('Comenzar misión'));assert($('#overlay').innerHTML.includes('class="mission-cake"'));$('#mission-start').onclick();assert.equal(s().level,0);
// Crédito crece después de llenar la barra; documentos y tres ciclos intactos.
h.tick(4);h.renderCredit();const first=s().m.creditAmount;assert.equal($('#debt-meter').getAttribute('aria-valuenow'),'100');h.tick(3);h.renderCredit();assert(s().m.creditAmount>first);assert.equal($('#debt-meter').querySelector('i').style.width,'100%');
for(let cycle=0;cycle<3;cycle++){const d=cycle*12;for(const [x,y]of [[310+d,270+d],[405-d,225-d],[470+d,320-d]]){h.set({player:{x,y}});h.tick(.04);}assert.equal(s().m.step,1);for(const [x,y]of [[165,220],[650,235],[420,420]]){h.set({player:{x,y}});h.actionPress();h.tick(.36);}assert.equal(s().m.cycles,cycle+1);}
assert.equal(s().m.speechLog.filter(x=>x.key.startsWith('cycle-')).length,9);h.tick(70);assert.equal(s().mode,'mail');assert.equal(s().mailIndex,1);$('#context-next').onclick();assert.equal(s().mailIndex,2);$('#context-next').onclick();assert.equal(s().pendingLevel,1);$('#mission-start').onclick();
// Marian se une y todas las frases de Mohamed van al actor Mohamed.
h.set({t:30,player:{x:100,y:360}});s().m.x=6000;h.tick(.04);assert(s().m.marianJoined);assert(s().m.speechLog.some(x=>x.who==='Marian'));h.say('Mohamed','¡Ahora vuelvo! Tengo una reunión…',true);assert(s().m.speechQueue.some(x=>x.actor==='mohamed')||s().m.speeches.some(x=>x.actor==='mohamed'));h.set({t:10,player:{x:400,y:410}});s().m.x=425;h.tick(.04);assert(s().m.caught);h.tick(30);assert.equal(s().mode,'mail');assert.equal(s().mailIndex,3);$('#context-next').onclick();$('#mission-start').onclick();
// Nueve cajas, seis traslados automáticos reales y ninguna entrega manual inventada.
assert.equal(s().m.cargo.length,9);h.render();const start=clean(s().m.movers);h.tick(1);assert(s().m.movers.every((n,i)=>n.x!==start[i].x||n.y!==start[i].y));h.tick(12);assert.equal(s().m.cargo.filter(x=>x.owner!=='Indira'&&x.state==='delivered').length,6);assert.equal(s().m.boxes,0);assert.equal(s().transitionLeft,null);
// Choque sobre carrito: pierde solo la caja transportada y la deja recuperable.
s().m.carrying=true;s().m.carriedId=6;s().m.cargo[6].state='carried';h.set({t:5,player:{x:325,y:440},hit:0});h.tick(.02);assert.equal(s().m.carriedId,null);assert.equal(s().m.cargo[6].state,'waiting');assert.equal(s().m.dropped,1);assert.equal(s().m.cargo.filter(x=>x.state==='delivered').length,6);assert.equal(s().m.cargo[6].x,s().m.cargo[6].homeX);
for(let id=6;id<9;id++){const b=s().m.cargo[id];h.set({player:{x:b.homeX,y:b.homeY},hit:0});h.actionPress();assert.equal(s().m.carriedId,id);h.set({player:{x:665,y:350}});h.actionPress();h.tick(.04);assert.equal(s().m.boxes,id-5);}
assert.equal(h.movingCount(),9);h.tick(3);assert.equal(s().mode,'chat');h.tick(6);assert.equal($('#chat-messages').children.length,3);h.tick(20);assert.equal(s().mode,'chat');assert.equal($('#chat-messages').children.length,3);$('#chat-next').onclick();assert.equal(s().pendingLevel,3);assert(window.MISIONES[3].steps.join(' ').includes('Julito'));$('#mission-start').onclick();
// Laberinto, focas y puerta real, usando los desplazamientos y colisiones del motor.
for(let attempt=0;attempt<100&&!s().m.escaped;attempt++){const goal=s().m.cards.length===2?{x:688,y:184}:s().m.cards.includes(0)?{x:640,y:472}:{x:304,y:184},route=h.mazeRoute(s().player,goal),caught=s().m.catches;assert(route.length);for(const next of route){for(let step=0;step<70;step++){if(s().m.escaped||s().m.catches!==caught)break;const dx=next.x-s().player.x,dy=next.y-s().player.y;if(Math.hypot(dx,dy)<1.2)break;if(Math.abs(dx)>1)h.move(Math.sign(dx),0,Math.min(.02,Math.abs(dx)/220));else if(Math.abs(dy)>1)h.move(0,Math.sign(dy),Math.min(.02,Math.abs(dy)/220));h.tick(.02);}if(s().m.escaped||s().m.catches!==caught)break;}}
assert(s().m.escaped,'No se llegó a la salida: '+JSON.stringify({t:s().t,player:s().player,cards:s().m.cards,catches:s().m.catches}));h.tick(3);assert.equal(s().mode,'rescue');h.tick(6);h.renderRescue();assert.equal(window.arcadeSnapshot().rescueBoarded,3);h.tick(7);assert.equal(s().mode,'mission');assert.equal(s().pendingLevel,4);assert.equal(window.MISIONES[4].title,'Dulce Combinación');$('#mission-start').onclick();assert($('#arena').classList.contains('sweet-scene'));h.render();h.set({player:{x:430,y:355},held:true});h.tick(2.5);h.set({held:false});assert.equal(s().m.phase,1);for(let i=0;i<3;i++){h.actionPress();h.tick(.36);}assert.equal(s().m.phase,2);h.actionPress();h.tick(3);assert(s().finished);assert($('#overlay').innerHTML.includes('gallery'));assert($('#overlay').innerHTML.includes('Feliz cumpleaños'));
console.log('OK SIN RED: contextos y misiones separados; cuatro correos; tres ciclos; crédito continuo; Marian y Mohamed; nueve cajas; seis traslados NPC; pérdida y recuperación de una sola caja; chat persistente; Pac-Focas con colisiones; rescate; Dulce Combinación; tarta y final.');
