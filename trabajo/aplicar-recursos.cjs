const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),app=path.join(root,'juego/app.js');
const previous=fs.readFileSync(path.join(__dirname,'arcade-antes-revision/app.js'),'utf8');
const helpers=previous.slice(previous.indexOf('function rect('),previous.indexOf('function render(){'));
fs.writeFileSync(app,fs.readFileSync(app,'utf8').replace('/* DRAW_HELPERS */',helpers));
const html=path.join(root,'juego/index.html');
fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace('SEIS MINUTOS PARA SOBREVIVIR','OPERACIÓN: LA TARTA DE INDIRA').replace('<div id="score">0 ★</div></div>','<div id="score">0 ★</div><div id="task-meter" role="progressbar" aria-label="Progreso del nivel" aria-valuemin="0" aria-valuemax="3" aria-valuenow="0"><span id="task-label"></span><strong id="task-count">0/3</strong><div class="track"><div id="task-fill"></div></div></div></div><div id="mission" hidden></div>'));
