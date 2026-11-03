import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../public/outrunning-portugal/index.html',import.meta.url),'utf8');
function fn(name){const start=html.indexOf('function '+name+'('),end=html.indexOf('\nfunction ',start+1);return html.slice(start,end);}
test('100 seeded layouts leave a consistent lane and limit oil to one occasional patch per stage',()=>{
 for(let seed=1;seed<=100;seed++){
  const sprites=[];let n=seed;
  const c=vm.createContext({Math,STAGES:[{}],stageStart:[0],goalIdx:3000,segments:Array.from({length:3001},()=>({sprites:[]})),diffOf:()=>1.25,cpLines:new Set(),isCity:()=>true,stageClim:()=>({}),pick:(R,a)=>a[Math.floor(R()*a.length)],addSprite:(i,key,offset,opts={})=>sprites.push({i,key,offset,...opts})});
  vm.runInContext(fn('placeHazards'),c);c.placeHazards(()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;});
  assert.ok(sprites.filter(s=>s.hz==='oil').length<=1);
  const works=sprites.filter(s=>s.hz==='works');assert.ok(works.length);
  const starts=[...new Set(works.filter(s=>s.hzStart).map(s=>s.i))].sort((a,b)=>a-b);
  starts.forEach((start,index)=>{
   if(index)assert.ok(start-starts[index-1]>122,'zones have recovery space');
   const group=works.filter(s=>s.i>=start&&s.i<start+72);
   const lane=[-.72,0,.72].find(x=>group.every(s=>Math.abs(s.offset-x)>.01));assert.notEqual(lane,undefined,'open lane throughout section');
   for(const s of group)assert.ok(Math.abs(s.offset-lane)>(.46+.30)/2,'full visible car fits clear of board');
   assert.ok(group.filter(s=>s.key==='hzBarrier').length>=6,'multiple board layers');
  });
 }
});
test('near misses do not hit; contact breaks a board once, slows slightly, and never crashes',()=>{
 const board={key:'hzBarrier',hz:'works',offset:0};let fragments=0;
 const c=vm.createContext({Math,PW:{fly:0,siren:0},crash:null,speed:1000,shake:0,playerX:.38,PLAYER_HITW:.26,position:0,playerZ:100,segL:100,lastPIdx:0,cars:[],segments:[{sprites:[board]}],SP:{hzBarrier:{ww:.46}},overlap:(x,w,y,v)=>Math.abs(x-y)<=(w+v)/2,breakBoard:()=>fragments++,sfx:()=>{},vib:()=>{},setAnim:()=>{},hitObstacle:()=>{throw Error('must not crash');}});
 vm.runInContext(fn('hazardHit')+'\n'+fn('powerUpdate'),c);
 c.powerUpdate(.016,{index:0});assert.equal(fragments,0);assert.equal(c.speed,1000);
 c.playerX=0;c.powerUpdate(.016,{index:0});assert.equal(fragments,1);assert.equal(c.speed,910);assert.ok(board.broken);
 c.powerUpdate(.016,{index:0});assert.equal(fragments,1);assert.equal(c.speed,910);
});
