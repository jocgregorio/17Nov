const fs=require('fs'),path=require('path'),vm=require('vm');const root=path.resolve(__dirname,'..'),file=path.join(root,'juego/app.js');let s=fs.readFileSync(file,'utf8');
function replace(a,b){if(!s.includes(a))throw Error('No encontrado: '+a.slice(0,95));s=s.replace(a,b);}
function fn(a,b,body){const start=s.indexOf('function '+a+'('),end=s.indexOf('function '+b+'(',start);if(start<0||end<0)throw Error(a);s=s.slice(0,start)+body+'\n'+s.slice(end);}
replace("const photos=[1,2,3].map(i=>`assets/recuerdos/recuerdo-0${i}.jpg`);", "const photos=RECUERDOS.map(p=>p.src);\nlet partyTime=0,photoIndex=0,photoSwiped=false,epilogueScreen='memories',worldZoom=1,viewShiftX=0;");
replace("Mohamed:['#a28eaa','#4a4140']", "Mohamed:['#a28eaa','#4a4140'],Julito:['#69cbbb','#433d36']");
replace('introTime,pendingLevel,chatTime}', 'introTime,pendingLevel,chatTime,partyTime,photoIndex,epilogueScreen}');
replace("$('#arena').classList.remove('celebrating');", "$('#arena').classList.remove('celebrating','epilogue','party-scene');$('#party-actions').hidden=true;");
fn('ending','setPause','function ending(){beginParty();}');
replace("if($('#remember'))$('#remember').onclick=()=>{score=restored.score||0;ending();};", "if($('#remember'))$('#remember').onclick=()=>{score=restored.score||0;photoIndex=restored.photoIndex||0;if(restored.epilogueScreen==='letter')showLetter();else showMemories();};");
replace("function drawBakery(){", "function drawBakery(includeFriend=true){");
replace("person(625,380,'Marian');drawCake();", "if(includeFriend)person(625,380,'Marian');drawCake();");
fn('drawCar','renderRescue','function drawCar(x,y,boarded){drawUrbanCar(x,y,boarded);}');
fn('resize','solids',`function resize(){const r=canvas.getBoundingClientRect();if(r.width<=0||r.height<=0)return;vw=r.width<650?460:800;vh=vw*r.height/r.width;const inset=vh<560?Math.min(70,vh*.23):0;worldZoom=Math.min(1,(vh-inset)/560);viewShiftX=Math.max(0,(vw-800*worldZoom)/2);offsetY=inset+(vh-inset-560*worldZoom)/2;dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr);}
window.addEventListener('resize',resize);resize();`);
fn('pointerWorld','resize',`function pointerWorld(e){const r=canvas.getBoundingClientRect();return {x:((e.clientX-r.left)/r.width*vw-viewShiftX)/worldZoom+camera,y:((e.clientY-r.top)/r.height*vh-offsetY)/worldZoom};}
canvas.onpointerdown=e=>{if(!running||paused||mode!=='play'||transitionLeft!==null)return;const p=pointerWorld(e);if(level===4&&dist(player,cake)<120&&dist(p,cake)<110){e.preventDefault();paintPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);actionHeld=true;actionPress();}else target=p;};for(const ev of ['onpointerup','onpointercancel','onlostpointercapture'])canvas[ev]=()=>{if(paintPointer!==null){paintPointer=null;actionHeld=false;}};`);
replace("camera=clamp(player.x-vw*.43,0,Math.max(0,worldWidth()-vw));ctx.save();ctx.translate(-camera,offsetY);", "camera=clamp(player.x-vw/worldZoom*.43,0,Math.max(0,worldWidth()-vw/worldZoom));ctx.save();const shift=worldWidth()>800?0:viewShiftX;ctx.translate(shift,offsetY);ctx.scale(worldZoom,worldZoom);ctx.translate(-camera,0);");
// El puntero y los bocadillos utilizan la misma transformación que el dibujo.
replace("x:((e.clientX-r.left)/r.width*vw-viewShiftX)/worldZoom+camera", "x:((e.clientX-r.left)/r.width*vw-(worldWidth()>800?0:viewShiftX))/worldZoom+camera");
replace("ax=(actor.x-camera)/vw*width,ay=(actor.y-72+offsetY)/vh*height", "ax=((actor.x-camera)*worldZoom+(worldWidth()>800?0:viewShiftX))/vw*width,ay=((actor.y-72)*worldZoom+offsetY)/vh*height");
replace("const cw=Math.min(width-24,width<650?280:315);", "const landscape=width>height*1.3&&height<500;const cw=landscape?Math.min(210,width*.29):Math.min(width-24,width<650?280:315);");
replace("const minY=Math.min(width<650?184:170,Math.max(110,height-300)),maxY=", "const minY=landscape?60:Math.min(width<650?184:170,Math.max(110,height-300)),maxY=");
replace("left=clamp(ax-cw/2,12,Math.max(12,width-cw-12));", "left=landscape?8:clamp(ax-cw/2,12,Math.max(12,width-cw-12));");
s=s.replaceAll('goal.x>camera+vw-35','goal.x>camera+vw/worldZoom-35').replaceAll('camera+vw-28','camera+vw/worldZoom-28').replaceAll('x>camera+vw+50','x>camera+vw/worldZoom+50').replaceAll('x>camera+vw)continue','x>camera+vw/worldZoom)continue');
const extension=fs.readFileSync(path.join(__dirname,'extension-desenlace.js'),'utf8');replace('function frame(now){',extension+'\nfunction frame(now){');
replace("if(mode==='preamble')updatePreamble(dt);", "if(mode==='party')updateParty(dt);else if(mode==='preamble')updatePreamble(dt);");
replace("if(mode==='rescue')renderRescue();else render();", "if(mode==='party')renderParty();else if(mode==='rescue')renderRescue();else if(mode!=='memories'&&mode!=='letter')render();");
replace('pendingLevel,chatTime,rescueBoarded:', 'pendingLevel,chatTime,partyTime,photoIndex,epilogueScreen,view:{vw,vh,worldZoom,viewShiftX,offsetY,camera},partyGuests:mode===\'party\'?[\'Indira\',\'José\',\'Marian\',\'Julito\']:[],rescueBoarded:');
replace('initializeOpeningUI();m=freshModel(0);', 'initializeOpeningUI();initializeEpilogue();m=freshModel(0);');
fs.writeFileSync(file,s);
const letterContext={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'juego/felicitacion.js'),'utf8'),letterContext);const dialogFile=path.join(root,'juego/dialogos.js'),dialogContext={window:{}};vm.runInNewContext(fs.readFileSync(dialogFile,'utf8'),dialogContext);dialogContext.window.ARCADE_TEXT.birthday=letterContext.window.FELICITACION;fs.writeFileSync(dialogFile,'// Diálogos y felicitación personal exacta.\nwindow.ARCADE_TEXT='+JSON.stringify(dialogContext.window.ARCADE_TEXT,null,2)+';\n');
const htmlFile=path.join(root,'juego/index.html');fs.writeFileSync(htmlFile,fs.readFileSync(htmlFile,'utf8').replace('<script src="app.js"></script>','<script src="felicitacion.js"></script><script src="app.js"></script>'));
