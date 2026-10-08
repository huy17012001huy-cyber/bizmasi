import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';

export function createTree(host,departments,select){
 const wrap=host.querySelector('#canvas-wrap'),labelsHost=host.querySelector('#labels');
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 wrap.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','Đại cổ thụ tri thức 3D. Kéo để xoay và chọn một nhánh phòng ban.');renderer.domElement.setAttribute('role','img');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#9ccde0');scene.fog=new THREE.FogExp2('#c8dec8',.004);
 const sky=new Sky();sky.scale.setScalar(400);sky.material.uniforms.turbidity.value=2.8;sky.material.uniforms.rayleigh.value=1.4;sky.material.uniforms.mieCoefficient.value=.004;sky.material.uniforms.mieDirectionalG.value=.75;sky.material.uniforms.sunPosition.value.set(-18,30,8);scene.add(sky);
 const V=(x,y,z)=>new THREE.Vector3(x,y,z);
 const camera=new THREE.PerspectiveCamera(38,1,.15,450);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;controls.minDistance=22;controls.maxDistance=62;controls.minPolarAngle=1.02;controls.maxPolarAngle=1.82;
 const target=V(0,9,0),overview=V(17,4.4,30);
 camera.position.copy(overview);controls.target.copy(target);
 const hemi=new THREE.HemisphereLight('#d8efff','#858852',2.1);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#ffe3a6',3.5);sun.position.set(-18,30,8);sun.target.position.set(0,7,0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-23,right:23,top:22,bottom:-22,near:1,far:80});sun.shadow.bias=-.0002;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun,sun.target);
 const rim=new THREE.DirectionalLight('#efffc7',2.8);rim.position.set(4,22,-20);scene.add(rim);
 const fill=new THREE.DirectionalLight('#fff1d6',1.3);fill.position.set(12,8,25);scene.add(fill);
 let seed=640;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function barkTexture(){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;const ctx=canvas.getContext('2d');
  const pixels=ctx.createImageData(512,1024);
  for(let y=0;y<1024;y++)for(let x=0;x<512;x++){const n=Math.sin(x*.073+Math.sin(y*.015)*1.4)*7+Math.sin(x*.22+y*.028)*3+rand()*9;const k=(y*512+x)*4;pixels.data[k]=135+n;pixels.data[k+1]=132+n;pixels.data[k+2]=122+n;pixels.data[k+3]=255;}
  ctx.putImageData(pixels,0,0);
  for(let i=0;i<300;i++){const x=rand()*512,y=rand()*1024,len=25+rand()*170;
   ctx.beginPath();ctx.moveTo(x,y);for(let dy=0;dy<len;dy+=8)ctx.lineTo(x+Math.sin(dy*.035+i)*3+Math.sin(dy*.012)*7,y+dy);
   ctx.strokeStyle='rgba(42,39,34,.34)';ctx.lineWidth=1+rand()*2.8;ctx.stroke();
   if(i%3===0){ctx.beginPath();ctx.moveTo(x,y+len*.6);ctx.lineTo(x+7+rand()*8,y+len*.6+4);ctx.lineWidth=1;ctx.stroke();}
  }
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return texture;
 }
 const barkMap=barkTexture();
 const bark=new THREE.MeshStandardMaterial({color:'#c8b99e',map:barkMap,bumpMap:barkMap,bumpScale:.055,roughness:.96,vertexColors:true});
 const textureLoader=new THREE.TextureLoader();
 textureLoader.load(import.meta.env.BASE_URL+'textures/oak-color.jpg',texture=>{
  texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());bark.map=texture;bark.color.set('#d6c7aa');bark.bumpMap=null;bark.needsUpdate=true;invalidate();
 },undefined,()=>{});
 textureLoader.load(import.meta.env.BASE_URL+'textures/oak-normal.jpg',texture=>{
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());bark.normalMap=texture;bark.normalScale.set(.65,.65);bark.needsUpdate=true;invalidate();
 },undefined,()=>{});
 new HDRLoader().setDataType(THREE.FloatType).load(import.meta.env.BASE_URL+'textures/daylight-sky.hdr',texture=>{
  const pixels=texture.image.data;for(let i=0;i<pixels.length;i+=4){const blue=Math.max(0,Math.min(1,(pixels[i+2]-pixels[i])/(pixels[i+2]+.01)));pixels[i]*=1-.6*blue;pixels[i+1]*=1-.2*blue;}
  texture.needsUpdate=true;texture.mapping=THREE.EquirectangularReflectionMapping;scene.background=texture;scene.backgroundIntensity=.85;scene.backgroundRotation.y=1.9;sky.visible=false;invalidate();
 },undefined,()=>{});
 const woodGroups=Array.from({length:7},()=>[]);
 // Swept sections use continuous, fluted profiles; texture UVs follow the grain.
 function branch(points,r0,r1,index=6,detail=1,flare=0){
  const curve=new THREE.CatmullRomCurve3(points),length=curve.getLength();
  const segments=Math.max(8,Math.ceil(length*3*detail)),sides=r0>.6?24:r0>.16?14:7,frames=curve.computeFrenetFrames(segments,false);
  const positions=[],colors=[],uv=[],indices=[];
  for(let j=0;j<=segments;j++){const t=j/segments,p=curve.getPointAt(t);const base=r0*Math.pow(1-t,.86)+r1*t;
   for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2;const flute=Math.sin(a*6+t*5)*.07+Math.sin(a*13-t*6)*.025;const rootFlare=flare*Math.exp(-t*18)*(1+.4*Math.sin(a*5));
    const radius=base*(1+flute)+rootFlare;
    const v=p.clone().addScaledVector(frames.normals[j],Math.cos(a)*radius).addScaledVector(frames.binormals[j],Math.sin(a)*radius);
    positions.push(v.x,v.y,v.z);uv.push(k/sides*Math.max(.4,r0*1.3),t*length*.22);
    const shade=.88+.06*Math.sin(a*6+t*4)+.025*Math.sin(a*21);colors.push(shade,shade,shade*.98);
    if(j<segments&&k<sides){const b=j*(sides+1)+k,n=b+sides+1;indices.push(b,b+1,n,b+1,n+1,n);}
   }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();woodGroups[index].push(g);return curve;
 }
 const groundHeight=(x,z)=>.14*Math.sin(x*.45)*Math.cos(z*.36)+.48*Math.exp(-(x*x+z*z)/90)-.3;
 const trunk=branch([V(0,.15,0),V(-.5,2,.1),V(.1,4,-.25),V(-.38,6.3,.16),V(.2,8.4,-.2),V(-.8,11.3,.1),V(-.3,13.7,-.4)],1.65,.15,6,1.5,.62);
 // Buttress roots enter the trunk above ground and taper into the terrain.
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2+.15*rand(),len=4.6+rand()*3.3,dx=Math.cos(a),dz=Math.sin(a),bend=.2+rand()*.3;
  const root=branch([V(dx*.55,1.7+rand()*.85,dz*.55),V(dx*1.25,1.15,dz*1.25),V(dx*2.6,.58,dz*2.6),V(dx*len*.7+dz*bend,groundHeight(dx*len*.7,dz*len*.7)+.15,dz*len*.7-dx*bend),V(dx*len,groundHeight(dx*len,dz*len)+.018,dz*len)],.56+rand()*.17,.025,6,1.2);
  if(i%2===0){const p=root.getPointAt(.62),ex=dx*len*.78+dz*1.6,ez=dz*len*.78-dx*1.6;branch([p,p.clone().add(V(dz*.65,-.13,-dx*.65)),V(ex,groundHeight(ex,ez)+.015,ez)],.13,.014);}
 }
 const configs=[
  {a:2.7,r:9.5,y:9.7,start:.39}, {a:3.75,r:7.3,y:12.2,start:.56},
  {a:5.1,r:9.5,y:10.3,start:.43}, {a:.05,r:10.4,y:9.1,start:.36},
  {a:1.1,r:5.3,y:14.1,start:.69}, {a:1.95,r:8.8,y:11.5,start:.52}
 ];
 const foliage=[],anchors=[],labels=[],pickables=[];
 const leaf=new THREE.BufferGeometry();
 leaf.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.24,.055,.28,-.35,.08,.64,0,.015,1.2,.35,.08,.64,.24,.055,.28,0,.15,.57],3));
 leaf.setAttribute('color',new THREE.Float32BufferAttribute([.65,.75,.55,.78,.87,.64,.88,.95,.77,.65,.8,.5,.88,.95,.77,.78,.87,.64,1,1,.87],3));
 leaf.setIndex([0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6]);leaf.computeVertexNormals();
 const dummy=new THREE.Object3D(),color=new THREE.Color();
 configs.forEach((cfg,i)=>{
  const direction=V(Math.cos(cfg.a),0,Math.sin(cfg.a)),side=V(-direction.z,0,direction.x);
  const origin=trunk.getPointAt(cfg.start),end=direction.clone().multiplyScalar(cfg.r);end.y=cfg.y;
  const bend=origin.clone().lerp(end,.48).add(V(0,-.45,0)).addScaledVector(side,i%2===0?1:-.7);
  const main=branch([origin,origin.clone().lerp(bend,.4).add(V(0,.8,0)),bend,end.clone().addScaledVector(direction,-1.2).add(V(0,-.6,0)),end],.68,.14,i,1.15);
  const crowns=[];
  for(let j=0;j<16;j++){
   const u=.28+j*.042,p=main.getPointAt(u);
   const angle=cfg.a+(rand()-.5)*1.2,radial=i===4?2.1+rand()*6.5:3.5+rand()*8.5;
   const tip=V(Math.cos(angle)*radial,11.3+Math.sqrt(Math.max(.08,1-radial*radial/169))*5.6-rand()*3.1,Math.sin(angle)*radial);
   const mid=p.clone().lerp(tip,.48).add(V(0,-.4,0));
   const secondary=branch([p,mid,tip],.15+(1-u)*.25,.037,i);
   for(let k=0;k<4;k++){const angle=k/4*Math.PI*2+rand()*.5;const fork=secondary.getPointAt(.44+k*.16);
    const tip2=fork.clone().add(V(Math.cos(angle)*(1+rand()*.85),.45+rand()*.8,Math.sin(angle)*(1+rand()*.85)));
    branch([fork,fork.clone().lerp(tip2,.65),tip2],.043,.008,i,.7);
    crowns.push({p:tip2,r:1.12+rand()*.38});
   }
   crowns.push({p:tip,r:1.3});
  }
  if(i===4){for(let j=0;j<12;j++){const a=rand()*Math.PI*2,p=V(Math.cos(a)*(1+rand()*2.8),13.7+rand()*2.1,Math.sin(a)*(1+rand()*2.8));branch([trunk.getPointAt(.82),p.clone().add(V(0,-.7,0)),p],.09,.016,i);crowns.push({p,r:1.25});}}
  const perCrown=255,material=new THREE.MeshStandardMaterial({color:'#dce5ac',vertexColors:true,roughness:.78,side:THREE.DoubleSide,emissive:'#243009',emissiveIntensity:.1});
  const leaves=new THREE.InstancedMesh(leaf,material,crowns.length*perCrown);let n=0;
  crowns.forEach(({p,r})=>{for(let k=0;k<perCrown;k++){
   const a=rand()*Math.PI*2,u=rand()*2-1,rr=Math.cbrt(rand()),s=Math.sqrt(1-u*u);
   dummy.position.copy(p).add(V(Math.cos(a)*s*rr*r,u*rr*r*.63,Math.sin(a)*s*rr*r));
   dummy.rotation.set((rand()-.5)*1.5,rand()*Math.PI*2,(rand()-.5)*1.3);
   const size=.13+rand()*.16;dummy.scale.set(size*(.75+rand()*.45),size,size);dummy.updateMatrix();leaves.setMatrixAt(n,dummy.matrix);
   color.setHSL(.205+rand()*.095,.3+rand()*.32,.095+rand()*.19);leaves.setColorAt(n++,color);
  }});
  leaves.scale.set(1.16,1.08,1.16);leaves.castShadow=true;leaves.receiveShadow=true;leaves.userData.index=i;scene.add(leaves);pickables.push(leaves);foliage.push(material);
  anchors.push(end.clone().add(V(0,-.1,0)).multiply(V(1.16,1.08,1.16)));
  const label=document.createElement('button');label.className='tree-label';label.dataset.short=['Nhân sự','Marketing','Kinh doanh','Vận hành','Tài chính','Pháp chế'][i];label.innerHTML='<b>0'+(i+1)+'</b><span>'+departments[i].name+'</span><span class="label-arrow">↗</span>';label.setAttribute('aria-label','Khám phá '+departments[i].name);label.onclick=()=>select(i);labelsHost.append(label);labels.push(label);
 });
 // Aged branch stubs remain attached to the main trunk.
 const stub=trunk.getPointAt(.34);branch([stub,stub.clone().add(V(-1.2,.2,.6)),stub.clone().add(V(-1.7,.6,.8))],.29,.09);
 woodGroups.forEach((geometries,i)=>{const g=mergeGeometries(geometries);const mesh=new THREE.Mesh(g,bark);mesh.scale.set(1.16,1.08,1.16);mesh.castShadow=true;mesh.receiveShadow=true;if(i<6){mesh.userData.index=i;pickables.push(mesh);}scene.add(mesh);geometries.forEach(g=>g.dispose());});
 // Uneven woodland floor, with no pedestal separating the roots from the world.
 const terrain=new THREE.PlaneGeometry(220,220,130,130);terrain.rotateX(-Math.PI/2);const positions=terrain.attributes.position,groundColors=[];
 for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,groundHeight(x,z));const c=new THREE.Color().setHSL(.2+rand()*.035,.26+rand()*.13,.065+rand()*.025);groundColors.push(c.r,c.g,c.b);}
 terrain.setAttribute('color',new THREE.Float32BufferAttribute(groundColors,3));terrain.computeVertexNormals();
 const ground=new THREE.Mesh(terrain,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;scene.add(ground);
 const rockGeo=new THREE.DodecahedronGeometry(1,1),rockMat=new THREE.MeshStandardMaterial({color:'#747965',roughness:1});
 const rocks=new THREE.InstancedMesh(rockGeo,rockMat,55);
 for(let i=0;i<55;i++){const a=rand()*7,r=4+rand()*12,x=Math.cos(a)*r,z=Math.sin(a)*r;dummy.position.set(x,groundHeight(x,z),z);dummy.rotation.set(rand(),rand()*6,rand());const size=.13+rand()*.5;dummy.scale.set(size*1.3,size*.5,size);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);
 // Fern-like ground foliage establishes a smaller scale around the buttress roots.
 const grassGeometry=new THREE.BufferGeometry();grassGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.025,0,0,.025,0,0,-.008,.5,.025,.026,.5,.025,.07,1,.07],3));grassGeometry.setIndex([0,1,2,1,3,2,2,3,4]);grassGeometry.computeVertexNormals();
 const understory=new THREE.InstancedMesh(grassGeometry,new THREE.MeshStandardMaterial({color:'#69813c',side:THREE.DoubleSide,roughness:1}),17000);
 for(let i=0;i<17000;i++){const a=rand()*Math.PI*2,r=2.8+Math.pow(rand(),.6)*27,x=Math.cos(a)*r,z=Math.sin(a)*r;dummy.position.set(x,groundHeight(x,z),z);dummy.rotation.set((rand()-.5)*.35,rand()*6,(rand()-.5)*.35);const size=.12+rand()*.38;dummy.scale.set(1,size,1);dummy.updateMatrix();understory.setMatrixAt(i,dummy.matrix);}understory.receiveShadow=true;scene.add(understory);
 // Layered hills encircle the clearing, so orbiting never reveals a flat backdrop.
 const hillVertices=[],hillColors=[],hillIndices=[],angular=200,rings=30;
 for(let ring=0;ring<=rings;ring++)for(let j=0;j<=angular;j++){
  const a=j/angular*Math.PI*2,r=43+ring/rings*147,peak=7+Math.sin(a*5)*2+Math.sin(a*11)*2+Math.sin(a*23)*.8;
  const height=-.5+peak*Math.exp(-Math.pow((r-105-Math.sin(a*7)*14)/37,2))+Math.sin(a*17+r*.12)*1.2*Math.sin(ring/rings*Math.PI);
  hillVertices.push(Math.cos(a)*r,height,Math.sin(a)*r);
  const c=new THREE.Color().setHSL(.24+ring/rings*.05,.24,.075+ring/rings*.07);hillColors.push(c.r,c.g,c.b);
  if(ring<rings&&j<angular){const b=ring*(angular+1)+j,n=b+angular+1;hillIndices.push(b,b+1,n,b+1,n+1,n);}
 }
 const hills=new THREE.BufferGeometry();hills.setAttribute('position',new THREE.Float32BufferAttribute(hillVertices,3));hills.setAttribute('color',new THREE.Float32BufferAttribute(hillColors,3));hills.setIndex(hillIndices);hills.computeVertexNormals();scene.add(new THREE.Mesh(hills,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})));
 let running=false,visible=true,tween=null,framesLeft=0,renderedFrames=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),projection=new THREE.Vector3();
 function positionLabels(){
  const w=wrap.clientWidth,h=wrap.clientHeight,placed=[];
  anchors.forEach((anchor,i)=>{projection.copy(anchor).project(camera);const label=labels[i],lw=label.offsetWidth||185;
   let x=THREE.MathUtils.clamp((projection.x*.5+.5)*w,lw/2+16,w-lw/2-16);
   let y=THREE.MathUtils.clamp((-projection.y*.5+.5)*h,w<760?130:170,h-155);
   for(let pass=0;pass<3;pass++)for(const p of placed)if(Math.abs(x-p.x)<(lw+p.w)/2+15&&Math.abs(y-p.y)<50)y=p.y+50;
   y=Math.min(y,h-110);placed.push({x,y,w:lw});label.style.left=x+'px';label.style.top=y+'px';label.style.visibility=projection.z>1?'hidden':'visible';
  });
 }
 function render(now){
  if(!visible||document.hidden){running=false;return;}
  if(tween){const t=Math.min(1,(now-tween.start)/tween.duration),e=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.to,e);controls.target.lerpVectors(tween.lookFrom,tween.lookTo,e);if(t===1)tween=null;}
  controls.maxPolarAngle=Math.min(1.82,Math.acos(THREE.MathUtils.clamp((1.8-controls.target.y)/camera.position.distanceTo(controls.target),-1,1)));
  controls.update();positionLabels();renderer.render(scene,camera);renderedFrames++;
  if(tween||framesLeft-->0)requestAnimationFrame(render);else running=false;
 }
 function invalidate(n=30){framesLeft=Math.max(framesLeft,n);if(!running&&visible&&!document.hidden){running=true;requestAnimationFrame(render);}}
 controls.addEventListener('change',()=>invalidate(2));controls.addEventListener('start',()=>{tween=null;invalidate();});
 function move(to,look){tween={from:camera.position.clone(),to,lookFrom:controls.target.clone(),lookTo:look,start:performance.now(),duration:reduced.matches?1:1100};invalidate(55);}
 function focus(i){
  labels.forEach((l,j)=>{l.classList.toggle('selected',i===j);l.setAttribute('aria-pressed',String(i===j));});foliage.forEach((m,j)=>{m.emissive.setHex(i===j?0x344508:0x243009);m.emissiveIntensity=i===j?.2:.1;});
  const p=anchors[i],direction=V(p.x,0,p.z).normalize();move(V(direction.x*36,6,direction.z*36),V(p.x*.23,9,p.z*.23));
 }
 function reset(){labels.forEach(l=>{l.classList.remove('selected');l.setAttribute('aria-pressed','false');});foliage.forEach(m=>{m.emissive.setHex(0x243009);m.emissiveIntensity=.1;});move(overview.clone(),target.clone());}
 function resize(){
  if(!wrap.clientWidth||!wrap.clientHeight)return;const aspect=wrap.clientWidth/wrap.clientHeight;
  camera.aspect=aspect;camera.fov=aspect<.75?50:aspect<1.15?43:38;camera.updateProjectionMatrix();renderer.setSize(wrap.clientWidth,wrap.clientHeight);invalidate();
 }
 new ResizeObserver(resize).observe(wrap);resize();
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickables)[0];if(hit)select(hit.object.userData.index);});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.querySelector('#scene-status').textContent='Cây 3D tạm gián đoạn. Bạn có thể chọn phòng ban bên dưới.';host.querySelector('#scene-status').hidden=false;});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)invalidate();});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)invalidate();},{threshold:.01}).observe(host);
 host.querySelector('#scene-status').hidden=true;
 return {focus,reset,zoom(f){tween=null;const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*f,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);invalidate();},refresh:resize,getState:()=>({position:camera.position.toArray(),target:controls.target.toArray(),frames:renderedFrames,running,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles})};
}
