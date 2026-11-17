const fs=require('fs'),path=require('path'),file=path.resolve(__dirname,'../juego/app.js');
let code=fs.readFileSync(file,'utf8');
code=code.replaceAll("#arena.classList", "$('#arena').classList");
code=code.replace("running=false;finished=true;unlocked=5;save();$('#hud').hidden=true;$('#touch').hidden=true;$('#bubble').hidden=true;", "running=false;finished=true;unlocked=5;save();$('#hud').hidden=true;$('#touch').hidden=true;");
fs.writeFileSync(file,code);
