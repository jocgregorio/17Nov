const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),file=path.join(root,'juego/app.js');let code=fs.readFileSync(file,'utf8');
function replace(a,b){if(!code.includes(a))throw Error('No se encontró: '+a.slice(0,100));code=code.replace(a,b);}
function fn(name,next,body){const a=code.indexOf(`function ${name}(`),b=code.indexOf(`function ${next}(`,a);if(a<0||b<0)throw Error(name+' no encontrado');code=code.slice(0,a)+body+'\n'+code.slice(b);}
replace("Mariam:['#ffffff','#463c34']", "Mariam:['#ffffff','#463c34'],Marian:['#ffffff','#463c34'],Operaciones:['#204bd9','#3c4540'],Recaudación:['#ec1437','#3c4540']");
replace("lastMailSave=0,rescueTime=0;", "lastMailSave=0,rescueTime=0,introTime=0;");
replace('mode,mailIndex,mailElapsed,rescueTime}', 'mode,mailIndex,mailElapsed,rescueTime,introTime}');
replace('function say(who,text,important=false){', "function say(who,text,important=false){if(level===0&&mode==='play')return;");
replace("mode='play';$('#arena').classList.remove('celebrating');level=i;", "mode='play';$('#arena').classList.remove('celebrating');$('#arena').classList.toggle('office-bubbles',i===0);level=i;");
replace('updateMission();progress();resize();save();}', 'updateMission();progress();if(i===0)prepareOfficeSpeech();resize();save();}');
replace("loadLevel(0);openMail(0);}", "loadLevel(0);beginPreamble();}");
replace("if(restored.mode==='mail'){", "if(restored.mode==='preamble')beginPreamble(restored.introTime||0);else if(restored.mode==='mail'){");
replace("}else if(mode==='mail'){renderMail();$('#overlay').hidden=false;}", "}else if(mode==='preamble'){renderPreamble();$('#overlay').hidden=false;}else if(mode==='mail'){renderMail();$('#overlay').hidden=false;}");
replace('function renderMail(){const mail=', "function renderMail(){if(mailIndex===0){renderInitialMail();return;}const mail=");
replace("renderMail();save();}\nfunction renderMail()", "$('#arena').classList.remove('office-bubbles');resize();renderMail();save();}\nfunction renderMail()");
replace("jose.y+=(f.y+18-jose.y)*Math.min(1,dt*5);", "jose.y+=(f.y+18-jose.y)*Math.min(1,dt*5);\n if(level===1)updateMarian(dt);if(level===0||level===1)updateWorldSpeech(dt);");
replace("for(const [when,who,line] of ARCADE_TEXT.levels[level])", "if(level!==0)for(const [when,who,line] of ARCADE_TEXT.levels[level])");
replace("}else{transitionLeft-=dt;if(transitionLeft<=0)", "}else{if(level===0&&worldSpeechPending())transitionLeft=Math.max(.3,transitionLeft);transitionLeft-=dt;if(transitionLeft<=0)");
replace('function assist(){if(level===3)', "function assist(){if(level===0)return;if(level===3)");
fn('deliverOffice','freshSeals',`function deliverOffice(){if(m.step<1||m.cycles>=3)return;const index=m.step-1,station=officeStations[index];if(dist(player,station)<80){const who=['Marian','Operaciones','Recaudación'][index],actor=['sales','operations','cash'][index];worldSpeech(actor,who,INICIO.office[m.cycles][index],\`cycle-\${m.cycles+1}-\${index}\`);points(10);burst(station.x,station.y,'#ffe600');m.step++;if(m.step>3){m.cycles++;m.debt=m.cycles;m.docs=[];m.step=0;taskDone(\`Ciclo \${m.cycles}/3 completado\`);if(m.cycles===3)finishLevel();}}}`);
fn('drawOfficeCycles','drawCar',`function drawOfficeCycles(){[55,290,560].forEach(windowAt);officeStations.forEach((s,i)=>{desk(s.x,s.y-15,s.name,['#ffffff','#f7c1cc','#e7eeff'][i]);if(m.step===i+1)brightOfficeDestination(s.x,s.y+12);});person(165,135,'Marian');person(650,155,'Operaciones');person(420,345,'Recaudación');if(m.step===0&&m.cycles<3)cycleDocs().forEach((p,i)=>{if(!m.docs.includes(i)){circle(p.x,p.y,23+Math.sin(t*4)*2,'#ffc1cd');paper(p.x,p.y);text('Documentos de clientes',p.x,p.y+31,10,'#173baf');}});if(m.step>0){paper(player.x+23,player.y-32);text(\`\${Math.min(m.step,3)}/3 entregas\`,player.x,player.y-80,10,'#204bd9');}}`);
replace("guide();person(jose.x,jose.y,", "if(level===1)drawMarianChase();guide();person(jose.x,jose.y,");
const ext=fs.readFileSync(path.join(__dirname,'extension-inicio.js'),'utf8');replace('function frame(now){',ext+'\nfunction frame(now){');
replace("if(mode==='mail')updateMail(dt);", "if(mode==='preamble')updatePreamble(dt);else if(mode==='mail')updateMail(dt);");
replace("else render();requestAnimationFrame(frame);", "else render();renderWorldSpeech();requestAnimationFrame(frame);");
replace('mailElapsed,rescueTime,rescueBoarded:', 'mailElapsed,rescueTime,introTime,rescueBoarded:');
replace('m=freshModel(0);title();requestAnimationFrame(frame);', 'initializeOpeningUI();m=freshModel(0);title();requestAnimationFrame(frame);');
fs.writeFileSync(file,code);
// Solo se cambia el objeto del primer correo; los otros cuatro se conservan.
const mailFile=path.join(root,'juego/correos.js');let mail=fs.readFileSync(mailFile,'utf8');const a=mail.indexOf(' {from:'),b=mail.indexOf(' {from:',a+1);if(a<0||b<0)throw Error('Primer correo no encontrado');
const first={from:'Mohamed — Accionista',subject:'Nueva estrategia para hacer crecer la empresa.',body:'Indira, yo y mi socio Ebrain Pablo Ceboya Escobar tenemos nueva estrategia para hacer crecer a la empresa. Hemos solicitado un crédito a nuestro principal banco aliado para abrir una lotería Wiiiiiii ¿A poco no es tremenda idea? ah? ah?',note:'',mission:'Recoge los documentos de clientes y entrégalos en Ventas, Operaciones y Recaudación. Completa solo tres ciclos. Observa la deuda al cerrar cada uno.',birthday:'José y Marian preparan una sorpresa de cumpleaños para Indira. La tarta sigue siendo nuestra misión.',button:'Entrar en la oficina →',level:0};mail=mail.slice(0,a)+' '+JSON.stringify(first)+',\n'+mail.slice(b);fs.writeFileSync(mailFile,mail);
const htmlFile=path.join(root,'juego/index.html');let html=fs.readFileSync(htmlFile,'utf8');html=html.replace('<script src="app.js"></script>','<script src="inicio.js"></script><script src="app.js"></script>');fs.writeFileSync(htmlFile,html);
