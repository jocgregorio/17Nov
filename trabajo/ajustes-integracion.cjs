const fs=require('fs'),path=require('path'),p=path.resolve(__dirname,'../juego/app.js');let s=fs.readFileSync(p,'utf8');s=s.replace('Tres cajas entregadas. Y las fresas de José llegaron intactas.','Nueve cajas entregadas. Y las fresas de José llegaron intactas.');
// Solo la llegada del coche cambia de color: misma escena y mismo tiempo.
const a=s.indexOf("else{rect(380,135,365,210"),b=s.indexOf('ctx.restore();}',a);if(a>=0&&b>a){const ending=s.slice(a,b).replaceAll('#ed173a','#d278a4').replaceAll('#b4c7ff','#f8d3e5');s=s.slice(0,a)+ending+s.slice(b);}fs.writeFileSync(p,s);
