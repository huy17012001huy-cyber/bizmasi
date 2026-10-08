import test from 'node:test';
import assert from 'node:assert/strict';
import {createNatureState} from '../src/nature-state.js';

test('intro, flight away, and exactly 20 seconds of quiet before returning',()=>{
 const s=createNatureState();
 assert.equal(s.getState().phase,'arriving');
 s.update(5.5);assert.equal(s.getState().phase,'calm');
 s.interact();assert.equal(s.getState().phase,'fleeing');
 s.update(3.4);assert.equal(s.getState().phase,'hidden');
 s.update(16.599);assert.equal(s.getState().phase,'hidden');
 s.update(.002);assert.equal(s.getState().phase,'returning');
 s.update(5.5);assert.equal(s.getState().phase,'calm');
});
test('repeated interaction resets quiet time without restarting an escape',()=>{
 const s=createNatureState();s.interact();const rev=s.getState().revision;
 s.update(1);s.interact();assert.equal(s.getState().revision,rev);
 s.update(2.5);assert.equal(s.getState().phase,'hidden');
 s.update(15);s.interact();s.update(19.99);assert.equal(s.getState().phase,'hidden');
 s.update(.02);assert.equal(s.getState().phase,'returning');
});
test('holding a pointer or reading a dialog prevents return',()=>{
 const s=createNatureState();s.interact();s.update(3.5);
 s.update(40,true);assert.equal(s.getState().phase,'hidden');
 s.update(19.99);assert.equal(s.getState().phase,'hidden');
 s.update(.02);assert.equal(s.getState().phase,'returning');
});
test('return can be interrupted; a paused clock does not advance',()=>{
 const s=createNatureState();s.interact();s.update(3.5);s.update(16.6);
 assert.equal(s.getState().phase,'returning');
 s.update(1);s.interact();assert.equal(s.getState().phase,'fleeing');
 const before=s.getState();s.update(0);assert.deepEqual(s.getState(),before);
 s.settle();assert.equal(s.getState().phase,'calm');
});
