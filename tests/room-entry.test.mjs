import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.match(/let somiRoomEntrySeen=false;[\s\S]*?(?=function By\(\))/)[0];
async function harness(props={reduced:false,suspended:false}){
 const slots=[],pending=[],running=[];let cursor=0,tree,dirty=false;
 const context={console,setTimeout,clearTimeout,Promise,Image:class{set src(_){queueMicrotask(()=>this.onload?.())}},document:{hidden:false,addEventListener(){},removeEventListener(){}},somiRoomAssets:{background:'bg',pushing:'push',seated:'sit'},s:{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}};
 context.el={useState(initial){const i=cursor++;if(!slots[i])slots[i]={value:initial};return[slots[i].value,v=>{const next=typeof v==='function'?v(slots[i].value):v;if(next!==slots[i].value){slots[i].value=next;dirty=true}}]},useRef(initial){const i=cursor++;return slots[i]??=( {current:initial})},useEffect(fn,deps){const i=cursor++,old=slots[i];if(!old||deps.some((v,k)=>v!==old.deps[k])){old?.cleanup?.();const value={deps};slots[i]=value;pending.push(()=>value.cleanup=fn())}}};
 vm.createContext(context);vm.runInContext(source,context);
 function node(){return{animate(){let resolve,reject;const a={playState:'running',finished:new Promise((r,j)=>{resolve=r;reject=j}),complete(){resolve()},cancel(){this.playState='idle';reject(new Error('cancelled'))},pause(){this.playState='paused'},play(){this.playState='running'}};running.push(a);return a}}}
 function attach(n){if(!n||typeof n!=='object')return;if(n.props?.ref)n.props.ref.current=node();const children=n.props?.children;for(const c of Array.isArray(children)?children:[children])attach(c)}
 async function render(){for(let i=0;i<8;i++){dirty=false;cursor=0;context.input=props;tree=vm.runInContext('SomiRoomEntrance(input)',context);attach(tree);while(pending.length)pending.shift()();await new Promise(r=>setImmediate(r));if(!dirty)break}return tree.props.className}
 return{render,running,props,get tree(){return tree},unmount(){for(const slot of slots)slot?.cleanup?.()}};
}
const h=await harness();assert.equal(await h.render(),'somi-room-entry room-entry-pushing');
h.props.suspended=true;await h.render();assert.equal(h.running[0].playState,'paused');h.props.suspended=false;await h.render();assert.equal(h.running[0].playState,'running');
h.running[0].complete();await new Promise(r=>setImmediate(r));assert.equal(await h.render(),'somi-room-entry room-entry-seating');
h.running[1].complete();await new Promise(r=>setImmediate(r));assert.equal(await h.render(),'somi-room-entry room-entry-seated');h.unmount();
const r=await harness({reduced:true,suspended:false});assert.equal(await r.render(),'somi-room-entry room-entry-seated');assert.equal(r.running.length,0);r.unmount();
const stop=await harness();await stop.render();stop.unmount();assert.equal(stop.running[0].playState,'idle');
console.log('PASS: push → sit → seated, overlay pause/resume, reduced motion, and unmount cancellation.');
