import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sphere = new THREE.SphereGeometry(1, 16, 12);
const animalMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .82 });

/** Original articulated models: smooth silhouettes and vertex-painted details. */
const birdSphere = new THREE.SphereGeometry(1, 10, 6);
const birdMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });

function rigBuilder(partSphere = sphere, material = animalMaterial) {
  const parts = [], bones = [], named = {};
  function bone(name, point, parent = null) {
    const b = new THREE.Bone();
    b.name = name;
    b.position.copy(point);
    if (parent) { parent.add(b); b.position.sub(parent.userData.bindPoint); }
    b.userData.bindPoint = point.clone();
    b.userData.index = bones.length;
    bones.push(b); named[name] = b;
    return b;
  }
  const root = bone('root', V());
  function add(geo, pigment, joint, position = V(), scale = V(1, 1, 1), rotation = null, grain = false) {
    const g = geo.clone();
    // All parts use vertex colors; normalize attributes for merged polygon wings.
    g.deleteAttribute('uv');
    g.scale(scale.x, scale.y, scale.z);
    if (rotation) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(rotation));
    g.translate(position.x, position.y, position.z);
    const colors = [], skinIndices = [], skinWeights = [], c = new THREE.Color(pigment);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const n = grain ? .94 + .08 * Math.sin(pos.getY(i) * 80 + Math.sin(pos.getX(i) * 37) + pos.getZ(i) * 59) : 1;
      colors.push(c.r * n, c.g * n, c.b * n);
      skinIndices.push(joint.userData.index, 0, 0, 0);
      skinWeights.push(1, 0, 0, 0);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
    parts.push(g);
  }
  function ellipsoid(p, size, color, bone, rotation = null, grain = false) {
    add(partSphere, color, bone, V(...p), V(...size), rotation, grain);
  }
  function tube(points, radius, color, joint) {
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => V(...p))), 10, radius, 5, false);
    add(g, color, joint); g.dispose();
  }
  function finish(name) {
    const geometry = mergeGeometries(parts);
    parts.forEach(g => g.dispose());
    const mesh = new THREE.SkinnedMesh(geometry, material);
    mesh.add(root);
    mesh.bind(new THREE.Skeleton(bones));
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    const group = new THREE.Group();
    group.name = name;
    group.add(mesh);
    const rest = Object.fromEntries(Object.entries(named).map(([key, b]) => [key, b.position.clone()]));
    return { group, mesh, bones: named, rest };
  }
  return { root, bone, add, ellipsoid, tube, finish };
}

