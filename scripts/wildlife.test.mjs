import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWildlife} from '../src/wildlife.js';

function setup(camera){
  const scene=new THREE.Scene();
  const perches=Array.from({length:9},(_,i)=>new THREE.Vector3((i-4)*.8,5+(i%3)*.3,4));
  return createWildlife(scene,{groundY:()=>0,perches,camera});
}
function tick(w,seconds){for(let left=seconds;left>1e-8;left-=.05)w.update(Math.min(.05,left));}
test('nine lightweight birds land; only four ground squirrels eat',()=>{
  const w=setup();tick(w,6);
  const s=w.getState();
  assert.equal(s.phase,'calm');assert.equal(s.animals.length,13);
  assert.equal(s.animals.filter(a=>a.kind==='bird'&&a.mode==='perched').length,9);
  assert.equal(s.animals.filter(a=>a.kind==='eater'&&a.mode==='eat').length,4);
});
test('departure preserves positions, hides every animal, returns after 20 seconds',()=>{
  const w=setup();tick(w,2);
  const positions=w.getState().animals.map(a=>a.position);
  w.interact();w.update(0);
  w.getState().animals.forEach((a,i)=>assert.ok(new THREE.Vector3(...a.position).distanceTo(new THREE.Vector3(...positions[i]))<1e-6));
  tick(w,3.5);assert.ok(w.getState().animals.every(a=>!a.visible));
  tick(w,16.4);assert.equal(w.getState().phase,'hidden');
  tick(w,.2);assert.equal(w.getState().phase,'returning');
  tick(w,1.5);
  const before=w.getState().animals.map(a=>a.position);
  w.interact();w.update(0);
  w.getState().animals.forEach((a,i)=>assert.ok(new THREE.Vector3(...a.position).distanceTo(new THREE.Vector3(...before[i]))<1e-6));
  tick(w,36);assert.equal(w.getState().phase,'calm');
  assert.ok(w.getState().animals.every(a=>a.visible));
});
test('reduced motion settles the entire flock at its perches',()=>{
  const w=setup();w.settle();
  assert.equal(w.getState().phase,'calm');
  assert.ok(w.getState().animals.every(a=>a.visible&&['perched','eat'].includes(a.mode)));
});

test('independent branch flights can be interrupted without teleporting',()=>{
  const w=setup();tick(w,16);
  const s=w.getState();
  assert.ok(s.animals.some(a=>a.mode==='exploring'));
  assert.ok(s.animals.some(a=>a.kind==='bird'&&a.mode==='perched'));
  const positions=s.animals.map(a=>a.position);
  w.interact();w.update(0);
  w.getState().animals.forEach((a,i)=>assert.ok(new THREE.Vector3(...a.position).distanceTo(new THREE.Vector3(...positions[i]))<1e-6));
  tick(w,36);
  assert.equal(w.getState().phase,'calm');
  assert.ok(w.getState().animals.every(a=>a.visible));
});

test('two close squirrel pairs return to the camera side and face each other after an orbit',()=>{
  const camera={position:new THREE.Vector3(0,9.6,35)};
  const w=setup(camera);tick(w,6);
  for(const angle of [Math.PI,Math.PI/2,-Math.PI/2,0]){
    w.interact();tick(w,3.5);
    camera.position.set(Math.sin(angle)*35,9.6,Math.cos(angle)*35);
    tick(w,16.4);assert.equal(w.getState().phase,'hidden');
    tick(w,7);
    const squirrels=w.getState().animals.filter(a=>a.kind==='eater');
    assert.equal(squirrels.length,4);
    for(const a of squirrels){
      const p=new THREE.Vector3(...a.position);
      const front=camera.position.clone().setY(0).normalize();
      assert.ok(p.dot(front)>2,'Feeding spot must be on the camera side');
      const partner=squirrels.find(other=>other.index===(a.index^1));
      const toPartner=new THREE.Vector3(...partner.position).sub(p).setY(0);
      assert.ok(toPartner.length()<1.2,'Partners should sit close together');
      assert.ok(toPartner.normalize().dot(new THREE.Vector3(...a.facing))>.99,'Squirrel must face its partner');
    }
  }
});
test('birds brake upright before contact and settle without a position snap',()=>{
  const w=setup();tick(w,4.1);
  const bird=w.getState().animals.find(a=>a.kind==='bird'&&a.index===0);
  assert.equal(bird.mode,'landing');
  assert.ok(bird.landingProgress>.7);
  assert.ok(Math.abs(bird.facing[1])<.25,'Landing body should be nearly upright');
  tick(w,.24);
  const before=w.getState().animals[0];
  tick(w,.02);
  const after=w.getState().animals[0];
  assert.equal(after.mode,'perched');
  assert.ok(new THREE.Vector3(...before.position).distanceTo(new THREE.Vector3(...after.position))<.03);
  assert.ok(new THREE.Vector3(...before.facing).dot(new THREE.Vector3(...after.facing))>.98);
});
