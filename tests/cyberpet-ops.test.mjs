import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stageOf, levelOf, matchesRule, cleanRule, cleanOp, opReaches, describeOp, pgArray } from '../lib/cyberpet/ops-core.ts';

const pet = (o = {}) => ({ id: 'ABC123', createdAt: '2026-11-01T10:00:00Z', data: { variant: 'ignis', stage: 'hatched', growth: 100, xp: 0, ...o } });

test('stage and level follow the app thresholds', () => {
  assert.equal(stageOf({ stage: 'egg' }), 'egg');
  assert.equal(stageOf({ growth: 10 }), 'baby');
  assert.equal(stageOf({ growth: 100 }), 'juv');
  assert.equal(stageOf({ growth: 400 }), 'teen');
  assert.equal(stageOf({ growth: 800 }), 'adult');
  assert.equal(levelOf({ xp: 0 }), 1);
  assert.equal(levelOf({ xp: 100 }), 2);
  assert.equal(levelOf({ xp: 260 }), 3); // 100 + 160
});

test('class rules filter by variant, stage, level, date and id', () => {
  assert.equal(matchesRule({}, pet()), true);
  assert.equal(matchesRule({ variants: ['ignis'] }, pet()), true);
  assert.equal(matchesRule({ variants: ['aqua'] }, pet()), false);
  assert.equal(matchesRule({ stages: ['juv'] }, pet()), true);
  assert.equal(matchesRule({ stages: ['adult'] }, pet()), false);
  assert.equal(matchesRule({ minLevel: 2 }, pet()), false);
  assert.equal(matchesRule({ createdAfter: '2026-10-01T00:00:00Z' }, pet()), true);
  assert.equal(matchesRule({ createdBefore: '2026-10-01T00:00:00Z' }, pet()), false);
  assert.equal(matchesRule({ petIds: ['XYZ'] }, pet()), false);
});

test('cleanRule drops junk', () => {
  assert.deepEqual(cleanRule({ variants: ['ignis', '<bad>'], stages: ['teen', 'god'], minLevel: '3', junk: 1 }), { variants: ['ignis'], stages: ['teen'], minLevel: 3 });
});

test('cleanOp validates every kind', () => {
  assert.equal(cleanOp({ kind: 'grant' }).ok, false);
  assert.deepEqual(cleanOp({ kind: 'grant', coins: 50, items: { shard: 2, '<x>': 1 } }), { ok: true, op: { kind: 'grant', coins: 50, items: { shard: 2 } } });
  assert.deepEqual(cleanOp({ kind: 'stat', set: { happy: 150, nope: 3 } }), { ok: true, op: { kind: 'stat', set: { happy: 100 } } });
  assert.deepEqual(cleanOp({ kind: 'message', text: ' <b>Hi</b> ', style: 'weird' }), { ok: true, op: { kind: 'message', text: 'bHi/b', style: 'toast' } });
  assert.equal(cleanOp({ kind: 'anim', name: 'back flip' }).ok, false);
  assert.equal(cleanOp({ kind: 'revive' }).ok, true);
  assert.equal(cleanOp({ kind: 'delete-everything' }).ok, false);
});

test('ops reach the right pets', () => {
  const base = { id: 1, class_id: null, pet_ids: [], include_new: false, created_at: '2026-11-05T00:00:00Z', payload: { kind: 'revive' } };
  assert.equal(opReaches({ ...base, scope: 'all' }, pet()), true);
  assert.equal(opReaches({ ...base, scope: 'all' }, { ...pet(), createdAt: '2026-11-06T00:00:00Z' }), false, 'newer pets skip old broadcasts');
  assert.equal(opReaches({ ...base, scope: 'all', include_new: true }, { ...pet(), createdAt: '2026-11-06T00:00:00Z' }), true);
  assert.equal(opReaches({ ...base, scope: 'pets', pet_ids: ['ABC123'] }, pet()), true);
  assert.equal(opReaches({ ...base, scope: 'class', class_rule: { variants: ['aqua'] } }, pet()), false);
});

test('helpers', () => {
  assert.equal(pgArray(['A1', 'b2', 'x y', 3]), '{A1,b2,3}');
  assert.equal(describeOp({ kind: 'grant', coins: 10, gems: 1 }), 'Grant 10 coins, 1 gems');
});