export function createSquirrel(index) {
  const b = rigBuilder();
  const chest = b.bone('chest', V(0, .40, 0), b.root);
  const head = b.bone('head', V(0, 1.02, .13), chest);
  const tail = b.bone('tail', V(0, .29, -.18), chest);
  const armL = b.bone('armL', V(-.21, .77, .1), chest);
  const armR = b.bone('armR', V(.21, .77, .1), chest);
  const legL = b.bone('legL', V(-.19, .25, -.03), b.root);
  const legR = b.bone('legR', V(.19, .25, -.03), b.root);
  const nut = b.bone('nut', V(0, .84, .365), chest);
  const fur = ['#9b4724', '#a3532a', '#864528'][index % 3];
  const light = '#bf7138', cream = '#e7c694', dark = '#62321e';

  b.ellipsoid([0,.61,0], [.245,.39,.235], fur, chest, null, true);
  b.ellipsoid([0,.63,.182], [.174,.285,.088], cream, chest);
  b.ellipsoid([0,1.035,.155], [.235,.22,.235], fur, head, null, true);
  b.ellipsoid([-.078,.977,.337], [.108,.083,.104], '#e5c28e', head);
  b.ellipsoid([.078,.977,.337], [.108,.083,.104], '#e5c28e', head);
  b.ellipsoid([0,1.01,.424], [.046,.033,.035], '#261812', head);
  b.tube([[0,.98,.421],[0,.955,.421],[-.035,.951,.41]],.007,dark,head);
  for (const side of [-1,1]) {
    b.ellipsoid([side*.184,1.086,.282],[.058,.067,.042],'#321c12',head);
    b.ellipsoid([side*.198,1.088,.309],[.032,.043,.019],'#110e0a',head);
    b.ellipsoid([side*.19,1.107,.325],[.013,.015,.008],'#fff5d9',head);
    b.ellipsoid([side*.15,1.249,.10],[.079,.143,.064],fur,head,new THREE.Euler(0,0,-side*.19),true);
    b.ellipsoid([side*.154,1.264,.146],[.043,.088,.015],'#d39b6c',head);
    b.ellipsoid([side*.156,1.375,.095],[.028,.067,.03],dark,head);
    const arm = side < 0 ? armL : armR, leg = side < 0 ? legL : legR;
    b.ellipsoid([side*.208,.698,.177],[.079,.145,.088],fur,arm,new THREE.Euler(-.42,0,side*.18),true);
    b.ellipsoid([side*.12,.736,.287],[.064,.075,.123],light,arm,new THREE.Euler(-.6,0,-side*.35));
    b.ellipsoid([side*.075,.815,.371],[.057,.064,.066],dark,arm);
    for(let digit=0;digit<3;digit++) b.ellipsoid([side*(.05+digit*.019),.852,.402],[.011,.032,.013],cream,arm);
    b.ellipsoid([side*.201,.244,-.027],[.165,.225,.183],fur,leg,null,true);
    b.ellipsoid([side*.186,.13,.111],[.085,.136,.11],light,leg);
    b.ellipsoid([side*.184,.052,.246],[.112,.053,.203],dark,leg);
    for(let digit=0;digit<3;digit++) b.ellipsoid([side*.184+(digit-1)*.047,.048,.408],[.018,.022,.052],'#d2a16c',leg);
    for(let whisker=0;whisker<2;whisker++) b.tube([[side*.06,.975,.404],[side*.18,.968+whisker*.014,.415],[side*.28,.95+whisker*.039,.40]],.0035,'#e3ca9f',head);
  }
  const tailCurve = new THREE.CatmullRomCurve3([
    V(0,.28,-.15),V(0,.35,-.46),V(.03,.66,-.68),V(.045,1.07,-.63),V(.04,1.37,-.43),V(.01,1.43,-.20)
  ]);
  const tailGeo = new THREE.TubeGeometry(tailCurve, 26, 1, 12, false);
  const tailPos = tailGeo.attributes.position;
  for (let i = 0; i < tailPos.count; i++) {
    const t = Math.floor(i / 13) / 26;
    const center = tailCurve.getPointAt(t);
    const radius = .045 + .27 * Math.pow(Math.sin(Math.PI * t), .8);
    const p = V(tailPos.getX(i), tailPos.getY(i), tailPos.getZ(i)).sub(center).multiplyScalar(radius).add(center);
    tailPos.setXYZ(i,p.x,p.y,p.z);
  }
  tailGeo.computeVertexNormals();
  b.add(tailGeo,fur,tail,V(),V(1,1,1),null,true);
  tailGeo.dispose();
  // Small tapered tufts break the tail silhouette without alpha/fur textures.
  for(let i=0;i<35;i++){
    const t=.14+i/35*.74, center=tailCurve.getPointAt(t), a=i*2.39996;
    const radius=.045+.27*Math.pow(Math.sin(Math.PI*t),.8);
    const p=center.clone().add(V(Math.cos(a)*radius*.82,Math.sin(a)*radius*.25,Math.sin(a)*radius*.67));
    b.ellipsoid(p.toArray(),[.055,.115,.048],i%3===0?'#c47b3f':fur,tail,new THREE.Euler(.3,0,.4*Math.sin(a)),true);
  }
  b.ellipsoid([0,.835,.368],[.080,.105,.074],'#a3652d',nut);
  b.ellipsoid([0,.905,.368],[.085,.048,.078],'#5a3920',nut);
  b.ellipsoid([0,.958,.366],[.014,.029,.014],'#5a3920',nut);

  const rig = b.finish('squirrel-' + (index+1));
  let runWeight = 0, climbWeight = 0;
  rig.pose = (seconds, mode, delta, carrying = true) => {
    const k = Math.min(1,delta*13);
    runWeight = THREE.MathUtils.lerp(runWeight,mode==='run'?1:0,k);
    climbWeight = THREE.MathUtils.lerp(climbWeight,mode==='climb'||mode==='stash'?1:0,k);
    const bob = Math.sin(seconds*5.2+index*2.4), gait = Math.sin(seconds*19+index*1.7);
    const stand = 1-runWeight;
    chest.position.copy(rig.rest.chest);
    chest.position.y -= runWeight*.12;
    chest.rotation.set(runWeight*.94 + climbWeight*.09,0,.018*Math.sin(seconds*2.3));
    head.rotation.set(-.035 + stand*(mode==='eat'?.075*bob:Math.sin(seconds*.9+index)*.07),Math.sin(seconds*.73+index)*.11*stand,0);
    tail.rotation.set(-runWeight*.7 + Math.sin(seconds*1.8+index)*.06,Math.sin(seconds*2.0+index)*.10,Math.sin(seconds*1.3)*.035);
    for(const [joint,side] of [[armL,-1],[armR,1]]){
      joint.position.copy(rig.rest[joint.name]);
      joint.position.y += (mode==='eat'?.017*bob:0);
      joint.rotation.set(-runWeight*.7 + (runWeight*.75+climbWeight*.45)*gait*side,0,side*(runWeight*.10+climbWeight*.25));
      if(mode==='stash') { joint.rotation.x=-.28; joint.position.z+=.09; joint.position.y+=.05; }
    }
    for(const [joint,side] of [[legL,-1],[legR,1]]){
      joint.rotation.set((runWeight*.55+climbWeight*.38)*-gait*side,0,side*climbWeight*.15);
    }
    nut.position.copy(rig.rest.nut);
    nut.position.y += mode==='eat'?.017*bob:0;
    if(mode==='stash') { nut.position.y+=.05; nut.position.z+=.09; }
    nut.scale.setScalar(carrying?1:.001);
    b.root.position.y = runWeight*Math.abs(gait)*.065;
  };
  return rig;
}

