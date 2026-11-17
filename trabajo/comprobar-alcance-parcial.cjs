const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.resolve(__dirname,'..');
const current=fs.readFileSync(path.join(root,'juego/app.js'),'utf8'),before=fs.readFileSync(path.join(__dirname,'antes-revision-parcial/app.js'),'utf8');
function block(code,name,next){const a=code.indexOf('function '+name+'('),b=code.indexOf('function '+next+'(',a);assert(a>=0&&b>a);return code.slice(a,b);}
for(const [name,next]of [['freshSeals','updateSeals'],['updateSeals','updatePacFocas'],['updatePacFocas','drawSeal'],['drawSeal','drawPacFocas'],['drawCar','renderRescue'],['renderRescue','frame'],['beginRescue','updateRescue'],['updateRescue','advanceChapter'],['drawCake','render']]){
// El código nuevo de apertura se añadió antes de frame; la escena termina antes de él.
let a=block(current,name,next),b=block(before,name,next);if(name==='renderRescue')a=a.slice(0,a.indexOf('function initializeOpeningUI('));assert.equal(a.trim(),b.trim(),name+' fue alterado');}
console.log('OK: IA de focas, captura y salida, coche de Julito, rescate, traslado y dibujo de tarta conservados.');
fs.writeFileSync(path.join(__dirname,'verificar-arcade.cjs'),"// Pruebas vigentes de la revisión parcial y del recorrido completo.\nconst {spawnSync}=require('child_process');\nconst path=require('path');\nfor(const task of ['verificar-revision-parcial.cjs','verificar-regresion-parcial.cjs']){const result=spawnSync(process.execPath,[path.join(__dirname,task)],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}\n");
