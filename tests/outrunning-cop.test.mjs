import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../public/outrunning-portugal/index.html',import.meta.url),'utf8');
const start=html.indexOf('function newCopChallenge('),end=html.indexOf('const COP_GAME_COPY=',start);
function setup(){const c=vm.createContext({Math});vm.runInContext(html.slice(start,end),c);return c;}
test('alternating taps complete the police challenge in well under the existing stop duration',()=>{const m=setup(),c=m.newCopChallenge();for(let i=0;i<8;i++){m.advanceCopChallenge(c,.16);m.copBeat(c,i%2?'right':'left');}assert.ok(c.won);assert.ok(c.done);assert.ok(c.age<2);assert.equal(c.value,100);});
test('two wrong-side taps halve progress, with no gain from repeated or simultaneous taps',()=>{const m=setup(),c=m.newCopChallenge();for(let i=0;i<5;i++){m.advanceCopChallenge(c,.15);m.copBeat(c,i%2?'right':'left');}const value=c.value;m.copBeat(c,'left');assert.equal(c.misses,1);m.copBeat(c,'left');assert.equal(c.value,(value-3)/2);assert.equal(c.misses,0);assert.ok(!c.won);});
test('idle misses and deadline prevent banking progress indefinitely; timeout adds no new penalty',()=>{const m=setup(),c=m.newCopChallenge();m.advanceCopChallenge(c,.15);m.copBeat(c,'left');m.advanceCopChallenge(c,.61);assert.equal(c.misses,1);m.advanceCopChallenge(c,.61);assert.equal(c.misses,0);assert.ok(c.value<4);m.advanceCopChallenge(c,2.1);assert.ok(c.done);assert.ok(!c.won);const v=c.value;m.copBeat(c,c.next);assert.equal(c.value,v);});
