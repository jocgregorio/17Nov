/* SPDX-License-Identifier: CC0-1.0
 * Música y efectos originales sintetizados localmente para Operación: Sobrevivimos de Milagro.
 * Sin grabaciones, samples, canciones ajenas, peticiones de red ni archivos de audio externos.
 */
(() => {
'use strict';
const STORE='indira-sonido-v1',button=document.querySelector('#sound-toggle');
const PROFILES={
 corporate:{bpm:108,root:48,style:'jazz',chords:[[0,4,7,11],[2,5,9,12],[7,11,14,17],[0,4,7,9]],melody:[12,-1,16,19,-1,21,19,-1,17,-1,14,17,-1,21,19,14,19,-1,23,21,-1,19,17,-1,16,-1,19,16,-1,14,12,-1]},
 chase:{bpm:152,root:50,style:'cartoon',chords:[[0,3,7],[5,8,12],[7,10,14],[0,3,7]],melody:[19,15,-1,12,15,-1,19,22,20,17,-1,15,17,-1,20,24,22,19,-1,17,14,17,19,-1,15,12,-1,15,19,15,12,-1]},
 moving:{bpm:138,root:48,style:'pizzicato',chords:[[0,4,7],[5,9,12],[7,11,14],[0,4,7]],melody:[12,-1,19,16,14,-1,16,19,17,-1,24,21,19,-1,17,21,19,-1,23,26,23,19,14,-1,16,-1,19,16,14,12,-1,-1]},
 arcade:{bpm:150,root:50,style:'arcade',chords:[[0,3,7],[5,8,12],[3,7,10],[7,10,14]],melody:[12,19,15,-1,12,15,19,-1,17,24,20,-1,17,20,24,-1,15,22,19,-1,15,19,22,-1,14,21,17,-1,14,17,21,19]},
 rescue:{bpm:118,root:48,style:'hero',chords:[[0,4,7],[5,9,12],[7,11,14],[0,4,7]],melody:[12,-1,19,-1,24,23,21,-1,21,-1,17,21,24,-1,21,-1,19,-1,23,-1,26,24,23,-1,24,-1,19,-1,16,-1,12,-1],once:true},
 bakery:{bpm:104,root:53,style:'festive',chords:[[0,4,7,9],[5,9,12],[2,5,9],[7,11,14]],melody:[12,-1,16,19,-1,21,19,-1,17,-1,21,24,-1,21,17,-1,14,-1,17,21,-1,17,14,-1,19,-1,23,21,19,16,12,-1]},
 memories:{bpm:70,root:48,style:'piano',chords:[[0,4,7,11],[9,12,16],[5,9,12,16],[7,11,14,17]],melody:[19,-1,-1,16,-1,-1,12,-1,21,-1,-1,19,-1,16,-1,-1,17,-1,-1,21,-1,-1,19,-1,14,-1,17,-1,16,-1,12,-1]}
};
let ctx=null,master=null,music=null,effects=null,delay=null,feedback=null,noiseBuffer=null;
let enabled=true,unlocked=false,unavailable=false,paused=false,hidden=false,ducked=false,scene='corporate',current=null,fading=[],timer=null,previous=null;
let nextStep=0,step=0,totalNotes=0,liveOscillators=0,fadeCount=0,lastDebt=-100,lastFoot=-100,lastClap=-100,lastMotor=-100;
const effectCounts=Object.create(null),effectLast=Object.create(null);
try{enabled=localStorage.getItem(STORE)!=='off';}catch{}
function label(){if(!button)return;button.textContent=unavailable?'♪ ×':enabled?'♫':'🔇';button.setAttribute('aria-label',unavailable?'Audio no disponible. Puedes seguir jugando.':enabled?'Silenciar todo el sonido':'Activar todo el sonido');button.setAttribute('aria-pressed',String(enabled&&!unavailable));button.title=unavailable?'El juego sigue funcionando sin audio':enabled?'Sonido activado · silenciar':'Sonido silenciado · activar';button.disabled=unavailable;}
function ramp(param,value,seconds=.12){const now=ctx.currentTime;param.cancelScheduledValues(now);param.setValueAtTime(param.value,now);param.linearRampToValueAtTime(value,now+seconds);}
function silence(){try{if(master)ramp(master.gain,0,.08);}catch{}}
function fail(){unavailable=true;silence();if(timer!==null){clearInterval(timer);timer=null;}label();}
function create(){const Constructor=window.AudioContext||window.webkitAudioContext;if(!Constructor){unavailable=true;label();return false;}try{ctx=new Constructor({latencyHint:'interactive'});}catch{try{ctx=new Constructor();}catch{fail();return false;}}
 try{master=ctx.createGain();master.gain.value=enabled?.34:0;music=ctx.createGain();music.gain.value=ducked?.30:.78;effects=ctx.createGain();effects.gain.value=.7;const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-16;compressor.knee.value=14;compressor.ratio.value=3;compressor.attack.value=.006;compressor.release.value=.2;music.connect(master);effects.connect(master);master.connect(compressor);compressor.connect(ctx.destination);
 delay=ctx.createDelay(.8);delay.delayTime.value=.19;feedback=ctx.createGain();feedback.gain.value=.13;const wet=ctx.createGain();wet.gain.value=.15;delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(music);
 noiseBuffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.32),ctx.sampleRate);const data=noiseBuffer.getChannelData(0);let seed=58117;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=(seed/2147483648-1)*.55;}
 timer=setInterval(schedule,25);return true;}catch{fail();return false;}}
