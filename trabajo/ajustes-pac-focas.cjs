const fs=require('fs'),path=require('path');
for(const relative of ['../juego/app.js','extension-pac-focas.js']){const p=path.resolve(__dirname,relative);let code=fs.readFileSync(p,'utf8');code=code.replace('dist(player,exit)<43&&m.invulnerable<2.6','dist(player,exit)<43');code=code.replace("rect(0,355,800,205,'#204bd9')", "rect(0,355,800,205,'#dce5ff')");fs.writeFileSync(p,code);}
fs.writeFileSync(path.resolve(__dirname,'verificar-arcade.cjs'),"// Prueba vigente. Las pruebas de la versión anterior están en antes-pac-focas.\nrequire('./verificar-v4.cjs');\n");
