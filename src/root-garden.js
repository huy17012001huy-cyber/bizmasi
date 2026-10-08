import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Small woodland gardens frame the roots without covering the central trunk. */
export function addRootGarden({ scene, groundY, leafGeometry, flowerGeometry, leafMap, random }) {
  const between = (a, b) => a + random() * (b - a);
  const TAU = Math.PI * 2;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const patches = [
    { x: -4.4, z: 1.6, radius: 1.45, size: .76 },
    { x: 4.4, z: 2.0, radius: 1.55, size: .67 },
    { x: -3.7, z: 4.4, radius: 1.0, size: .45 },
    { x: 3.3, z: 4.7, radius: 1.05, size: .43 },
    { x: -2.3, z: -3.9, radius: 1.15, size: .57 },
    { x: 3.0, z: -3.9, radius: 1.25, size: .65 }
  ];

  // Smooth, irregular limestone with pale veins and a little moss on its upper face.
  const rockGeometry = new THREE.IcosahedronGeometry(1, 2);
  const rockColors = [];
  const vertices = rockGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const noise = Math.sin(x * 5.6 + z * 2.4) * Math.cos(y * 4.8)
      + Math.sin(z * 7.3 - y * 2.8) * .37;
    const radius = 1 + noise * .09;
    vertices.setXYZ(i, x * radius, y * radius, z * radius);
    const moss = y > .25 && Math.sin(x * 6 + z * 5) + Math.cos(z * 8 - y * 5) > .38;
    if (moss) color.setHSL(.22, .25, .19 + noise * .015);
    else color.setHSL(.12, .09, .30 + y * .045 + noise * .018);
    rockColors.push(color.r, color.g, color.b);
  }
  rockGeometry.setAttribute('color', new THREE.Float32BufferAttribute(rockColors, 3));
  rockGeometry.computeVertexNormals();
  const rockPlacements = [];
  for (const patch of patches) {
    rockPlacements.push({ x: patch.x, z: patch.z, size: patch.size, broad: 1.3 });
    for (let i = 0; i < 7; i++) {
      const a = random() * TAU, r = between(.45, patch.radius);
      rockPlacements.push({
        x: patch.x + Math.cos(a) * r, z: patch.z + Math.sin(a) * r,
        size: between(.11, .32), broad: between(.85, 1.6)
      });
    }
    // Pebbles nestle beside the large stones, rather than forming a uniform ring.
    for (let i = 0; i < 23; i++) {
      const a = random() * TAU, r = between(.5, patch.radius * 1.2);
      rockPlacements.push({
        x: patch.x + Math.cos(a) * r, z: patch.z + Math.sin(a) * r,
        size: between(.035, .10), broad: between(.8, 1.4)
      });
    }
  }
  const rocks = new THREE.InstancedMesh(rockGeometry, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: .96
  }), rockPlacements.length);
  rockPlacements.forEach((rock, i) => {
    dummy.position.set(rock.x, groundY(rock.x, rock.z) + rock.size * .22, rock.z);
    dummy.rotation.set(between(-.25, .25), random() * TAU, between(-.16, .16));
    dummy.scale.set(rock.size * rock.broad, rock.size * .68, rock.size);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  });
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  scene.add(rocks);

  const fernLeaves = [], stems = [], flowerHeads = [];
  const plantCenters = [];
  for (const patch of patches) {
    for (let p = 0; p < 4; p++) {
      const a = p / 4 * TAU + between(-.3, .3);
      plantCenters.push({
        x: patch.x + Math.cos(a) * patch.radius * .82,
        z: patch.z + Math.sin(a) * patch.radius * .82,
        size: between(.68, 1.0)
      });
    }
  }

  // Curved fern fronds, each with paired leaflets along a continuous green stem.
  for (const plant of plantCenters) {
    const base = V(plant.x, groundY(plant.x, plant.z) + .025, plant.z);
    for (let f = 0; f < 7; f++) {
      const angle = f / 7 * TAU + between(-.14, .14);
      const length = between(.56, .91) * plant.size;
      const radial = V(Math.cos(angle), 0, Math.sin(angle));
      const sideways = V(-radial.z, 0, radial.x);
      const curve = new THREE.CatmullRomCurve3([
        base,
        base.clone().addScaledVector(radial, length * .35).add(V(0, length * .78, 0)),
        base.clone().addScaledVector(radial, length * .78).add(V(0, length * .7, 0)),
        base.clone().addScaledVector(radial, length).add(V(0, length * .44, 0))
      ]);
      stems.push(new THREE.TubeGeometry(curve, 9, .005, 4, false));
      for (let k = 0; k < 10; k++) {
        const t = .22 + k * .075;
        for (const side of [-1, 1]) {
          const direction = sideways.clone().multiplyScalar(side).addScaledVector(radial, .3).normalize();
          fernLeaves.push({
            point: curve.getPointAt(t),
            rotation: new THREE.Euler(between(-.1, .25), Math.atan2(direction.x, direction.z), between(-.2, .2)),
            length: (.25 * Math.pow(1 - t, .55) + .02) * plant.size,
            width: 1.0,
            color: new THREE.Color().setHSL(between(.24, .29), .46, .16 + t * .09)
          });
        }
      }
    }
  }

  // Cream and butter-yellow flowers grow in loose drifts between the stones.
  for (const patch of patches) {
    for (let f = 0; f < 25; f++) {
      const angle = random() * TAU, distance = between(.7, patch.radius * 1.55);
      const x = patch.x + Math.cos(angle) * distance;
      const z = patch.z + Math.sin(angle) * distance;
      const base = V(x, groundY(x, z), z);
      const height = between(.24, .59);
      const tip = base.clone().add(V(between(-.09, .09), height, between(-.09, .09)));
      stems.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        base, base.clone().lerp(tip, .5).add(V(.035, 0, .015)), tip
      ]), 5, .006, 4, false));
      flowerHeads.push({
        position: tip,
        rotation: new THREE.Euler(-Math.PI / 2 + between(-.55, .55), between(-.4, .4), random() * TAU),
        size: between(.075, .115),
        tint: f % 5 === 0 ? new THREE.Color('#ead067') : new THREE.Color('#fffbe4')
      });
      for (let l = 0; l < 3; l++) {
        fernLeaves.push({
          point: base.clone().lerp(tip, .18 + l * .19),
          rotation: new THREE.Euler(-.4, angle + l * 2.2, .2),
          length: between(.13, .22), width: 1.1,
          color: new THREE.Color('#618344')
        });
      }
    }
  }

  const leaves = new THREE.InstancedMesh(leafGeometry, new THREE.MeshLambertMaterial({
    map: leafMap, vertexColors: true, side: THREE.DoubleSide
  }), fernLeaves.length);
  fernLeaves.forEach((leaf, i) => {
    dummy.position.copy(leaf.point);
    dummy.rotation.copy(leaf.rotation);
    dummy.scale.set(leaf.length * leaf.width, leaf.length, leaf.length);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    leaves.setColorAt(i, leaf.color);
  });
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  scene.add(leaves);

  const stemGeometry = mergeGeometries(stems);
  stems.forEach(geometry => geometry.dispose());
  const stalks = new THREE.Mesh(stemGeometry, new THREE.MeshStandardMaterial({color:'#668844', roughness:.95}));
  stalks.receiveShadow = true;
  scene.add(stalks);

  const blooms = new THREE.InstancedMesh(flowerGeometry, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: .76, emissive:'#9c873d', emissiveIntensity:.07
  }), flowerHeads.length);
  flowerHeads.forEach((flower, i) => {
    dummy.position.copy(flower.position);
    dummy.rotation.copy(flower.rotation);
    dummy.scale.setScalar(flower.size);
    dummy.updateMatrix();
    blooms.setMatrixAt(i, dummy.matrix);
    blooms.setColorAt(i, flower.tint);
  });
  blooms.castShadow = true;
  blooms.receiveShadow = true;
  scene.add(blooms);
  return { stones: rockPlacements.length, ferns: plantCenters.length, flowers: flowerHeads.length };
}
