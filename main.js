// Procedural Lightning Strike
// Author: emmda900


// Find the latest version by visiting https://cdn.skypack.dev/three.
import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';
import { EffectComposer } from 'https://cdn.skypack.dev/pin/three@v0.134.0-mlfrkS6HEbKKwwCDDo6H/mode=imports/unoptimized/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'https://cdn.skypack.dev/pin/three@v0.134.0-mlfrkS6HEbKKwwCDDo6H/mode=imports/unoptimized/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'https://cdn.skypack.dev/pin/three@v0.134.0-mlfrkS6HEbKKwwCDDo6H/mode=imports/unoptimized/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OrbitControls } from 'https://cdn.skypack.dev/pin/three@v0.134.0-mlfrkS6HEbKKwwCDDo6H/mode=imports/unoptimized/examples/jsm/controls/OrbitControls.js'

let composer, controls;
let drawCount;
let line, line2, line3, line4, line5, line6;

init();
animate();

function init() {

  let renderer = new THREE.WebGLRenderer();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  let scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0F161D);
  scene.fog = new THREE.FogExp2( 0x0F161D, 0.001 );

  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 30, 10000);
  
  //------ Lights -------//
  scene.add(new THREE.AmbientLight(0x444444));
  const light1 = new THREE.DirectionalLight(0x444444);
  light1.position.set(1, 1, 1).normalize();
  scene.add(light1);

  //------ Post processing -------//
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new UnrealBloomPass({ x: 1024, y: 1024 }, 3.0, 0.5, 0.3)) //  resolution, strength, radius, threshold

  //-------- Terrain --------//
  //Inspiration from: https://woodenraft.games/blog/generating-terrain-plane-geometry-three-js
  const plane_size = 1000;
  camera.position.set(0, -0.15, 0.7).multiplyScalar(plane_size * 0.5);
  controls = new OrbitControls( camera, renderer.domElement );
  controls.target = (new THREE.Vector3(0,-50,0));
  controls.maxPolarAngle = Math.PI / 2;
  controls.maxDistance = 700;
  controls.update();

  const segmentsX = 30;
  const segmentsZ = 30;
  const groundgeometry = new THREE.PlaneBufferGeometry(plane_size, plane_size, segmentsX, segmentsZ);
  groundgeometry.rotateX(Math.PI * -0.5);
  const groundmaterial = new THREE.MeshLambertMaterial({ color: 0x0D351E }, 2); 
  
  const terrain = new THREE.Mesh(groundgeometry, groundmaterial);
  terrain.position.set(0, -130, 0);
  terrain.receiveShadow = true;
  terrain.castShadow = true;
  scene.add(terrain);

  const totalSegmentsX = segmentsX + 1;
  const totalSegmentsZ = segmentsZ + 1;

  for (let z = 0; z < totalSegmentsZ; z++) {
    for (let x = 0; x < totalSegmentsX; x++) {
      const index = 3 * (z * totalSegmentsX + x);

      // index+1 = y-value
      groundgeometry.attributes.position.array[index + 1] = Math.random() * 30; 
    }
  }
  groundgeometry.attributes.position.needsUpdate = true;
  // compute normals for shading 
  groundgeometry.computeVertexNormals();

  //------- Create line ---------//
  const geometry = new THREE.BufferGeometry();
  // attributes
  const positions = new Float32Array(30 * 3); // 3 vertices per point
  geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));

  drawCount = 3; // draw the first 3 points 
  geometry.setDrawRange(0, drawCount);
  
  const linematerial = new THREE.LineBasicMaterial({ color: 0xa1bcc9 });
  line = new THREE.Line(geometry, linematerial);

  line.position.set(1, 0, 0); // starting position 
  // add second line -> hack to make the main branch thicker
  line2 = new THREE.Line(geometry, linematerial);
  line2.position.set(1, 0, 0);
  scene.add(line);
  scene.add(line2);

  //-------- sub-lines ---------//
  const g2 = new THREE.BufferGeometry();
  const pos = new Float32Array(10 * 3); // 3 vertices per point
  g2.addAttribute('position', new THREE.BufferAttribute(pos, 3));
  
  line3 = new THREE.Line(g2, linematerial);
  scene.add(line3);

  line4 = new THREE.Line(g2.clone(), linematerial);
  scene.add(line4);
  line5 = new THREE.Line(g2.clone(), linematerial);
  scene.add(line5);
  line6 = new THREE.Line(g2.clone(), linematerial);
  scene.add(line6);

  updatePositions();
}

function updatePositions() {

  // change starting position of main line, randompos = nbr between 0 & 150
  const max = 150;
  const randompos = Math.random() * max;
  if (line.position.x > 0) {
    line.position.set(-(randompos), 0, 0);
    line2.position.set(-(randompos + 0.3), 0, 0.3);
  } else {
    line.position.set(randompos, 0, 0);
    line2.position.set(randompos + 0.3, 0, 0.3);
  }

  const positions = line.geometry.attributes.position.array;
  const nbrOfPoints = 30;
  // create the main line
  randombranch(positions, nbrOfPoints, 0);

  // create sub-lines
  newbranch(line, line3, 0.7, 5);
  newbranch(line, line5, -0.4, 9);
  newbranch(line5, line6, 0, 4);
  newbranch(line3, line4, 0.5, 4);


}
// new branch
function newbranch(parent, linex, offset, p) {
  parent.add(linex);
    // px = (p,p+1,p+2)
    let px = new THREE.Vector3().fromBufferAttribute( parent.geometry.attributes.position, p );

  parent.updateMatrixWorld();
  linex.position.set(px.x, px.y, px.z);
  const p1 = linex.geometry.attributes.position.array;
  const points = 10;
  randombranch(p1, points, offset);
}


function randombranch(pos_array, nbrOfPoints, offset) {

  let x, y, z, index;
  x = y = z = index = 0;

  for (let i = 0; i < nbrOfPoints; i++) {
    pos_array[index++] = x;
    pos_array[index++] = y;
    pos_array[index++] = z;

    x +=  (Math.random() - (0.5 + offset)) * 10;
    y += -(Math.abs((Math.random() - 0.5))) * (17);
    z += (Math.random() - (0.5 + offset)) * 10;
    
  }
}


function animate() {

  requestAnimationFrame(animate);
  drawCount = (drawCount + 1) % 30; 
  //drawCount = (drawCount + 0.5) % 30; //slow animation

  line.geometry.setDrawRange(0, drawCount)
  line3.geometry.setDrawRange(0, drawCount - 10) // line3 is not starting until drawCount reaches 10
  line5.geometry.setDrawRange(0, drawCount - 10)
  line4.geometry.setDrawRange(0, drawCount - 15)
  line6.geometry.setDrawRange(0, drawCount - 15)

  if (drawCount === 0) {
    // periodically, generate new data
    updatePositions();
    line.geometry.attributes.position.needsUpdate = true; // required after the first render
    line3.geometry.attributes.position.needsUpdate = true;
    line4.geometry.attributes.position.needsUpdate = true;
    line5.geometry.attributes.position.needsUpdate = true;
    
  }
  composer.render();
}