function start(){if(unavailable)return Promise.resolve(false);try{if(!ctx&&!create())return Promise.resolve(false);unlocked=true;const result=ctx.resume();if(!current)changeScene(scene);return Promise.resolve(result).then(()=>{if(master)ramp(master.gain,enabled&&!paused&&!hidden?.34:0,.12);schedule();return true;}).catch(()=>false);}catch{fail();return Promise.resolve(false);}}
function toggle(){enabled=!enabled;try{localStorage.setItem(STORE,enabled?'on':'off');}catch{}label();if(enabled)start();else silence();return enabled;}
function note(midi,when,length,volume,kind='piano',bus=current?.bus){if(!ctx||!bus||liveOscillators>58)return;const hz=440*Math.pow(2,(midi-69)/12);const gain=ctx.createGain(),filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=kind==='arcade'?1550:kind==='brass'?1800:kind==='bass'?600:2800;gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),when+(kind==='brass'?.035:.009));gain.gain.exponentialRampToValueAtTime(.0001,when+length);filter.connect(gain);gain.connect(bus);if(kind==='piano'||kind==='bell')gain.connect(delay);
 const partials=kind==='piano'?[[1,1,'triangle'],[2,.16,'sine']]:kind==='bell'?[[1,1,'sine'],[2,.2,'sine']]:[[1,1,kind==='arcade'?'square':kind==='brass'?'sawtooth':'triangle']];let left=partials.length;
 for(const [multiple,level,type]of partials){const osc=ctx.createOscillator(),part=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(hz*multiple,when);part.gain.value=level;osc.connect(part);part.connect(filter);liveOscillators++;osc.onended=()=>{liveOscillators=Math.max(0,liveOscillators-1);try{osc.disconnect();part.disconnect();if(--left===0){filter.disconnect();gain.disconnect();}}catch{}};osc.start(when);osc.stop(when+length+.02);}totalNotes++;}
