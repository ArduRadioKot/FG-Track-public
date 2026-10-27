// Scroll-driven 3D assembly of the FG-Track revC case, built from the real STL files.
// Units are millimetres, Z is up. Falls back to the static renders when WebGL or the CDN is unavailable.
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const stage = document.querySelector('.assembly-stage');
if (stage) init().catch(() => {});

async function init() {
  const canvas = document.createElement('canvas');
  canvas.className = 'assembly-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(26, 1, 10, 600);
  camera.up.set(0, 0, 1);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-60, -80, 120); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fd3e6, 0.9); rim.position.set(80, 60, 40); scene.add(rim);

  const root = new THREE.Group(); scene.add(root);
  const loader = new STLLoader();
  const load = url => new Promise((ok, no) => loader.load(url, ok, undefined, no));
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .5, metalness: .2, ...o });
  const [gTop, gBottom, gButton, gGuide] = await Promise.all(['Korpus_verh', 'Kryshka_niz', 'Knopka', 'Svetovod'].map(n => load(`assets/model/${n}.stl`)));

  const mesh = (g, m) => { const x = new THREE.Mesh(g, m); x.castShadow = false; return x; };
  const cover = mesh(gBottom, mat(0x565c62, { roughness: .55 }));
  const caseTop = mesh(gTop, mat(0x343a40, { roughness: .45, metalness: .3 }));
  const button = mesh(gButton, mat(0x8b97a1, { roughness: .35, metalness: .4 }));
  const guide = mesh(gGuide, new THREE.MeshPhysicalMaterial({ color: 0xb4d9f0, roughness: .2, transmission: 0, transparent: true, opacity: .92 }));

  // LiPo 302035: 3 x 20 x 35 mm plus kapton, resting on the cover between z 0.9 and 4.4
  const battery = new THREE.Group();
  const cell = new THREE.Mesh(new THREE.BoxGeometry(20, 35, 3.3), mat(0xc9ced3, { roughness: .32, metalness: .75 }));
  cell.position.set(0, 0, 0);
  const tape = new THREE.Mesh(new THREE.BoxGeometry(20.2, 35.2, .2), mat(0xd9a441, { roughness: .6, metalness: 0 }));
  tape.position.set(0, 0, 1.7);
  battery.add(cell, tape);
  battery.userData.rest = new THREE.Vector3(0, 3, 2.6);

  // PCB 20.1 x 43.5 x 1.0 mm with the revC copper texture and the bodies from the centroid file
  const board = new THREE.Group();
  const tex = await new THREE.TextureLoader().loadAsync('assets/model/pcb-top.jpg');
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(20, 43.5, 1), mat(0x15532f, { roughness: .6, metalness: 0 }));
  const top = new THREE.Mesh(new THREE.PlaneGeometry(20, 43.5), new THREE.MeshStandardMaterial({ map: tex, roughness: .55, metalness: 0 }));
  top.position.z = .505;
  board.add(slab, top);
  const PARTS = [[0.2, 19.2, 3.2, 1.6, 1.0, 13617592], [-4.35, 12.85, 0.5, 1.0, 0.5, 11570519], [-6.95, 10.6, 1.0, 0.5, 0.5, 11570519], [-6.05, 0.9, 1.0, 0.5, 0.5, 11570519], [-6.05, -1.6, 1.0, 0.5, 0.5, 11570519], [-0.35, 10.8, 0.5, 1.0, 0.5, 11570519], [-4.95, 2.05, 1.0, 0.5, 0.5, 11570519], [-2.1, 10.8, 0.5, 1.0, 0.5, 11570519], [-5.75, 5.1, 1.0, 0.5, 0.5, 11570519], [-5.75, 3.1, 1.0, 0.5, 0.5, 11570519], [3.25, 1.9, 0.5, 1.0, 0.5, 11570519], [-7.05, 8.0, 0.8, 1.6, 0.8, 11570519], [9.35, 6.4, 0.5, 1.0, 0.5, 11570519], [6.85, 4.25, 1.0, 0.5, 0.5, 11570519], [8.9, -8.1, 0.5, 1.0, 0.5, 11570519], [-4.35, -8.1, 0.8, 1.6, 0.8, 11570519], [-6.95, -13.2, 1.6, 0.8, 0.8, 11570519], [4.45, -5.6, 1.0, 0.5, 0.5, 11570519], [6.65, -5.6, 1.0, 0.5, 0.5, 11570519], [6.6, -16.9, 0.5, 1.0, 0.5, 11570519], [7.65, -16.9, 0.5, 1.0, 0.5, 11570519], [0.05, -9.4, 5.0, 5.0, 1.6, 15921642], [0.05, -18.5, 8.94, 7.3, 3.16, 11449530], [-1.25, 10.8, 0.5, 1.0, 0.8, 2831168], [-6.75, 4.1, 1.6, 0.8, 0.8, 2831168], [-7.55, 5.5, 0.5, 1.0, 0.8, 2831168], [-3.95, -11.2, 0.5, 1.0, 0.35, 1842204], [4.05, -11.2, 0.5, 1.0, 0.35, 1842204], [-8.95, -5.2, 0.5, 1.0, 0.35, 1842204], [9.25, -3.6, 0.5, 1.0, 0.35, 1842204], [9.25, -1.5, 0.5, 1.0, 0.35, 1842204], [6.55, -10.3, 1.0, 0.5, 0.35, 1842204], [0.95, 0.2, 0.5, 1.0, 0.35, 1842204], [-0.05, 0.2, 0.5, 1.0, 0.35, 1842204], [-1.05, 0.2, 0.5, 1.0, 0.35, 1842204], [-7.35, -15.6, 1.0, 0.5, 0.35, 1842204], [-7.35, -16.7, 1.0, 0.5, 0.35, 1842204], [-9.1, -13.5, 0.5, 1.0, 0.35, 1842204], [-9.1, -15.5, 0.5, 1.0, 0.35, 1842204], [-1.25, 12.7, 0.5, 1.0, 0.35, 1842204], [0.05, -3.8, 4.2, 3.2, 2.0, 12041410], [-1.45, 5.9, 5.9, 5.9, 0.9, 1382170], [6.85, 6.4, 3.0, 2.5, 0.86, 1382170], [6.55, -8.1, 2.0, 2.0, 0.75, 1382170], [6.55, -2.6, 1.6, 2.9, 1.1, 1382170], [-7.35, -9.6, 1.6, 2.9, 1.1, 1382170], [6.95, -14.8, 2.0, 2.0, 0.8, 11449530], [-5.05, 11.15, 2.0, 1.6, 0.6, 13225168], [-4.1, -0.35, 1.5, 3.2, 0.7, 13225168]];
  for (const [x, y, w, h, z, c] of PARTS) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, z), mat(c, { roughness: .5, metalness: c === 0xaeb4ba || c === 0xc9ccd0 ? .6 : .1 }));
    b.position.set(x, y + 0.4, .5 + z / 2);   // PARTS are in cover coordinates; the board is centred at y = -0.4
    board.add(b);
  }
  board.userData.rest = new THREE.Vector3(0, -0.4, 4.9);

  // two countersunk M1.6 screws in the end face near the antenna, driven in from below
  const screwMat = mat(0xb9bec4, { roughness: .35, metalness: .85 });
  const makeScrew = () => {
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 5, 20), screwMat); shaft.rotation.x = Math.PI / 2; shaft.position.z = 2.5;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(1.5, .8, .9, 24), screwMat); head.rotation.x = Math.PI / 2; head.position.z = .2;
    g.add(shaft, head);
    return g;
  };
  const screwA = makeScrew(), screwB = makeScrew();

  const group = [
    { o: cover, rest: new THREE.Vector3(0, 0, 0), lift: 0, from: 0, to: 0 },
    { o: battery, rest: battery.userData.rest, lift: 14, from: 0, to: .3 },
    { o: board, rest: board.userData.rest, lift: 26, from: .3, to: .62 },
    { o: caseTop, rest: new THREE.Vector3(0, 0, 0), lift: 38, from: .62, to: .95 },
    { o: guide, rest: new THREE.Vector3(0, 0, 0), lift: 49, from: .62, to: .95 },
    { o: button, rest: new THREE.Vector3(0, 0, 0), lift: 58, from: .62, to: .95 },
    { o: screwA, rest: new THREE.Vector3(-7.4, 22.3, 0), lift: -22, from: .86, to: .99 },
    { o: screwB, rest: new THREE.Vector3(7.4, 22.3, 0), lift: -22, from: .86, to: .99 }
  ];
  group.forEach(g => root.add(g.o));
  root.position.set(0, -1, 0);

  const ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  let progress = 0.55, target = 0.55, raf = 0;
  function apply(p) {
    for (const g of group) {
      const k = g.lift ? 1 - ease((p - g.from) / (g.to - g.from)) : 0;
      g.o.position.set(g.rest.x, g.rest.y, g.rest.z + g.lift * k);
    }
    // the model turns slowly while it is assembled
    root.rotation.z = 1.2 - 0.5 * p;
    const dist = 330 - 140 * p;
    camera.position.set(0, -dist * .8, dist * .55);
    camera.lookAt(0, 0, 30 - 22 * p);
    renderer.render(scene, camera);
  }
  function frame() { raf = 0; progress += (target - progress) * .22; apply(progress); if (Math.abs(target - progress) > .0008) raf = requestAnimationFrame(frame); }
  function setTarget(p) { target = p; if (!raf) raf = requestAnimationFrame(frame); }
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < .85 ? 34 : 26;
    camera.updateProjectionMatrix();
    apply(progress);
  }
  new ResizeObserver(resize).observe(stage);
  addEventListener('assembly-progress', e => setTarget(e.detail == null ? .55 : e.detail));
  stage.prepend(canvas);
  stage.classList.add('is-3d');
  resize();
  if (window.__assemblyProgress != null) { progress = target = window.__assemblyProgress; apply(progress); }
}
