import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roomAction, validRoomOrigin } from '../lib/outrunning/rooms.ts';
const t=1_800_000_000_000;
test('two private players, ready handshake, shared countdown, state exchange and immutable result',()=>{
 const a=roomAction({action:'create',chapter:0,name:'Paulo'},'a',t);
 const b=roomAction({action:'join',code:a.code,name:'Luna'},'b',t+10);
 assert.throws(()=>roomAction({action:'join',code:a.code},'c',t+20),/full/);
 assert.throws(()=>roomAction({action:'sync',code:a.code,token:'wrong'},'c',t+20),/session/);
 let r=roomAction({action:'ready',code:a.code,token:a.token},'a',t+30);assert.equal(r.startAt,null);
 r=roomAction({action:'ready',code:a.code,token:b.token},'b',t+40);assert.equal(r.startAt,t+4040);
 assert.ok(r.players.every(p=>p.ready));assert.ok(!JSON.stringify(r).includes(a.token));
 const base={action:'sync',code:a.code,token:a.token};
 roomAction({...base,sample:{z:5000,x:.4,speed:1000,status:'racing',elapsed:.1}},'a',t+4140);
 r=roomAction({action:'sync',code:a.code,token:b.token},'b',t+4200);assert.equal(r.players.find(p=>!p.me).sample.z,5000);
 assert.throws(()=>roomAction({...base,sample:{z:-1,x:0,speed:1,status:'racing',elapsed:1}},'a',t+5040),/position/);
 roomAction({...base,sample:{z:6000,x:0,speed:0,status:'finished',elapsed:1}},'a',t+5040);
 r=roomAction({...base,sample:{z:1,x:0,speed:0,status:'racing',elapsed:2}},'a',t+6040);assert.equal(r.players.find(p=>p.me).sample.status,'finished');
 assert.equal(r.players.find(p=>!p.me).online,true);
 r=roomAction(base,'a',t+11000);assert.equal(r.players.find(p=>!p.me).online,false);
 assert.throws(()=>roomAction(base,'a',t+31*60_000),/expired/);
});
test('lobby departure frees the second seat and malformed input is rejected',()=>{
 const a=roomAction({action:'create',chapter:0},'d',t);
 const b=roomAction({action:'join',code:a.code},'e',t);
 roomAction({action:'leave',code:a.code,token:b.token},'e',t+1);
 assert.ok(roomAction({action:'join',code:a.code},'f',t+2).token);
 assert.throws(()=>roomAction({action:'create',chapter:NaN},'g',t),/route/);
});

test('public origins work behind Next.js and Render internal URLs; foreign origins fail',()=>{
 assert.ok(validRoomOrigin(new Request('http://0.0.0.0:3000/api/outrunning/rooms',{headers:{host:'madeinmaia.pt',origin:'https://madeinmaia.pt'}})));
 assert.ok(validRoomOrigin(new Request('http://localhost:3000/api/outrunning/rooms',{headers:{host:'internal:3000','x-forwarded-host':'madeinmaia.pt',origin:'https://madeinmaia.pt'}})));
 assert.ok(!validRoomOrigin(new Request('http://localhost:3000/api/outrunning/rooms',{headers:{host:'madeinmaia.pt',origin:'https://other.example'}})));
});

test('scan-to-join starts both phones on the same countdown without a ready step', () => {
 const host = roomAction({action:'create',chapter:1,autoReady:true},'qr-host',t);
 assert.equal(host.startAt,null);
 const guest = roomAction({action:'join',code:host.code,autoReady:true},'qr-guest',t+10);
 assert.equal(guest.startAt,t+4010);
 const next = roomAction({action:'sync',code:host.code,token:host.token},'qr-host',t+125);
 assert.equal(next.startAt,guest.startAt);
 assert.equal(next.chapter,guest.chapter);
});