export function createBird(index=0) {
  const b = rigBuilder(birdSphere,birdMaterial);
  const torso = b.bone('torso', V(0,.24,0), b.root);
  const head = b.bone('head', V(0,.41,.23), torso);
  const wingL = b.bone('wingL', V(-.12,.28,0), torso);
  const wingR = b.bone('wingR', V(.12,.28,0), torso);
  const tail = b.bone('tail', V(0,.23,-.23), torso);
  const feet = b.bone('feet', V(0,.13,.065), b.root);
  const coat=['#516875','#647b83','#707d72'][index%3];
  b.ellipsoid([0,.245,-.025],[.175,.185,.29],coat,torso);
  b.ellipsoid([0,.235,.155],[.133,.14,.165],'#d8b077',torso);
  b.ellipsoid([0,.16,.045],[.123,.092,.21],'#eadac0',torso);
  b.ellipsoid([0,.415,.225],[.145,.137,.151],coat,head);
  b.ellipsoid([0,.362,.315],[.102,.072,.086],'#d3a76f',head);
  const beak=new THREE.ConeGeometry(.032,.14,6);beak.rotateX(Math.PI/2);
  b.add(beak,'#574637',head,V(0,.405,.411));beak.dispose();
  const eye=new THREE.SphereGeometry(1,6,4);
  function segment(from,to,radius,color,joint){
    const a=V(...from),c=V(...to),d=c.clone().sub(a);
    const geo=new THREE.CylinderGeometry(radius*.75,radius,d.length(),5,1);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),d.normalize()));
    b.add(geo,color,joint,a.add(c).multiplyScalar(.5));geo.dispose();
  }
  for(const side of [-1,1]){
    b.add(eye,'#18292c',head,V(side*.123,.448,.292),V(.029,.033,.022));
    b.add(eye,'#fff4d7',head,V(side*.134,.462,.307),V(.008,.009,.006));
    const wing=side<0?wingL:wingR;
    b.ellipsoid([side*.28,.281,-.075],[.20,.044,.15],'#526b76',wing,new THREE.Euler(0,side*.20,0));
    // Four broad, tapered feathers preserve a readable silhouette at low cost.
    for(let f=0;f<4;f++){
      b.ellipsoid([side*(.40+f*.092),.275,-.10-f*.052],
        [.155-f*.017,.016,.13-f*.009],f%2?'#647c87':'#3b5362',wing,
        new THREE.Euler(0,side*(.35+f*.12),0));
    }
    segment([side*.067,.14,.065],[side*.067,.035,.11],.010,'#926c45',feet);
    for(let toe=-1;toe<=1;toe++)
      segment([side*.067,.035,.11],[side*.067+toe*.028,.016,.205-Math.abs(toe)*.015],.007,'#87623e',feet);
    segment([side*.067,.035,.11],[side*.067,.022,.048],.006,'#87623e',feet);
  }
  eye.dispose();
  for(let f=0;f<3;f++)
    b.ellipsoid([(f-1)*.044,.238,-.403],[.044,.018,.19],'#3c5360',tail,new THREE.Euler(-.08,(f-1)*.10,0));
  const rig=b.finish('flock-bird-'+(index+1));
  let flight=1;
  rig.pose=(seconds,mode,delta,progress=0)=>{
    const landing=mode==='landing'?THREE.MathUtils.clamp(progress,0,1):0;
    const flying=mode==='fly'||mode==='landing';
    const fold=mode==='landing'?THREE.MathUtils.smoothstep(landing,.58,1):mode==='perched'?1:0;
    flight=THREE.MathUtils.lerp(flight,flying?1-fold:0,Math.min(1,delta*12));
    const phase=seconds*(18+index%3)+index*1.73;
    const flap=Math.sin(phase)*(.68-landing*.38);
    const brake=Math.sin(landing*Math.PI)*.24;
    wingL.rotation.set(0,(1-flight)*-1.24,flight*(flap+brake)+(1-flight)*.37);
    wingR.rotation.set(0,(1-flight)*1.24,-flight*(flap+brake)-(1-flight)*.37);
    const feetOut=mode==='landing'?THREE.MathUtils.smoothstep(landing,0,.65):mode==='perched'?1:0;
    feet.rotation.x=-(1-feetOut)*1.0;
    feet.position.copy(rig.rest.feet);feet.position.y+=(1-feetOut)*.055;
    tail.rotation.x=landing*.23+(1-flight)*Math.sin(seconds*1.1+index)*.035;
    tail.scale.x=1+Math.sin(landing*Math.PI)*.32;
    head.rotation.set(landing*.10,(1-flight)*Math.sin(seconds*.8+index)*.10,0);
    torso.position.copy(rig.rest.torso);
    // Brief body compression on contact; the feet remain anchored on the branch.
    const contact=mode==='perched'&&progress>=0&&progress<.32?Math.sin(progress/.32*Math.PI)*.023:0;
    torso.position.y+=(1-flight)*Math.sin(seconds*2.1+index)*.005-contact;
  };
  return rig;
}
