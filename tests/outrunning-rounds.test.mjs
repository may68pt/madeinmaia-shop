import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roomAction } from '../lib/outrunning/rooms.ts';

function room(capacity=2) {
  const now = Date.now();
  const host = roomAction({action:'create',chapter:0,autoReady:true,capacity},'host-round',now);
  const players = [host];
  for(let i=1;i<capacity;i++) players.push(roomAction({action:'join',code:host.code,autoReady:true},'guest-round-'+i,now+i));
  const start = players.at(-1).startAt;
  const send = (i,action,extra={},t=500) => roomAction({action,code:host.code,token:players[i].token,round:1,...extra},'round-'+i,start+t);
  const sample = (i,status,charges=0) => send(i,'sync',{sample:{z:5000+i*50,x:0,speed:1000,status,elapsed:.1,coins:i+3,charges}});
  return {send,sample,start};
}

test('a new route starts only after all three racers accept the same proposal',()=>{
  const {send,sample,start}=room(3);
  for(let i=0;i<3;i++)sample(i,'finished');
  assert.throws(()=>send(0,'rematch',{chapter:90}),/two racers/);
  assert.equal(send(0,'rematch',{chapter:2}).rematch.votes,1);
  assert.equal(send(1,'rematch',{chapter:3}).rematch.votes,1);
  assert.equal(send(1,'rematch',{chapter:2}).rematch.votes,2);
  const next=send(2,'rematch',{chapter:2});
  assert.equal(next.round,2);
  assert.equal(next.chapter,2);
  assert.equal(next.startAt,start+5500);
  assert.ok(next.players.every(p=>p.sample===null));
  assert.equal(sample(0,'finished').players[0].sample,null);
});

test('either racer may decline; spent charges target only the opponent',()=>{
  const {send,sample}=room();
  sample(0,'racing',1);sample(1,'racing');
  assert.equal(send(0,'attack').ammo,0);
  assert.equal(send(0,'sync').attacks.length,0);
  assert.equal(send(1,'sync').attacks.length,1);
  send(0,'attack');
  assert.equal(send(1,'sync').attacks.length,1);
  sample(0,'finished',1);sample(1,'out');
  send(0,'rematch',{chapter:90});
  assert.equal(send(1,'decline').rematch.declined,true);
  assert.throws(()=>send(1,'rematch',{chapter:90}),/finish/);
});