function noise(when,length,volume,frequency=1400){if(!ctx||!noiseBuffer)return;const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.65;gain.gain.setValueAtTime(Math.max(.0001,volume),when);gain.gain.exponentialRampToValueAtTime(.0001,when+length);src.connect(filter);filter.connect(gain);gain.connect(effects);src.onended=()=>{try{src.disconnect();filter.disconnect();gain.disconnect();}catch{}};src.start(when);src.stop(when+length);}
function changeScene(key){scene=key in PROFILES?key:'corporate';if(!ctx)return;if(current?.key===scene)return;const now=ctx.currentTime;fading=fading.filter(track=>{if(track.retire>now)return true;try{track.bus.disconnect();}catch{}return false;});while(fading.length>3){try{fading.shift().bus.disconnect();}catch{}}if(current){ramp(current.bus.gain,0,.7);current.retire=now+1.05;fading.push(current);}const bus=ctx.createGain();bus.gain.value=0;bus.connect(music);bus.gain.linearRampToValueAtTime(1,now+.7);current={key:scene,bus,retire:Infinity};nextStep=now+.035;step=0;fadeCount++;}
function playStep(profile,n,at){const beat=60/profile.bpm,bar=Math.floor(n/8)%4,pos=n%8,chord=profile.chords[bar],root=profile.root;
 if(profile.once&&n>=32)return;
 if(profile.style==='piano'){if(pos===0||pos===4){note(root+(pos===0?chord[0]-12:chord[2]-12),at,2.2,.09,'piano');for(let i=0;i<3;i++)note(root+chord[i],at+i*.035,2.1,.035,'piano');}}
 else{if(pos%2===0)note(root-12+chord[(pos/2)%Math.min(3,chord.length)],at,beat*.65,.085,'bass');if(pos===1||pos===5)for(let i=0;i<3;i++)note(root+chord[i],at+i*.012,profile.style==='hero'?beat:beat*.58,.027,profile.style==='hero'?'brass':'piano');if(profile.style==='jazz'){if(pos===2||pos===6)noise(at,.045,.012,2200);}else if(profile.style!=='hero'){if(pos%2)noise(at,.025,.009,profile.style==='arcade'?1100:1700);}}
 const melody=profile.melody[n%profile.melody.length];if(melody>=0){const instrument=profile.style==='hero'?'brass':profile.style==='arcade'?'arcade':profile.style==='cartoon'||profile.style==='festive'?'bell':'piano';note(root+melody,at,profile.style==='piano'?1.65:beat*.6,profile.style==='piano'?.048:profile.style==='arcade'?.021:.043,instrument);}}
function schedule(){if(!ctx||ctx.state!=='running'||!unlocked||!enabled||paused||hidden||unavailable)return;try{if(!current)changeScene(scene);const now=ctx.currentTime;fading=fading.filter(track=>{if(track.retire>now)return true;track.bus.disconnect();return false;});if(nextStep<now-.3)nextStep=now+.025;const profile=PROFILES[scene];let guard=0;while(nextStep<now+.14&&guard++<10){playStep(profile,step,nextStep);const swing=profile.style==='jazz'?(step%2?.84:1.16):1;nextStep+=60/profile.bpm/2*swing;step++;}}catch{fail();}}
function sfx(name,force=false){if(!ctx||!unlocked||!enabled||paused||hidden||unavailable||ctx.state!=='running')return;try{const now=ctx.currentTime;if(!force&&now-(effectLast[name]??-100)<.12)return;effectLast[name]=now;effectCounts[name]=(effectCounts[name]||0)+1;const tone=(m,d=.15,v=.08,offset=0,kind='bell')=>note(m,now+offset,d,v,kind,effects);
 switch(name){
 case 'mail':tone(76,.25,.08);tone(81,.45,.06,.12);break;
 case 'paper':noise(now,.075,.06,2400);tone(84,.07,.025);break;
 case 'sale':tone(76,.19,.05);tone(81,.2,.04,.065);tone(88,.3,.025,.12);break;
 case 'deliver':tone(67,.15,.065);tone(74,.32,.055,.09);break;
 case 'debt':tone(55,.08,.025,0,'piano');tone(58,.09,.02,.045,'piano');break;
 case 'step':noise(now,.045,.018,400);break;
 case 'box-pick':tone(46,.12,.07,0,'bass');noise(now,.045,.035,700);break;
 case 'box-deliver':tone(48,.13,.055,0,'bass');tone(72,.21,.035,.09);break;
 case 'box-drop':tone(36,.2,.12,0,'bass');noise(now,.11,.08,500);break;
 case 'bump':tone(43,.16,.075,0,'bass');noise(now,.1,.045,650);break;
 case 'clap':noise(now,.05,.055,1200);noise(now+.09,.045,.04,1500);break;
 case 'id':tone(79,.14,.055);tone(86,.3,.045,.07);break;
 case 'motor':{const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='sawtooth';osc.frequency.setValueAtTime(43,now);osc.frequency.linearRampToValueAtTime(94,now+1);filter.type='lowpass';filter.frequency.value=220;gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(.055,now+.18);gain.gain.exponentialRampToValueAtTime(.0001,now+1.8);osc.connect(filter);filter.connect(gain);gain.connect(effects);osc.onended=()=>{try{osc.disconnect();filter.disconnect();gain.disconnect();}catch{}};osc.start(now);osc.stop(now+1.85);break;}
 case 'candles':tone(84,.5,.045);tone(91,.65,.025,.13);break;
 case 'celebrate':[72,76,79,84].forEach((m,i)=>tone(m,.55,.045,i*.09));break;
 }}catch{fail();}}
