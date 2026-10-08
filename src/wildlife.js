import * as THREE from 'three';
import { createNatureState } from './nature-state.js';
import { createSquirrel, createBird } from './animal-models.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const smooth=t=>t*t*(3-2*t);
const clamp=THREE.MathUtils.clamp;
const forward=V(0,0,1), up=V(0,1,0);
const polar=(angle,radius,y)=>V(Math.cos(angle)*radius,y,Math.sin(angle)*radius);

/** Nine small birds and four ground squirrels share a single active clock. */
export function createWildlife(scene,{groundY,perches,camera={position:V(0,9.6,35)}}) {
  const state=createNatureState();
  const flock=new THREE.Group();flock.name='woodland-wildlife';scene.add(flock);
  const homeOffsets=[V(-4.35,0,3.65),V(-3.25,0,3.85),V(3.10,0,4.25),V(4.20,0,4.00)];
  function cameraHome(index){
    const p=homeOffsets[index].clone().applyAxisAngle(up,Math.atan2(camera.position.x,camera.position.z));
    p.y=groundY(p.x,p.z);return p;
  }
  const homes=homeOffsets.map((_,i)=>cameraHome(i));
  const entities=[
    ...perches.map((home,i)=>({rig:createBird(i),kind:'bird',home:home.clone(),index:i})),
    ...homes.map((home,i)=>({rig:createSquirrel(i),kind:'eater',home,index:i}))
  ];
  // Cheap contact shadows move with the squirrels; the tree's shadow map stays cached.
  const contactMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 vUv; void main(){float a=(1.-smoothstep(.08,.5,length(vUv-.5)))*.26;gl_FragColor=vec4(.12,.16,.08,a);}'
  });
  const contactGeometry=new THREE.PlaneGeometry(1.65,1.3);
  entities.forEach(e=>{
    e.rig.group.position.copy(e.home);
    e.rig.group.scale.setScalar(e.kind==='bird'?1.12+(e.index%3)*.07:1.03);
    e.restHeading=e.kind==='bird'?Math.atan2(e.home.x,e.home.z)+.7:e.index===0?.38:-.35;
    e.rig.group.rotation.y=e.restHeading;
    e.mode='idle';e.landedAt=-Infinity;e.landingProgress=0;
    flock.add(e.rig.group);
    if(e.kind==='bird'){
      const a=Math.atan2(e.home.z,e.home.x);
      e.roost=e.home.clone();e.hop=null;e.nextHopAt=Infinity;
      e.incoming=new THREE.CatmullRomCurve3([
        polar(a-.55,29,e.home.y+8),
        polar(a-.3,21,e.home.y+5),
        polar(a-.12,14.5,e.home.y+2.5),
        e.home.clone().add(polar(a,1.2,.8)),e.home
      ]);
    }else{
      e.contact=new THREE.Mesh(contactGeometry,contactMaterial);
      e.contact.rotation.x=-Math.PI/2;flock.add(e.contact);
    }
  });

  let revision=0,arrivedOnce=false;
  const look=new THREE.Quaternion(), landingLook=new THREE.Quaternion(), direction=V();
  function ground(p){p.y=groundY(p.x,p.z);return p;}
  function aim(e,tangent,delta,landing=0){
    if(tangent.lengthSq()<.001)return;
    if(e.kind==='bird'){
      direction.copy(tangent).normalize();
      // Preserve an upright body through turns instead of shortest-arc roll.
      look.setFromEuler(new THREE.Euler(-Math.asin(clamp(direction.y,-1,1)),Math.atan2(direction.x,direction.z),0,'YXZ'));
      if(landing>0){
        landingLook.setFromEuler(new THREE.Euler(-.20*Math.sin(landing*Math.PI),e.restHeading,0,'YXZ'));
        look.slerp(landingLook,landing);
      }
    }
    else look.setFromAxisAngle(up,Math.atan2(tangent.x,tangent.z));
    e.rig.group.quaternion.slerp(look,Math.min(1,delta*11));
  }
  function transition(s){
    if(s.revision===revision)return;
    revision=s.revision;
    if(s.phase==='fleeing'){
      for(const e of entities){
        const from=e.rig.group.position.clone();
        const heading=forward.clone().applyQuaternion(e.rig.group.quaternion);
        if(e.kind==='bird'){
          const a=Math.atan2(from.z,from.x);
          e.hop=null;
          e.escape=new THREE.CatmullRomCurve3([
            from,from.clone().addScaledVector(heading,.65).add(V(0,.7,0)),
            polar(a+.18,18,from.y+4),polar(a+.35,30,from.y+9)
          ]);
        }else{
          const a=Math.atan2(from.z,from.x), side=e.index%2===0?1:-1;
          e.escape=new THREE.CatmullRomCurve3([
            from,ground(from.clone().addScaledVector(heading,.45)),
            ground(polar(a+side*.17,8,0)),ground(polar(a+side*.35,13,0)),ground(polar(a+side*.5,22,0))
          ]);
        }
        e.hide=e.escape.getPoint(1);
      }
    }
    if(s.phase==='returning'){
      for(const e of entities){
        if(e.kind==='bird'){
          const a=Math.atan2(e.home.z,e.home.x);
          e.roost.copy(e.home);
          e.returnPath=new THREE.CatmullRomCurve3([
            e.hide,polar(a+.4,23,e.home.y+6),
            polar(a+.16,15.5,e.home.y+3),
            e.home.clone().add(polar(a,1.4,1)),e.home
          ]);
        }else{
          // Move feeding spots only while hidden, to the side the viewer now faces.
          e.home.copy(cameraHome(e.index));
          const a=Math.atan2(e.hide.z,e.hide.x), b=Math.atan2(e.home.z,e.home.x);
          const arc=Math.atan2(Math.sin(b-a),Math.cos(b-a));
          e.returnPath=new THREE.CatmullRomCurve3([
            e.hide,ground(polar(a+arc*.22,15,0)),ground(polar(a+arc*.55,12,0)),
            ground(polar(a+arc*.83,8.5,0)),ground(polar(b,6.6,0)),e.home
          ]);
        }
      }
    }
    if(s.phase==='calm'){
      arrivedOnce=true;
      for(const e of entities)if(e.kind==='bird'){
        e.roost.copy(e.home);e.hop=null;e.nextHopAt=s.clock+4+((e.index*4)%9)*2.6;
      }
    }
  }
  function calmPose(e,time,delta){
    e.rig.group.visible=true;
    e.rig.group.position.copy(e.kind==='bird'?e.roost:e.home);
    const partner=e.kind==='eater'?entities.find(other=>other.kind==='eater'&&other.index===(e.index^1)):null;
    const facing=e.kind==='bird'?e.restHeading:Math.atan2(partner.home.x-e.home.x,partner.home.z-e.home.z);
    look.setFromAxisAngle(up,facing);
    e.rig.group.quaternion.slerp(look,Math.min(1,delta*8));
    if(e.kind==='bird'&&e.mode!=='perched')e.landedAt=time;
    e.mode=e.kind==='bird'?'perched':'eat';
    e.landingProgress=e.kind==='bird'?1:0;
    e.rig.pose(time,e.kind==='bird'?'perched':'eat',delta,e.kind==='bird'?time-e.landedAt:true);
  }
  function follow(e,path,t,time,delta,returning=false){
    const pathT=e.kind==='bird'?smooth(t):t;
    e.rig.group.position.copy(path.getPointAt(pathT));
    if(e.kind!=='bird')e.rig.group.position.y=groundY(e.rig.group.position.x,e.rig.group.position.z);
    const landing=e.kind==='bird'&&returning?smooth(clamp((t-.65)/.35,0,1)):0;
    aim(e,path.getTangentAt(pathT),delta,landing);
    e.landingProgress=landing;
    e.mode=e.kind==='bird'?(landing>0?'landing':'fly'):'run';
    e.rig.pose(time,e.mode,delta,e.kind==='bird'?landing:true);
  }
  function wander(e,time,delta,blocked){
    if(!e.hop && !blocked && time>=e.nextHopAt){
      const destination=e.roost.distanceToSquared(e.home)<.01?perches[(e.index+2)%perches.length]:e.home;
      const from=e.roost.clone(), a=Math.atan2(from.z,from.x);
      const b=Math.atan2(destination.z,destination.x);
      const arc=Math.atan2(Math.sin(b-a),Math.cos(b-a));
      const height=Math.max(from.y,destination.y)+1.5;
      e.hop=new THREE.CatmullRomCurve3([
        from,polar(a+arc*.06,14.2,from.y+1.2),
        polar(a+arc*.35,15.0,height),
        polar(a+arc*.7,14.7,height+.3),
        destination.clone().add(polar(b,1.3,.85)),destination.clone()
      ]);
      e.hopStart=time;e.hopDuration=5.8+(e.index%3)*.6;e.hopDestination=destination;
    }
    if(e.hop){
      const t=clamp((time-e.hopStart)/e.hopDuration,0,1);
      follow(e,e.hop,t,time,delta,true);
      if(e.mode!=='landing')e.mode='exploring';
      if(t===1){
        e.roost.copy(e.hopDestination);e.hop=null;
        e.nextHopAt=time+20+e.index*1.4;calmPose(e,time,delta);
      }
    }else calmPose(e,time,delta);
  }
  function update(delta,blocked=false){
    state.update(delta,blocked);
    const s=state.getState();transition(s);
    const poseDelta=delta||1/60;
    for(const e of entities){
      if(s.phase==='hidden'){
        e.rig.group.visible=false;e.mode='hidden';
      }else if(s.phase==='arriving'&&e.kind==='bird'){
        const elapsed=s.elapsed-e.index*.09, t=clamp(elapsed/4.35,0,1);
        e.rig.group.visible=elapsed>=0;
        if(t===1)calmPose(e,s.clock,poseDelta);
        else follow(e,e.incoming,t,s.clock,poseDelta,true);
      }else if(s.phase==='calm'&&e.kind==='bird'){
        wander(e,s.clock,poseDelta,blocked);
      }else if(s.phase==='arriving'||s.phase==='calm'){
        calmPose(e,s.clock,poseDelta);
      }else{
        const returning=s.phase==='returning';
        const delay=returning?(e.kind==='bird'?e.index*.07:.4+e.index*.35):e.index*.045;
        const duration=returning?(e.kind==='bird'?4.6:3.6):(e.kind==='bird'?2.8:3.1);
        const elapsed=s.elapsed-delay, t=clamp(elapsed/duration,0,1);
        const path=returning?e.returnPath:e.escape;
        // Stagger the departure without blinking animals off before their turn.
        e.rig.group.visible=returning?elapsed>=0:t<1;
        if(e.rig.group.visible){
          if(returning&&t===1)calmPose(e,s.clock,poseDelta);
          else follow(e,path,t,s.clock,poseDelta,returning);
        }else e.mode='hidden';
      }
      if(e.contact){
        e.contact.visible=e.rig.group.visible;
        e.contact.position.copy(e.rig.group.position);
        e.contact.position.y+=.035;
      }
    }
    return s;
  }
  update(0);
  return {
    update,
    interact(){state.interact();transition(state.getState());},
    settle(){
      state.settle();transition(state.getState());update(0);
      // Finish folding wings before the render loop parks for reduced motion.
      for(const e of entities){
        calmPose(e,state.getState().clock,1);
        e.rig.pose(state.getState().clock,e.kind==='bird'?'perched':'eat',1,e.kind==='bird'?1:true);
      }
    },
    getState:()=>({
      ...state.getState(),arrivedOnce,
      animals:entities.map(e=>({kind:e.kind,index:e.index,mode:e.mode,visible:e.rig.group.visible,position:e.rig.group.position.toArray(),facing:forward.clone().applyQuaternion(e.rig.group.quaternion).toArray(),landingProgress:e.landingProgress}))
    })
  };
}
