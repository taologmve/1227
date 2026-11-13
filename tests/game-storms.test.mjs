import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const physics=html.slice(html.indexOf('const to=.25;'),html.indexOf('const xy=',html.indexOf('const to=.25;')));
const paint=html.slice(html.indexOf('function somiDrawStorm('),html.indexOf('function B1(',html.indexOf('function somiDrawStorm(')));
const ctx=vm.createContext({});vm.runInContext(physics+paint,ctx);
for(const mode of ['easy','normal']){
 ctx.mode=mode;
 const result=vm.runInContext(`(()=>{const state=vy();let clouds=0,bolts=0;for(let n=0;n<720&&state.status==='running';n++){state.y=.75;state.vy=-1.35/120;state.obstacles=[];by(state,1/120,mode,()=>.5);clouds=Math.max(clouds,state.storms.length);bolts=Math.max(bolts,state.bolts.length)}return{clouds,bolts}})()`,ctx);
 if(mode==='easy'){assert.equal(result.clouds,0);assert.equal(result.bolts,0)}else{assert.ok(result.clouds>0,'challenge spawns clouds');assert.ok(result.bolts>0,'challenge fires lightning')}
}
const offscreen=vm.runInContext(`(()=>{const x=vy();x.stormSpawnTime=100;x.storms=[{x:1.1,y:.2,throwIn:0}];yy(x,.01,.2,0);return x.bolts.length})()`,ctx);assert.equal(offscreen,0);
for(const kind of ['cloud','bolt']){
 ctx.kind=kind;
 const result=vm.runInContext(`(()=>{const x=vy();x.stormSpawnTime=100;if(kind==='cloud')x.storms=[{x:.25,y:x.y,throwIn:1}];else x.bolts=[{x:.25,y:x.y,vx:0,vy:0,age:0}];yy(x,.001,.2,0);return {status:x.status,reason:x.reason,score:x.score}})()`,ctx);
 assert.equal(result.status,'over');assert.equal(result.score,0);assert.match(result.reason,kind==='cloud'?/雷云/:/闪电/);
}
let paints=0;const canvas=new Proxy({},{get:(_,key)=>key==='fill'||key==='drawImage'?()=>paints++:()=>{},set:()=>true});ctx.canvas=canvas;
vm.runInContext(`somiDrawStorm(canvas,null,'cloud',0,0,100,60);somiDrawStorm(canvas,null,'bolt',0,0,30,60)`,ctx);assert.equal(paints,2);
const paused=vm.runInContext(`(()=>{const x=vy();x.status='paused';const before=JSON.stringify(x);by(x,1,'normal');return before===JSON.stringify(x)})()`,ctx);assert.equal(paused,true);
console.log('PASS: easy has no storms; challenge spawns clouds and fires lightning; no offscreen attacks; both collisions end play; fallback rendering and pause work.');