function sceneFor(s){if(s.mode==='memories'||s.mode==='letter')return 'memories';if(s.mode==='rescue')return 'rescue';if(s.mode==='party')return 'bakery';if(s.mode==='chat')return 'arcade';if(s.mode==='mission')return ['corporate','chase','moving','arcade','bakery'][s.pendingLevel]||'corporate';if(s.mode!=='play')return 'corporate';return ['corporate','chase','moving','arcade','bakery'][s.level]||'corporate';}
function setPaused(value){if(paused===value)return;paused=value;if(!ctx)return;try{ramp(master.gain,enabled&&!paused&&!hidden?.34:0,.08);if(!value)start();}catch{fail();}}
function sync(s){try{const desired=sceneFor(s);if(desired!==scene||!current){scene=desired;if(ctx)changeScene(desired);}setPaused(!!s.paused);const duck=s.mode==='mail'||s.mode==='mission'||s.mode==='chat'||s.dialogue;if(duck!==ducked){ducked=duck;if(music)ramp(music.gain,ducked?.27:.78,.24);}if(!ctx||!unlocked){previous=s;return;}const now=ctx.currentTime,p=previous;
 if(p&&(p.mode!==s.mode||p.mailIndex!==s.mailIndex)&&s.mode==='mail')sfx('mail');
 if(p&&s.mode==='play'&&p.mode==='play'&&s.level===p.level){
  if(s.level===0){if(s.docs>p.docs)sfx('paper');if(s.step===2&&p.step===1)sfx('sale');else if(s.step>p.step||s.cycles>p.cycles)sfx('deliver');if(s.credit>100000&&now-lastDebt>3.5){lastDebt=now;sfx('debt');}}
  if(s.level===1&&Math.hypot(s.x-p.x,s.y-p.y)>1&&now-lastFoot>.23){lastFoot=now;sfx('step');}
  if(s.hit>.8&&p.hit<=0)sfx('bump');
  if(s.level===2&&p.cargo&&s.cargo){s.cargo.forEach((state,i)=>{const old=p.cargo[i];if(old===state)return;if(state==='carried')sfx('box-pick');if(state==='delivered')sfx('box-deliver');if(old==='carried'&&state==='waiting')sfx('box-drop');});}
  if(s.level===3){if(s.ids>p.ids)sfx('id');if(s.nearSeal&&now-lastClap>1.6){lastClap=now;sfx('clap');}}
  if(s.lit&&!p.lit)sfx('candles');
 }
 if(s.mode==='rescue'&&(!p||p.mode!=='rescue'||s.rescueTime>7&&p.rescueTime<=7)&&now-lastMotor>1){lastMotor=now;sfx('motor');}if(s.mode==='party'&&p?.mode!=='party')sfx('celebrate');previous=s;}catch{fail();}}
if(button)button.addEventListener('click',()=>toggle());
document.addEventListener('click',e=>{const target=e.target?.closest?.('button');if(target&&['start','resume','remember','again','return'].includes(target.id))start();},true);
document.addEventListener('pointerdown',()=>{if(unlocked&&enabled&&ctx?.state==='suspended'&&!paused)start();},{passive:true});
document.addEventListener('visibilitychange',()=>{hidden=!!document.hidden;if(!ctx)return;try{if(hidden){silence();Promise.resolve(ctx.suspend()).catch(()=>{});}else if(enabled&&!paused)start();}catch{}});
window.addEventListener('pagehide',()=>{hidden=true;silence();if(ctx)try{Promise.resolve(ctx.suspend()).catch(()=>{});}catch{}});
window.GameAudio=Object.freeze({start,toggle,sync,sfx,pause:setPaused,state:()=>({enabled,unlocked,unavailable,paused,ducked,scene,tracks:current?1+fading.length:0,fadeCount,totalNotes,liveOscillators,effects:{...effectCounts},contextState:ctx?.state||'not-created'})});label();
})();
