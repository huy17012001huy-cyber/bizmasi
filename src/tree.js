import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { addRootGarden } from './root-garden.js';
import { createWildlife } from './wildlife.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;

/**
 * A flowering broadleaf tree. Crown placement follows concentric botanical
 * tiers; every leaf grows from a shoot, and every shoot joins a woody branch.
 * All geometry is local and deterministic. The old tree lives in /archives.
 */
export function createTree(host, departments, select) {
  const wrap = host.querySelector('#canvas-wrap');
  const labelsHost = host.querySelector('#labels');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  wrap.append(renderer.domElement);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Cây tri thức nở hoa 3D. Kéo để xoay, phóng to và chọn nhánh phòng ban.');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c8dfdf');
  scene.fog = new THREE.FogExp2('#e4ead3', .0065);
  const camera = new THREE.PerspectiveCamera(36, 1, .2, 500);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .09;
  controls.enablePan = false;
  controls.minDistance = 20;
  controls.maxDistance = 65;
  controls.minPolarAngle = .88;
  controls.maxPolarAngle = 1.73;
  const overview = V(0, 9.6, 35);
  const target = V(0, 9.2, 0);
  camera.position.copy(overview);
  controls.target.copy(target);

  let running = false, visible = true, tween = null, framesLeft = 0, renderedFrames = 0;
  let lastFrame = 0, labelsDirty = true, simulationTime = 0;
  const narrowDevice = matchMedia('(max-width: 760px)').matches;
  let frameInterval = narrowDevice ? 1000 / 30 : 1000 / 60;
  let qualityLevel = 0, qualityWindowTime = 0, qualityWindowFrames = 0, measuredFps = null;
  const canopyMeshes = [];
  let currentLeafScale = 1;
  let seed = 81026;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const between = (a, b) => a + rand() * (b - a);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  // A softly graded sky, with distant cloud banks and warm morning light.
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(350, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        zenith: { value: new THREE.Color('#6eabc9') },
        horizon: { value: new THREE.Color('#f1edcf') }
      },
      vertexShader: 'varying vec3 vWorld; void main(){vWorld=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `
        varying vec3 vWorld;
        uniform vec3 zenith;
        uniform vec3 horizon;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){
          vec2 i=floor(p), f=fract(p);f=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
        }
        void main(){
          vec3 d=normalize(vWorld);
          float elevation=max(d.y,0.);
          vec3 c=mix(horizon,zenith,smoothstep(-.16,.42,d.y));
          vec2 uv=vec2(atan(d.z,d.x)*3.,d.y*13.);
          float n=noise(uv)*.55+noise(uv*2.1)*.28+noise(uv*4.3)*.13;
          float cloud=smoothstep(.46,.76,n)*smoothstep(.0,.08,d.y)*(1.-smoothstep(.35,.75,d.y));
          c=mix(c,vec3(1.,.985,.92),cloud*.62);
          float glow=pow(max(dot(d,normalize(vec3(-.72,.22,.64))),0.),16.);
          c=mix(c,vec3(1.,.93,.70),glow*.32);
          gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    })
  );
  scene.add(sky);
  new HDRLoader().setDataType(THREE.FloatType).load(import.meta.env.BASE_URL + 'textures/daylight-sky.hdr', texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.backgroundIntensity = .82;
    scene.backgroundRotation.y = 1.9;
    sky.visible = false;
    invalidate();
  }, undefined, () => {});

  scene.add(new THREE.HemisphereLight('#eff8ec', '#a4a078', 1.85));
  const sunlight = new THREE.DirectionalLight('#fff0c6', 2.8);
  sunlight.position.set(-16, 26, 18);
  sunlight.target.position.set(0, 8, 0);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunlight.shadow.camera, { left: -16, right: 16, top: 21, bottom: -15, near: 1, far: 65 });
  sunlight.shadow.bias = -.0003;
  sunlight.shadow.normalBias = .065;
  sunlight.shadow.radius = 3;
  scene.add(sunlight, sunlight.target);
  const fill = new THREE.DirectionalLight('#effbe0', .85);
  fill.position.set(12, 12, 25);
  scene.add(fill);
  const backlight = new THREE.DirectionalLight('#e6f3ab', 1.65);
  backlight.position.set(0, 20, -12);
  scene.add(backlight);

  const bark = new THREE.MeshStandardMaterial({
    color: '#ac9879', roughness: .98, vertexColors: true
  });
  const loader = new THREE.TextureLoader();
  loader.load(import.meta.env.BASE_URL + 'textures/oak-color.jpg', map => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    bark.map = map;
    bark.color.set('#e4d0ae');
    bark.needsUpdate = true;
    invalidate();
  });
  loader.load(import.meta.env.BASE_URL + 'textures/oak-normal.jpg', map => {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    bark.normalMap = map;
    bark.normalScale.set(.55, .55);
    bark.needsUpdate = true;
    invalidate();
  });

  const wood = Array.from({ length: 7 }, () => []);
  const pickables = [];
  const leafMaterials = [];
  function branch(points, startRadius, endRadius, sector = 6, root = false) {
    const curve = new THREE.CatmullRomCurve3(points);
    const length = curve.getLength();
    const segments = Math.max(5, Math.ceil(length * 3.2));
    const sides = startRadius > .55 ? 20 : startRadius > .1 ? 10 : 5;
    const frames = curve.computeFrenetFrames(segments, false);
    const positions = [], normalsColor = [], uvs = [], indices = [];
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const p = curve.getPointAt(t);
      const taper = startRadius * Math.pow(1 - t, 1.08) + endRadius * t;
      for (let k = 0; k <= sides; k++) {
        const a = k / sides * TAU;
        const fluting = Math.sin(a * 7 + t * 2) * .065 + Math.cos(a * 11 - t * 3) * .025;
        const flare = root ? .43 * Math.exp(-t * 12) * (1 + Math.cos(a * 6) * .45) : 0;
        const radius = taper * (1 + fluting) + flare;
        const point = p.clone().addScaledVector(frames.normals[j], Math.cos(a) * radius)
          .addScaledVector(frames.binormals[j], Math.sin(a) * radius);
        positions.push(point.x, point.y, point.z);
        uvs.push(k / sides * Math.max(.35, startRadius * 1.5), t * length * .25);
        const shade = .9 + .07 * Math.sin(a * 7 + t * 2);
        normalsColor.push(shade, shade, shade * .98);
        if (j < segments && k < sides) {
          const b = j * (sides + 1) + k, n = b + sides + 1;
          indices.push(b, b + 1, n, b + 1, n + 1, n);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(normalsColor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    wood[sector].push(geo);
    return curve;
  }

  const groundY = (x, z) => .40 * Math.exp(-(x * x + z * z) / 90)
    + .12 * Math.sin(x * .24) * Math.cos(z * .32) - .25;

  // A central, upright trunk. Broad buttress roots establish the ancient scale.
  const trunk = branch([
    V(0, .05, 0), V(-.12, 1.5, .05), V(.05, 3.2, -.06),
    V(-.13, 5.2, .04), V(.15, 8.2, -.1), V(-.18, 11.4, .12), V(.25, 16.3, 0)
  ], 1.48, .12, 6, true);
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * TAU;
    const length = between(3.8, 5.8);
    const dir = V(Math.cos(a), 0, Math.sin(a));
    const side = V(-dir.z, 0, dir.x);
    const end = dir.clone().multiplyScalar(length);
    end.y = groundY(end.x, end.z) - .06;
    const root = branch([
      dir.clone().multiplyScalar(.52).add(V(0, between(1.7, 2.3), 0)),
      dir.clone().multiplyScalar(1.15).add(V(0, 1.0, 0)),
      dir.clone().multiplyScalar(2.5).add(V(0, .37, 0)),
      end.clone().multiplyScalar(.8).addScaledVector(side, between(-.15, .15)).add(V(0, .06, 0)),
      end
    ], between(.38, .57), .01);
    if (i % 2 === 0) {
      const p = root.getPointAt(.6);
      const tip = end.clone().addScaledVector(side, .85);
      tip.y = groundY(tip.x, tip.z) - .03;
      branch([p, p.clone().lerp(tip, .55).add(V(0, .02, 0)), tip], .13, .006);
    }
  }

  // Rounded, cupped leaves with a central fold; no alpha planes.
  function makeLeaf() {
    const positions = [], uvs = [], colors = [], indices = [];
    positions.push(0,.13,.5);uvs.push(.5,.5);colors.push(1,1,.95);
    for (let j=0;j<12;j++) {
      const angle=j/12*TAU, t=(1-Math.cos(angle))*.5;
      positions.push(Math.sin(angle)*.28,.095*Math.sin(t*Math.PI),t);
      uvs.push(.5+Math.sin(angle)*.5,t);
      colors.push(.84+t*.08,.84+t*.08,(.84+t*.08)*.95);
      indices.push(0,j+1,(j+1)%12+1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }
  const leafGeometry = makeLeaf();
  const canopyLeafGeometry = leafGeometry.clone();
  const veinCanvas = document.createElement('canvas');
  veinCanvas.width = 96;
  veinCanvas.height = 192;
  const vein = veinCanvas.getContext('2d');
  vein.fillStyle = '#f5f7e9';
  vein.fillRect(0, 0, 96, 192);
  vein.strokeStyle = '#cdd99e';
  vein.lineWidth = 1.7;
  vein.beginPath(); vein.moveTo(48, 0); vein.lineTo(48, 192); vein.stroke();
  vein.lineWidth = .75;
  vein.strokeStyle = '#dce4b9';
  for (let y = 25; y < 176; y += 22) {
    vein.beginPath(); vein.moveTo(48, y); vein.quadraticCurveTo(26, y + 10, 0, y + 21); vein.stroke();
    vein.beginPath(); vein.moveTo(48, y); vein.quadraticCurveTo(72, y + 10, 96, y + 21); vein.stroke();
  }
  const leafMap = new THREE.CanvasTexture(veinCanvas);
  leafMap.colorSpace = THREE.SRGBColorSpace;

  function makeFlower() {
    const parts = [];
    for (let p = 0; p < 5; p++) {
      const g = new THREE.SphereGeometry(1, 6, 3);
      g.scale(.37, .64, .115);
      g.translate(0, .53, .04);
      g.rotateZ(p / 5 * TAU);
      const colors = [];
      for (let k = 0; k < g.attributes.position.count; k++) colors.push(1, .965, .80);
      g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      parts.push(g);
    }
    const center = new THREE.SphereGeometry(.24, 6, 3);
    center.translate(0, 0, .13);
    const centers = [];
    for (let k = 0; k < center.attributes.position.count; k++) centers.push(.85, .49, .08);
    center.setAttribute('color', new THREE.Float32BufferAttribute(centers, 3));
    parts.push(center);
    const merged = mergeGeometries(parts);
    parts.forEach(g => g.dispose());
    return merged;
  }
  const flowerGeometry = makeFlower();
  const leafInstances = Array.from({ length: 6 }, () => []);
  const flowers = [];
  const leaders = [];

  // Six interlocking branches share a single balanced crown, not six isolated balls.
  for (let i = 0; i < 6; i++) {
    const a = (i + .5) / 6 * TAU;
    const dir = V(Math.cos(a), 0, Math.sin(a));
    const side = V(-dir.z, 0, dir.x);
    const start = trunk.getPointAt(.19 + (i % 2) * .035);
    const low = branch([
      start, dir.clone().multiplyScalar(1.7).add(V(0, 4.6 + i % 2 * .3, 0)),
      dir.clone().multiplyScalar(4.2).addScaledVector(side, .22).add(V(0, 5.8, 0)),
      dir.clone().multiplyScalar(7.3).addScaledVector(side, -.13).add(V(0, 7.0, 0)),
      dir.clone().multiplyScalar(9.6).add(V(0, 9.2, 0))
    ], .68, .085, i);
    const highStart = trunk.getPointAt(.35 + (i % 2) * .05);
    const high = branch([
      highStart, dir.clone().multiplyScalar(1.25).add(V(0, 8.9, 0)),
      dir.clone().multiplyScalar(3.45).addScaledVector(side, -.3).add(V(0, 12.7, 0)),
      dir.clone().multiplyScalar(5.6).add(V(0, 15.1, 0))
    ], .46, .065, i);
    leaders.push({ low, high });
  }

  function growCrown(center, sector) {
    // Each crown has ten airy sprays, with paired leaves along tiny stems.
    for (let j = 0; j < 10; j++) {
      const a = j / 10 * TAU + between(-.2, .2);
      const reach = between(1.0, 1.75);
      const stemStart = center.clone().add(V(0, -.4, 0));
      const tip = center.clone().add(V(Math.cos(a) * reach, between(-.7, 1.1), Math.sin(a) * reach));
      const spray = branch([
        stemStart,
        stemStart.clone().lerp(tip, .5).add(V(0, .2, 0)),
        tip
      ], .023, .003, sector);
      for (let k = 0; k < 7; k++) {
        const t = .26 + k * .105;
        const base = spray.getPointAt(t);
        const tangent = spray.getTangentAt(t);
        const lateral = V(-tangent.z, .12, tangent.x).normalize();
        for (const sign of [-1, 1]) {
          const shootTip = base.clone().addScaledVector(lateral, sign * between(.38, .7))
            .addScaledVector(tangent, .25).add(V(0, between(-.1, .2), 0));
          for (let n = 0; n < 5; n++) {
            const p = base.clone().lerp(shootTip, .20 + n * .17);
            const leafLength = between(.24, .37) * (1 - n * .04);
            leafInstances[sector].push({
              p,
              rotation: [between(-1.1, 1.1), a + sign * 1.0 + between(-.5, .5), between(-.9, .9)],
              size: leafLength,
              hue: between(.215, .285), saturation: between(.48, .70), lightness: between(.12, .24)
            });
          }
        }
      }
      if (j % 3 === 0 && rand() > .2) {
        const bouquet = tip.clone().add(V(0, .08, 0));
        for (let f = 0; f < 4; f++) {
          const fa = f / 4 * TAU;
          flowers.push({
            p: bouquet.clone().add(V(Math.cos(fa) * .18, Math.sin(fa) * .15, between(-.15, .15))),
            rotation: new THREE.Euler(between(-1.2, 1.2), rand() * TAU, rand() * TAU), size: between(.10, .145)
          });
        }
      }
    }
  }

  // Radial tiers define one broad dome, with small irregularities along its edge.
  const tiers = [
    { radius: 1.8, y: 16.5, count: 6 },
    { radius: 4.6, y: 15.6, count: 14 },
    { radius: 7.4, y: 13.7, count: 21 },
    { radius: 9.5, y: 11.6, count: 28 },
    { radius: 10.2, y: 9.3, count: 29 },
    { radius: 9.1, y: 7.2, count: 25 }
  ];
  tiers.forEach((tier, level) => {
    for (let j = 0; j < tier.count; j++) {
      const a = (j + .35 * (level % 2)) / tier.count * TAU;
      const radius = tier.radius + between(-.4, .4);
      const center = V(Math.cos(a) * radius, tier.y + between(-.55, .55), Math.sin(a) * radius * .89);
      const sector = Math.floor(((a + TAU) % TAU) / TAU * 6);
      const leader = level > 2 ? leaders[sector].low : leaders[sector].high;
      const attach = leader.getPointAt(level > 2 ? .68 : .53 + .12 * level);
      const midpoint = attach.clone().lerp(center, .53).add(V(0, -.15, 0));
      branch([attach, midpoint, center.clone().add(V(0, -.4, 0)), center], level > 2 ? .105 : .08, .017, sector);
      growCrown(center, sector);
    }
  });
  // Roosts are spread around all sides and heights, including behind the canopy.
  const birdPerches = [];
  const roostHeights = [5.5,10.8,7.0,13.6,6.2,11.4,8.8,12.5,5.8];
  const roostRadii = [6.6,8.8,10.0,5.9,8.5,7.8,10.5,6.4,8.2];
  for (let i=0;i<9;i++) {
    const angle=(i+.25)/9*TAU, dir=V(Math.cos(angle),0,Math.sin(angle));
    const sector=Math.floor(angle/TAU*6);
    const leader=roostHeights[i]>9?leaders[sector].high:leaders[sector].low;
    const start=leader.getPointAt(.48);
    const roost=dir.clone().multiplyScalar(roostRadii[i]).add(V(0,roostHeights[i],0));
    branch([
      start,start.clone().lerp(roost,.55).add(V(0,-.3,0)),
      roost,roost.clone().addScaledVector(dir,.6).add(V(0,.13,0))
    ],.13,.025,sector);
    roost.x*=1.06;roost.z*=1.06;roost.y+=.07;
    birdPerches.push(roost);
  }

  leafInstances.forEach((instances, sector) => {
    // A deterministic shuffle lets reduced detail sample the whole crown evenly.
    const ordered = [...instances];
    let orderSeed = sector + 701;
    for (let i=ordered.length-1;i>0;i--) {
      orderSeed=(orderSeed*1664525+1013904223)>>>0;
      const j=orderSeed%(i+1);
      [ordered[i],ordered[j]]=[ordered[j],ordered[i]];
    }
    const material = new THREE.MeshLambertMaterial({
      color: '#dce8bf', map: leafMap, vertexColors: true, side: THREE.DoubleSide,
      emissive: '#526c2e', emissiveIntensity: .07
    });
    const leaves = new THREE.InstancedMesh(canopyLeafGeometry, material, instances.length);
    ordered.forEach((leaf, index) => {
      dummy.position.copy(leaf.p);
      dummy.rotation.set(...leaf.rotation);
      dummy.scale.set(leaf.size * between(.87, 1.12), leaf.size, leaf.size);
      dummy.updateMatrix();
      leaves.setMatrixAt(index, dummy.matrix);
      color.setHSL(leaf.hue, leaf.saturation, leaf.lightness);
      leaves.setColorAt(index, color);
    });
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    leaves.userData.fullCount = instances.length;
    canopyMeshes.push(leaves);
    leaves.userData.index = sector;
    leaves.scale.set(1.06, 1, 1.06);
    scene.add(leaves);
    pickables.push(leaves);
    leafMaterials.push(material);
  });
  const blossoms = new THREE.InstancedMesh(flowerGeometry, new THREE.MeshStandardMaterial({
    color: '#fff9df', vertexColors: true, roughness: .7, emissive: '#e8ca83', emissiveIntensity: .08
  }), flowers.length);
  flowers.forEach((flower, i) => {
    dummy.position.copy(flower.p);
    dummy.rotation.copy(flower.rotation);
    dummy.scale.setScalar(flower.size);
    dummy.updateMatrix();
    blossoms.setMatrixAt(i, dummy.matrix);
  });
  blossoms.receiveShadow = true;
  blossoms.scale.set(1.06, 1, 1.06);
  scene.add(blossoms);

  wood.forEach((geometries, sector) => {
    const mesh = new THREE.Mesh(mergeGeometries(geometries), bark);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.scale.set(1.06, 1, 1.06);
    if (sector < 6) {
      mesh.userData.index = sector;
      pickables.push(mesh);
    }
    scene.add(mesh);
    geometries.forEach(g => g.dispose());
  });

  // A sunlit clearing. Earth around the roots gradually gives way to the meadow.
  const terrain = new THREE.PlaneGeometry(240, 240, 150, 150);
  terrain.rotateX(-Math.PI / 2);
  const groundColors = [];
  for (let i = 0; i < terrain.attributes.position.count; i++) {
    const x = terrain.attributes.position.getX(i), z = terrain.attributes.position.getZ(i);
    terrain.attributes.position.setY(i, groundY(x, z));
    const clearing = Math.exp(-(x * x + z * z) / 30);
    color.setHSL(.215 - .075 * clearing, .32 + .03 * clearing, .15 + .022 * Math.sin(x * .4 + z * .6));
    groundColors.push(color.r, color.g, color.b);
  }
  terrain.setAttribute('color', new THREE.Float32BufferAttribute(groundColors, 3));
  terrain.computeVertexNormals();
  const ground = new THREE.Mesh(terrain, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  ground.receiveShadow = true;
  scene.add(ground);

  // Soft ambient contact under the tree, in addition to real branch shadows.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const shadowCtx = shadowCanvas.getContext('2d');
  const radial = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  radial.addColorStop(0, 'rgba(33,46,18,.47)');
  radial.addColorStop(.35, 'rgba(33,46,18,.26)');
  radial.addColorStop(1, 'rgba(33,46,18,0)');
  shadowCtx.fillStyle = radial;
  shadowCtx.fillRect(0, 0, 128, 128);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(20, 17),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = .23;
  scene.add(contact);

  const grassGeo = new THREE.BufferGeometry();
  grassGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    -.028, 0, 0, .028, 0, 0, -.019, .4, .025, .025, .4, .025, .035, .73, .06
  ], 3));
  grassGeo.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
  grassGeo.computeVertexNormals();
  const grasses = new THREE.InstancedMesh(grassGeo, new THREE.MeshLambertMaterial({
    color: '#91a251', side: THREE.DoubleSide
  }), 15000);
  for (let i = 0; i < grasses.count; i++) {
    const a = rand() * TAU, radius = 2.8 + Math.pow(rand(), .6) * 28;
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    dummy.position.set(x, groundY(x, z), z);
    dummy.rotation.set(between(-.12, .12), rand() * TAU, between(-.25, .25));
    dummy.scale.set(1, between(.15, .53), 1);
    dummy.updateMatrix();
    grasses.setMatrixAt(i, dummy.matrix);
    color.setHSL(between(.19, .24), .33, between(.3, .5));
    grasses.setColorAt(i, color);
  }
  grasses.receiveShadow = true;
  scene.add(grasses);

  const meadowFlowers = new THREE.InstancedMesh(flowerGeometry, blossoms.material, 500);
  for (let i = 0; i < meadowFlowers.count; i++) {
    const a = rand() * TAU, r = between(4, 22);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    dummy.position.set(x, groundY(x, z) + between(.10, .26), z);
    dummy.rotation.set(-Math.PI / 2 + between(-.4, .4), 0, rand() * TAU);
    dummy.scale.setScalar(between(.035, .065));
    dummy.updateMatrix();
    meadowFlowers.setMatrixAt(i, dummy.matrix);
  }
  scene.add(meadowFlowers);
  const rootGarden = addRootGarden({ scene, groundY, leafGeometry, flowerGeometry, leafMap, random: rand });

  // Four misted hill layers encircle the scene, so the view works from any angle.
  for (let layer = 0; layer < 4; layer++) {
    const vertices = [], indices = [];
    const segments = 220, radius = 65 + layer * 28;
    for (let j = 0; j <= segments; j++) {
      const a = j / segments * TAU;
      const height = 3.4 + layer * 1.4 + Math.sin(a * 4 + layer) * 1.3 + Math.cos(a * 7 - layer) * .8;
      vertices.push(Math.cos(a) * radius, -2, Math.sin(a) * radius);
      vertices.push(Math.cos(a) * radius, height, Math.sin(a) * radius);
      if (j < segments) {
        const b = j * 2;
        indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
    }
    const hill = new THREE.BufferGeometry();
    hill.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    hill.setIndex(indices);
    hill.computeVertexNormals();
    scene.add(new THREE.Mesh(hill, new THREE.MeshBasicMaterial({
      color: ['#9cad80', '#aab998', '#b7c7ae', '#cbd5c4'][layer], side: THREE.DoubleSide
    })));
  }

  // Each plaque belongs to its actual radial branch. It never slides to a
  // screen edge or another row, and the back of a plaque is not readable.
  const anchorNormals = departments.map((_, i) => {
    const angle = (i + .5) / 6 * TAU;
    return V(Math.cos(angle), 0, Math.sin(angle));
  });
  const anchors = anchorNormals.map((normal, i) => {
    const upper = i % 3 === 1;
    return normal.clone().multiplyScalar(upper ? 7.2 : 10.0).add(V(0, upper ? 14.1 : 10.0, 0));
  });
  const labels = [];
  const shortNames = ['Nhân sự', 'Marketing', 'Kinh doanh', 'Vận hành', 'Tài chính', 'Pháp chế'];
  const marks = ['♧', '◉', '↗', '⚙', '▥', '◇'];
  departments.forEach((department, i) => {
    const label = document.createElement('button');
    label.className = 'tree-label';
    label.dataset.short = shortNames[i];
    label.innerHTML = '<b aria-hidden="true">' + marks[i] + '</b><span>' + department.name + '</span><span class="label-arrow" aria-hidden="true">↗</span>';
    label.setAttribute('aria-label', 'Khám phá ' + department.name);
    label.setAttribute('aria-pressed', 'false');
    label.onclick = () => select(i);
    labelsHost.append(label);
    labels.push(label);
  });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const wildlife = createWildlife(scene, { groundY, perches: birdPerches, camera });
  function setQuality(level) {
    qualityLevel = level;
    const density = [1, .70, .48][level];
    canopyMeshes.forEach(mesh => { mesh.count = Math.floor(mesh.userData.fullCount * density); });
    const leafScale = Math.min(1.38, 1 / Math.sqrt(density));
    const ratio = leafScale / currentLeafScale;
    canopyLeafGeometry.scale(ratio, ratio, ratio);
    currentLeafScale = leafScale;
    canopyMeshes.forEach(mesh => mesh.computeBoundingSphere());
    renderer.setPixelRatio(Math.min(devicePixelRatio, [1.25, .85, .65][level]));
    renderer.setSize(wrap.clientWidth,wrap.clientHeight);
    frameInterval = level || narrowDevice ? 1000/30 : 1000/60;
    renderer.shadowMap.needsUpdate = true;
  }
  setQuality(narrowDevice ? 1 : 0);
  let motionEnabled = !reduced.matches;
  if (!motionEnabled) wildlife.settle();
  const motionButton = document.createElement('button');
  motionButton.id = 'nature-motion';
  motionButton.className = 'nature-motion';
  host.append(motionButton);
  function syncMotionButton() {
    motionButton.textContent = motionEnabled ? 'Ⅱ  Tạm dừng chuyển động' : '▷  Bật chuyển động';
    motionButton.setAttribute('aria-label', motionEnabled ? 'Tạm dừng chuyển động thiên nhiên' : 'Bật chuyển động thiên nhiên');
    motionButton.setAttribute('aria-pressed', String(!motionEnabled));
  }
  syncMotionButton();
  motionButton.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    lastFrame = 0;
    syncMotionButton();
    invalidate();
  });
  reduced.addEventListener('change', () => {
    motionEnabled = !reduced.matches;
    if (!motionEnabled) wildlife.settle();
    lastFrame = 0;
    syncMotionButton();
    invalidate();
  });
  const heldPointers = new Map();
  function disturb() {
    if (motionEnabled && visible && !document.hidden) wildlife.interact();
    invalidate();
  }
  const projection = V();
  const facingVector = V();
  const labelVisibility = new Array(6).fill(false);
  function facesCamera(i) {
    facingVector.copy(camera.position).sub(anchors[i]);
    facingVector.y = 0;
    return facingVector.normalize().dot(anchorNormals[i]) > .18;
  }
  function positionLabels() {
    // Projection must use the new pose, including instant reduced-motion jumps.
    camera.updateMatrixWorld();
    const width = wrap.clientWidth, height = wrap.clientHeight;
    anchors.forEach((anchor, i) => {
      projection.copy(anchor).project(camera);
      const label = labels[i], w = label.offsetWidth || 200;
      const x = (projection.x * .5 + .5) * width;
      const y = (-.5 * projection.y + .5) * height;
      const onScreen = projection.z > -1 && projection.z < 1
        && x > w / 2 + 8 && x < width - w / 2 - 8
        && y > 35 && y < height - 48;
      const shown = onScreen && facesCamera(i);
      label.style.left = x + 'px';
      label.style.top = y + 'px';
      label.style.visibility = shown ? 'visible' : 'hidden';
      label.style.opacity = shown ? '1' : '0';
      label.tabIndex = shown ? 0 : -1;
      label.setAttribute('aria-hidden', String(!shown));
      labelVisibility[i] = shown;
    });
  }
  function render(now) {
    if (!visible || document.hidden) { running = false; lastFrame = 0; return; }
    if (motionEnabled && lastFrame && now - lastFrame < frameInterval - 2) {
      requestAnimationFrame(render); return;
    }
    const delta = lastFrame ? Math.min((now - lastFrame) / 1000, .25) : 0;
    lastFrame = now;
    if (motionEnabled) {
      simulationTime += delta;
      wildlife.update(delta, heldPointers.size > 0 || !!document.querySelector('dialog[open]'));
      qualityWindowTime += delta; qualityWindowFrames++;
      if (qualityWindowTime >= 3 && simulationTime > 4) {
        measuredFps = qualityWindowFrames / qualityWindowTime;
        if (measuredFps < 25 && qualityLevel < 2) setQuality(qualityLevel + 1);
        qualityWindowTime = 0; qualityWindowFrames = 0;
      }
    }
    if (tween) {
      const progress = Math.min(1, (now - tween.start) / tween.duration);
      const eased = progress * progress * (3 - 2 * progress);
      camera.position.lerpVectors(tween.from, tween.to, eased);
      controls.target.lerpVectors(tween.lookFrom, tween.lookTo, eased);
      labelsDirty = true;
      if (progress === 1) tween = null;
    }
    controls.maxPolarAngle = Math.min(1.73, Math.acos(THREE.MathUtils.clamp(
      (1.3 - controls.target.y) / camera.position.distanceTo(controls.target), -1, 1
    )));
    controls.update();
    if (labelsDirty) { positionLabels(); labelsDirty = false; }
    renderer.render(scene, camera);
    renderedFrames++;
    if (motionEnabled || tween || framesLeft-- > 0) requestAnimationFrame(render);
    else { running = false; lastFrame = 0; }
  }
  function invalidate(count = 25) {
    framesLeft = Math.max(framesLeft, count);
    labelsDirty = true;
    if (!running && visible && !document.hidden) {
      running = true;
      requestAnimationFrame(render);
    }
  }
  controls.addEventListener('change', () => { labelsDirty = true; invalidate(2); });
  controls.addEventListener('start', () => { tween = null; invalidate(); });
  function move(to, look) {
    tween = {
      from: camera.position.clone(), to, lookFrom: controls.target.clone(), lookTo: look,
      start: performance.now(), duration: reduced.matches ? 1 : 1000
    };
    invalidate(40);
  }
  function focus(index) {
    disturb();
    labels.forEach((label, i) => {
      label.classList.toggle('selected', i === index);
      label.setAttribute('aria-pressed', String(i === index));
    });
    leafMaterials.forEach((material, i) => { material.emissiveIntensity = i === index ? .13 : .07; });
    const direction = anchorNormals[index];
    move(V(direction.x * 35, 9.6, direction.z * 35), target.clone());
  }
  function reset() {
    disturb();
    labels.forEach(label => { label.classList.remove('selected'); label.setAttribute('aria-pressed', 'false'); });
    leafMaterials.forEach(material => { material.emissiveIntensity = .07; });
    move(overview.clone(), target.clone());
  }
  function resize() {
    if (!wrap.clientWidth || !wrap.clientHeight) return;
    camera.aspect = wrap.clientWidth / wrap.clientHeight;
    // Preserve a broad crown on narrow screens while retaining useful orbit/zoom.
    camera.fov = camera.aspect < .8 ? 45 : camera.aspect < 1.15 ? 41 : 36;
    camera.updateProjectionMatrix();
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    invalidate();
  }
  new ResizeObserver(resize).observe(wrap);
  resize();

  // Coarse branch volumes keep clicks fast: thousands of leaves need no CPU raycast.
  const hitZones = [];
  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  anchors.forEach((p, i) => {
    const hit = new THREE.Mesh(new THREE.SphereGeometry(2.0, 10, 8), hitMaterial);
    hit.position.copy(p);
    hit.userData.index = i;
    scene.add(hit);
    hitZones.push(hit);
  });
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down;
  renderer.domElement.addEventListener('pointerdown', event => { down = [event.clientX, event.clientY]; });
  renderer.domElement.addEventListener('pointerdown', event => {
    heldPointers.set(event.pointerId, [event.clientX, event.clientY]);
    if (heldPointers.size > 1) disturb();
  });
  renderer.domElement.addEventListener('pointermove', event => {
    const origin = heldPointers.get(event.pointerId);
    if (origin && Math.hypot(event.clientX - origin[0], event.clientY - origin[1]) > 5) disturb();
  });
  function endPointer(event) {
    const origin = heldPointers.get(event.pointerId);
    if (origin && Math.hypot(event.clientX - origin[0], event.clientY - origin[1]) > 5) disturb();
    heldPointers.delete(event.pointerId);
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
  renderer.domElement.addEventListener('lostpointercapture', endPointer);
  renderer.domElement.addEventListener('wheel', disturb, { passive: true });
  document.addEventListener('click', event => {
    if (event.target.closest('#nature-motion')) return;
    if (event.target.closest('#home button, .header button, dialog button')) disturb();
  });
  document.addEventListener('keydown', event => {
    if (event.target.closest('dialog') || event.key === 'Escape') disturb();
  });
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', disturb));
  renderer.domElement.addEventListener('pointerup', event => {
    if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitZones.filter((_, i) => facesCamera(i)))[0];
    if (hit) select(hit.object.userData.index);
    down = null;
  });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    const status = host.querySelector('#scene-status');
    status.textContent = 'Cây 3D tạm gián đoạn. Bạn có thể chọn phòng ban bên dưới.';
    status.hidden = false;
  });
  document.addEventListener('visibilitychange', () => { lastFrame = 0; heldPointers.clear(); if (!document.hidden) invalidate(); });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    lastFrame = 0;
    if (!visible) heldPointers.clear();
    if (visible) invalidate();
  }, { threshold: .01 }).observe(host);
  host.querySelector('#scene-status').hidden = true;

  return {
    focus, reset, refresh: resize,
    zoom(factor) {
      disturb();
      tween = null;
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
      invalidate();
    },
    getState: () => ({
      position: camera.position.toArray(), target: controls.target.toArray(),
      frames: renderedFrames, running, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      leaves: leafInstances.reduce((n, batch) => n + batch.length, 0), flowers: flowers.length,
      visibleLabels: labelVisibility.map((shown, i) => shown ? i : -1).filter(i => i >= 0),
      rootGarden,
      motionEnabled, wind: { enabled: false, time: 0, meshes: 0 }, wildlife: wildlife.getState(),
      quality: { level: qualityLevel, measuredFps, pixelRatio: renderer.getPixelRatio(), renderedLeaves: canopyMeshes.reduce((n,m)=>n+m.count,0) },
      cameraMoving: !!tween,
      version: 'flowering-tree-v2'
    })
  };
}
