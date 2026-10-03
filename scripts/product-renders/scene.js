/**
 * Studio-scène voor productbeelden van de voorbeeldcatalogus.
 *
 * Elke opname wordt beschreven met een spec in de URL-hash:
 *   #{"kind":"case","brand":"apple","color":"#1f2226","view":1,"size":1600}
 * Na het renderen zet de pagina window.__done = true.
 *
 * Eenheden zijn millimeters. Telefoons staan rechtop (y omhoog), de
 * achterkant wijst naar +z.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const spec = JSON.parse(decodeURIComponent(location.hash.slice(1) || "{}"));
const WIDTH = spec.width ?? spec.size ?? 1200;
const HEIGHT = spec.height ?? spec.size ?? 1200;

/* ------------------------------------------------------------------ */
/* Renderer, licht en studio                                          */
/* ------------------------------------------------------------------ */

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(WIDTH, HEIGHT);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const BACKGROUND = new THREE.Color(spec.background ?? "#f4f5f6");
scene.background = BACKGROUND;
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const key = new THREE.DirectionalLight(0xffffff, 1.35);
key.position.set(-160, 420, 260);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -260;
key.shadow.camera.right = 260;
key.shadow.camera.top = 260;
key.shadow.camera.bottom = -260;
key.shadow.camera.near = 10;
key.shadow.camera.far = 1200;
key.shadow.radius = 26;
key.shadow.blurSamples = 32;
key.shadow.bias = -0.0004;
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.3);
fill.position.set(300, 120, 200);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 0.4);
rim.position.set(80, 200, -300);
scene.add(rim);

/* ------------------------------------------------------------------ */
/* Hulpfuncties                                                         */
/* ------------------------------------------------------------------ */

const col = (hex) => new THREE.Color(hex);
const lum = (hex) => {
  const c = col(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
};
const shade = (hex, amount) => {
  const c = col(hex);
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amount)));
  return c;
};

function roundedRectShape(w, h, r, cx = 0, cy = 0) {
  const s = new THREE.Shape();
  const x = cx - w / 2;
  const y = cy - h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function roundedRectPath(w, h, r, cx = 0, cy = 0) {
  const p = new THREE.Path();
  const x = cx - w / 2;
  const y = cy - h / 2;
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r);
  p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r);
  p.quadraticCurveTo(x, y, x + r, y);
  return p;
}

function circlePath(r, cx, cy) {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0, Math.PI * 2, true);
  return p;
}

/** Afgeronde plaat met totale dikte `depth`, gecentreerd rond z = 0. */
function slab(shape, depth, bevel) {
  const b = Math.min(bevel, depth / 2 - 0.01);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.01, depth - 2 * b),
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 10,
    curveSegments: 48,
  });
  geo.translate(0, 0, -(depth - 2 * b) / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Schaal UV's van een vlakke vorm naar 0..1, zodat texturen het hele vlak vullen. */
function normalizeUVs(geo) {
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (uv.getX(i) - min.x) / (max.x - min.x), (uv.getY(i) - min.y) / (max.y - min.y));
  }
  uv.needsUpdate = true;
  return geo;
}

function mesh(geo, mat, { cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function noiseTexture(size, scale, contrast = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (Math.random() - 0.5) * 255 * contrast;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // Zachte korrel: een paar keer vervagen geeft een leerachtige structuur.
  ctx.filter = "blur(1.2px)";
  ctx.drawImage(c, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(scale, scale);
  return tex;
}

function stripeTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 64, 64);
  for (let i = -64; i < 128; i += 8) {
    ctx.strokeStyle = "#b0b0b0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 32, 64);
    ctx.stroke();
    ctx.strokeStyle = "#505050";
    ctx.beginPath();
    ctx.moveTo(i + 4, 64);
    ctx.lineTo(i + 36, 0);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function wallpaperTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 256, 512);
  g.addColorStop(0, "#0b3b4a");
  g.addColorStop(0.55, "#0a6f86");
  g.addColorStop(1, "#13a5b8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 512);
  const r = ctx.createRadialGradient(60, 120, 10, 60, 120, 300);
  r.addColorStop(0, "rgba(255,255,255,0.25)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, 256, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------------ */
/* Materialen                                                           */
/* ------------------------------------------------------------------ */

const M = {
  titanium: () =>
    new THREE.MeshPhysicalMaterial({ color: "#b9b6af", metalness: 0.85, roughness: 0.32 }),
  darkMetal: () => new THREE.MeshPhysicalMaterial({ color: "#2b2d31", metalness: 0.8, roughness: 0.35 }),
  chrome: () => new THREE.MeshPhysicalMaterial({ color: "#d9dce0", metalness: 1, roughness: 0.18 }),
  lensGlass: () =>
    new THREE.MeshPhysicalMaterial({
      color: "#07080a",
      metalness: 0.1,
      roughness: 0.04,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      iridescence: 0.6,
      iridescenceIOR: 1.6,
      envMapIntensity: 3,
    }),
  blackGlass: () =>
    new THREE.MeshPhysicalMaterial({ color: "#0a0b0d", metalness: 0.2, roughness: 0.08, clearcoat: 1 }),
  screen: () =>
    new THREE.MeshPhysicalMaterial({
      color: "#05070a",
      emissive: "#ffffff",
      emissiveMap: wallpaperTexture(),
      emissiveIntensity: 0.55,
      roughness: 0.06,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 0.35,
    }),
  rubber: (hex) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.9, sheen: 0.2, sheenColor: shade(hex, 0.08) }),
  silicone: (hex) =>
    new THREE.MeshPhysicalMaterial({
      color: hex,
      roughness: 0.8,
      sheen: 0.25,
      sheenRoughness: 0.7,
      sheenColor: shade(hex, 0.08),
    }),
  hardMatte: (hex) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.48, clearcoat: 0.15, clearcoatRoughness: 0.5 }),
  plastic: (hex) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.38, clearcoat: 0.3, clearcoatRoughness: 0.3 }),
  leather: (hex) =>
    new THREE.MeshPhysicalMaterial({
      color: hex,
      roughness: 0.55,
      bumpMap: noiseTexture(512, 0.02, 1),
      bumpScale: 0.6,
      clearcoat: 0.25,
      clearcoatRoughness: 0.45,
      sheen: 0.15,
      sheenColor: shade(hex, 0.08),
    }),
  clear: () =>
    new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      metalness: 0,
      roughness: 0.04,
      transmission: 1,
      thickness: 1.6,
      ior: 1.52,
      attenuationColor: new THREE.Color("#dff2f7"),
      attenuationDistance: 40,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      specularIntensity: 1,
    }),
  glassSheet: (tint, opacity) =>
    new THREE.MeshPhysicalMaterial({
      color: tint,
      metalness: 0,
      roughness: 0.02,
      transmission: 1 - opacity,
      opacity: 1,
      thickness: 0.4,
      ior: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    }),
  port: () => new THREE.MeshPhysicalMaterial({ color: "#121316", roughness: 0.6 }),
};

/** Materiaal voor een hoesje op basis van het soort product. */
function caseMaterial(kind, hex) {
  if (kind === "leather") return M.leather(hex);
  if (kind === "rugged") return M.rubber(hex);
  if (kind === "silicone") return M.silicone(hex);
  if (kind === "wallet") return M.leather(hex);
  return M.hardMatte(hex);
}

/* ------------------------------------------------------------------ */
/* Telefoon                                                             */
/* ------------------------------------------------------------------ */

const PHONE = { w: 71.5, h: 149.6, t: 8.25, r: 11 };

/** Positie van de camera-eiland per merk (relatief aan het midden). */
function cameraLayout(brand) {
  if (brand === "samsung") {
    const x = -PHONE.w / 2 + 14;
    return {
      type: "samsung",
      lenses: [0, 1, 2].map((i) => ({ x, y: PHONE.h / 2 - 15 - i * 18, r: 6.2 })),
      flash: { x: x + 13, y: PHONE.h / 2 - 15 },
    };
  }
  const bump = { x: -PHONE.w / 2 + 6 + 19, y: PHONE.h / 2 - 6 - 19, size: 38, r: 9.5 };
  return {
    type: "apple",
    bump,
    lenses: [
      { x: bump.x - 8.6, y: bump.y + 8.6, r: 7.2 },
      { x: bump.x - 8.6, y: bump.y - 8.6, r: 7.2 },
      { x: bump.x + 8.8, y: bump.y, r: 7.2 },
    ],
    flash: { x: bump.x + 8.6, y: bump.y + 11 },
    lidar: { x: bump.x + 8.6, y: bump.y - 11 },
  };
}

function lens(x, y, z, r, ringMat) {
  const g = new THREE.Group();
  const ring = mesh(new THREE.CylinderGeometry(r, r, 1.6, 64), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y, z + 0.8);
  const glass = mesh(new THREE.CylinderGeometry(r * 0.78, r * 0.78, 1.7, 64), M.lensGlass());
  glass.rotation.x = Math.PI / 2;
  glass.position.set(x, y, z + 0.86);
  const inner = mesh(new THREE.CylinderGeometry(r * 0.32, r * 0.32, 1.72, 48), M.blackGlass());
  inner.rotation.x = Math.PI / 2;
  inner.position.set(x, y, z + 0.88);
  g.add(ring, glass, inner);
  return g;
}

/** Camera-module op de achterkant van de telefoon; z = oppervlak van de rug. */
function cameraModule(brand, z, bodyMat) {
  const g = new THREE.Group();
  const layout = cameraLayout(brand);
  if (layout.type === "apple") {
    const { bump } = layout;
    const plate = mesh(slab(roundedRectShape(bump.size, bump.size, bump.r), 1.6, 0.6), bodyMat ?? M.titanium());
    plate.position.set(bump.x, bump.y, z + 0.8);
    g.add(plate);
    for (const l of layout.lenses) g.add(lens(l.x, l.y, z + 1.5, l.r, M.titanium()));
    const flash = mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.4, 32), new THREE.MeshPhysicalMaterial({ color: "#f2e7c9", roughness: 0.3 }));
    flash.rotation.x = Math.PI / 2;
    flash.position.set(layout.flash.x, layout.flash.y, z + 1.75);
    const lidar = mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.4, 32), M.blackGlass());
    lidar.rotation.x = Math.PI / 2;
    lidar.position.set(layout.lidar.x, layout.lidar.y, z + 1.75);
    g.add(flash, lidar);
  } else {
    for (const l of layout.lenses) g.add(lens(l.x, l.y, z, l.r, M.darkMetal()));
    const flash = mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.4, 32), new THREE.MeshPhysicalMaterial({ color: "#f2e7c9", roughness: 0.3 }));
    flash.rotation.x = Math.PI / 2;
    flash.position.set(layout.flash.x, layout.flash.y, z + 0.2);
    g.add(flash);
  }
  return g;
}

/** Losse telefoon. `back` is de kleur van de achterkant. */
function phone(brand, back = "#b9b6af") {
  const g = new THREE.Group();
  const frame = mesh(slab(roundedRectShape(PHONE.w, PHONE.h, PHONE.r), PHONE.t, 1.6), M.titanium());
  g.add(frame);
  const backMat = new THREE.MeshPhysicalMaterial({ color: back, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.4 });
  const backPlate = mesh(new THREE.ShapeGeometry(roundedRectShape(PHONE.w - 2.4, PHONE.h - 2.4, PHONE.r - 1.2), 48), backMat, { cast: false });
  backPlate.position.z = PHONE.t / 2 + 0.08;
  g.add(backPlate);
  g.add(cameraModule(brand, PHONE.t / 2, M.titanium()));
  // Scherm aan de voorkant.
  const screen = mesh(normalizeUVs(new THREE.ShapeGeometry(roundedRectShape(PHONE.w - 2.6, PHONE.h - 2.6, PHONE.r - 1.3), 48)), M.screen(), { cast: false });
  screen.rotation.y = Math.PI;
  screen.position.z = -PHONE.t / 2 - 0.08;
  g.add(screen);
  const island = mesh(new THREE.ShapeGeometry(roundedRectShape(20, 6, 3, 0, PHONE.h / 2 - 9), 24), M.blackGlass(), { cast: false });
  island.rotation.y = Math.PI;
  island.position.z = -PHONE.t / 2 - 0.16;
  g.add(island);
  // Knoppen.
  const btn = (x, y, h) => {
    const b = mesh(new RoundedBoxGeometry(1.4, h, 3.2, 3, 0.6), M.titanium());
    b.position.set(x, y, 0);
    g.add(b);
  };
  btn(PHONE.w / 2 + 0.4, 28, 16);
  btn(-PHONE.w / 2 - 0.4, 36, 10);
  btn(-PHONE.w / 2 - 0.4, 22, 10);
  return g;
}

/* ------------------------------------------------------------------ */
/* Hoesjes                                                              */
/* ------------------------------------------------------------------ */

function caseShapeWithHoles(brand, w, h, r, grow = 2.2) {
  const shape = roundedRectShape(w, h, r);
  const layout = cameraLayout(brand);
  if (layout.type === "apple") {
    const b = layout.bump;
    shape.holes.push(roundedRectPath(b.size + grow, b.size + grow, b.r + grow / 2, b.x, b.y));
  } else {
    for (const l of layout.lenses) shape.holes.push(circlePath(l.r + 1.2, l.x, l.y));
    shape.holes.push(circlePath(3.2, layout.flash.x, layout.flash.y));
  }
  return shape;
}

function magsafeRing(z, color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0.1 });
  const ring = mesh(new THREE.RingGeometry(23, 25.5, 96), mat, { cast: false });
  ring.position.set(0, -6, z);
  const tab = mesh(new THREE.PlaneGeometry(3.2, 9), mat, { cast: false });
  tab.position.set(0, -6 - 31, z);
  g.add(ring, tab);
  return g;
}

/**
 * Hoesje met telefoon erin.
 * kind: hardcase | silicone | leather | rugged | clear | wallet
 */
function phoneCase(kind, brand, hex, { magsafe = false } = {}) {
  const g = new THREE.Group();
  const wall = kind === "rugged" ? 2.6 : 1.5;
  const W = PHONE.w + wall * 2;
  const H = PHONE.h + wall * 2;
  const T = PHONE.t + wall * 2 + (kind === "rugged" ? 0.8 : 0);
  const R = PHONE.r + wall;

  // Telefoon binnenin (zichtbaar door uitsparingen en bij transparant).
  const ph = phone(brand, kind === "clear" ? "#c9d3dc" : "#b9b6af");
  g.add(ph);

  const lip = 1.1; // hoeveel de rand over het scherm valt
  const rimShape = roundedRectShape(W, H, R);
  rimShape.holes.push(roundedRectPath(PHONE.w - lip * 2, PHONE.h - lip * 2, PHONE.r - lip));
  const backDepth = wall + 1.2;

  if (kind === "clear") {
    const clearMat = M.clear();
    const rimMesh = mesh(slab(rimShape, T, 2.6), clearMat, { cast: false });
    const backMesh = mesh(slab(caseShapeWithHoles(brand, W - 1, H - 1, R - 0.5), backDepth, 0.8), clearMat, { cast: false });
    backMesh.position.z = T / 2 - backDepth / 2;
    g.add(rimMesh, backMesh);
    if (magsafe) g.add(magsafeRing(PHONE.t / 2 + 0.12, "#e9eaec"));
    return g;
  }

  const mat = caseMaterial(kind, hex);
  const bevel = kind === "rugged" ? 3.2 : 2.4;
  const body = mesh(slab(rimShape, T, bevel), mat);
  const backMesh = mesh(slab(caseShapeWithHoles(brand, W - 1, H - 1, R - 0.5), backDepth, 0.8), mat);
  backMesh.position.z = T / 2 - backDepth / 2;
  g.add(body, backMesh);

  // Verhoogde rand rond de camera.
  const layout = cameraLayout(brand);
  if (layout.type === "apple") {
    const b = layout.bump;
    const lipShape = roundedRectShape(b.size + 6, b.size + 6, b.r + 3, b.x, b.y);
    lipShape.holes.push(roundedRectPath(b.size + 2.2, b.size + 2.2, b.r + 1.1, b.x, b.y));
    const lip = mesh(slab(lipShape, 1.6, 0.6), mat);
    lip.position.z = T / 2 + 0.5;
    g.add(lip);
  }

  // Zijknoppen als bobbels in het hoesje.
  const btnMat = kind === "rugged" ? M.plastic(shade(hex, -0.06)) : mat;
  const btn = (x, y, h) => {
    const b = mesh(new RoundedBoxGeometry(2.2, h, 4.4, 3, 1), btnMat);
    b.position.set(x, y, 0);
    g.add(b);
  };
  btn(W / 2 + 0.3, 28, 18);
  btn(-W / 2 - 0.3, 36, 11);
  btn(-W / 2 - 0.3, 22, 11);

  if (kind === "rugged") {
    const dark = M.rubber(shade(hex, -0.08));
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const corner = mesh(new RoundedBoxGeometry(18, 18, T + 1.6, 6, 6), dark);
      corner.position.set(sx * (W / 2 - 6.5), sy * (H / 2 - 6.5), 0);
      g.add(corner);
    }
    // Gripribbels op de rug.
    for (let i = 0; i < 6; i++) {
      const rib = mesh(new RoundedBoxGeometry(34, 1.2, 0.8, 2, 0.4), dark);
      rib.position.set(0, -42 - i * 4.2, T / 2 + 0.1);
      g.add(rib);
    }
  }

  if (kind === "wallet") {
    const pocketMat = M.leather(shade(hex, -0.05));
    const pocket = mesh(new RoundedBoxGeometry(56, 38, 2.4, 4, 1.2), pocketMat);
    pocket.position.set(0, -40, T / 2 + 0.8);
    const card = mesh(new RoundedBoxGeometry(50, 30, 0.9, 2, 0.4), M.plastic("#d8c58f"));
    card.position.set(0, -22, T / 2 + 0.6);
    g.add(card, pocket);
  }

  if (magsafe) g.add(magsafeRing(T / 2 + 0.03, shade(hex, lum(hex) > 0.5 ? -0.03 : 0.025)));

  // Voorkant: het hoesje steekt net buiten het scherm uit.
  return g;
}

function bookCase(brand, hex, open) {
  const g = new THREE.Group();
  const mat = M.leather(hex);
  const W = PHONE.w + 6;
  const H = PHONE.h + 6;
  if (!open) {
    const cover = mesh(slab(roundedRectShape(W, H, 7), 15, 2.2), mat);
    g.add(cover);
    // Stiksels langs de rand.
    const path = roundedRectShape(W - 7, H - 7, 5);
    const pts = path.getSpacedPoints(150);
    const stitchMat = new THREE.MeshPhysicalMaterial({ color: shade(hex, 0.25), roughness: 0.7 });
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = a.distanceTo(b) * 0.55;
      const s = mesh(new THREE.CapsuleGeometry(0.28, len, 2, 6), stitchMat, { cast: false });
      s.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, 7.55);
      s.rotation.z = Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;
      g.add(s);
    }
    const clasp = mesh(new RoundedBoxGeometry(14, 30, 17, 4, 3), M.leather(shade(hex, -0.04)));
    clasp.position.set(W / 2 - 2, -8, 0);
    g.add(clasp);
    // Camera-uitsparing aan de achterkant is niet zichtbaar in deze opname.
    return g;
  }
  // Open: links pasjesvakken, rechts de telefoon in de houder.
  const left = mesh(slab(roundedRectShape(W, H, 7), 3, 1.2), mat);
  left.position.set(-W / 2 - 3, 0, 0);
  const right = mesh(slab(roundedRectShape(W, H, 7), 3, 1.2), mat);
  right.position.set(W / 2 + 3, 0, 0);
  const spine = mesh(new RoundedBoxGeometry(8, H - 2, 3, 3, 1.2), mat);
  g.add(left, right, spine);
  const slotMat = M.leather(shade(hex, 0.04));
  for (let i = 0; i < 3; i++) {
    const card = mesh(new RoundedBoxGeometry(W - 18, 22, 0.8, 2, 0.3), M.plastic(["#d8c58f", "#9fb4c9", "#e6e6e6"][i]));
    card.position.set(-W / 2 - 3, 46 - i * 16 + 4, 1.9);
    const slot = mesh(new RoundedBoxGeometry(W - 12, 24, 1.4, 3, 0.6), slotMat);
    slot.position.set(-W / 2 - 3, 46 - i * 16 - 4, 2.3 + i * 0.2);
    g.add(card, slot);
  }
  const ph = phone(brand);
  ph.rotation.y = Math.PI;
  ph.position.set(W / 2 + 3, 0, 1.5 + PHONE.t / 2);
  g.add(ph);
  return g;
}

/* ------------------------------------------------------------------ */
/* Screenprotectors                                                     */
/* ------------------------------------------------------------------ */

function screenProtector(kind, brand, hex, view) {
  const g = new THREE.Group();
  const tint = kind === "privacy" ? "#1b1f24" : "#eef6fb";
  const opacity = kind === "privacy" ? 0.55 : kind === "film" ? 0.05 : 0.12;
  const thickness = kind === "film" ? 0.25 : 0.6;
  const sheet = mesh(slab(roundedRectShape(PHONE.w - 1.5, PHONE.h - 1.5, PHONE.r - 0.8), thickness, thickness / 2 - 0.02), M.glassSheet(tint, opacity));
  sheet.castShadow = false;
  const ph = phone(brand);
  ph.rotation.y = Math.PI;
  g.add(ph);
  const side = view === 1 ? 1 : -1;
  sheet.position.set(16 * side, 10, PHONE.t / 2 + 16);
  sheet.rotation.set(-0.04, 0.22 * side, 0.04 * side);
  g.add(sheet);
  return g;
}

function lensProtector(brand, hex, view) {
  const g = new THREE.Group();
  const ringMat = new THREE.MeshPhysicalMaterial({ color: hex, metalness: 0.9, roughness: 0.25 });
  if (view === 1) {
    const ph = phone(brand);
    g.add(ph);
    for (const l of cameraLayout(brand).lenses) {
      const ring = mesh(new THREE.TorusGeometry(l.r + 0.2, 0.9, 24, 64), ringMat);
      ring.position.set(l.x, l.y, PHONE.t / 2 + (brand === "apple" ? 3.4 : 1.9));
      const cover = mesh(new THREE.CylinderGeometry(l.r, l.r, 0.6, 48), M.glassSheet("#ffffff", 0.05));
      cover.rotation.x = Math.PI / 2;
      cover.position.copy(ring.position);
      cover.position.z += 0.2;
      g.add(ring, cover);
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const ring = mesh(new THREE.TorusGeometry(8.5, 1.6, 32, 96), ringMat);
      ring.position.set(-24 + i * 24, 0, 0);
      ring.rotation.x = -1.1;
      const cover = mesh(new THREE.CylinderGeometry(8.4, 8.4, 0.8, 64), M.glassSheet("#ffffff", 0.05));
      cover.position.copy(ring.position);
      cover.rotation.x = -1.1 + Math.PI / 2;
      g.add(ring, cover);
    }
  }
  return g;
}

/* ------------------------------------------------------------------ */
/* Laders, kabels, houders, powerbanks                                  */
/* ------------------------------------------------------------------ */

function usbC(depth = 4) {
  const shape = roundedRectShape(8.8, 3.2, 1.55);
  const m = mesh(slab(shape, depth, 0.3), M.port(), { cast: false });
  return m;
}

function wallCharger(hex, ports) {
  const g = new THREE.Group();
  const body = mesh(new RoundedBoxGeometry(34, 34, 40, 8, 6), M.plastic(hex));
  g.add(body);
  for (const x of [-9.5, 9.5]) {
    const pin = mesh(new THREE.CylinderGeometry(2.1, 2.1, 19, 32), M.chrome());
    pin.rotation.x = Math.PI / 2;
    pin.position.set(x, 0, -29);
    g.add(pin);
  }
  for (let i = 0; i < ports; i++) {
    const p = usbC();
    p.position.set(0, ports === 1 ? 0 : 6 - i * 12, 20);
    g.add(p);
  }
  return g;
}

function cableCurve(points) {
  return new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, "catmullrom", 0.5);
}

function connector(type, hex) {
  const g = new THREE.Group();
  const housing = mesh(new RoundedBoxGeometry(type === "usb-a" ? 16 : 11, 6.4, 24, 4, 2.6), M.plastic(hex));
  housing.position.z = -12;
  g.add(housing);
  let tip;
  if (type === "usb-a") tip = mesh(new RoundedBoxGeometry(12, 4.5, 12, 2, 0.3), M.chrome());
  else if (type === "lightning") tip = mesh(new RoundedBoxGeometry(6.6, 1.5, 7.5, 2, 0.7), M.chrome());
  else tip = mesh(slab(roundedRectShape(8.3, 2.5, 1.2), 7.5, 0.3), M.chrome());
  if (type !== "usb-a" && type !== "lightning") tip.rotation.x = 0;
  tip.position.z = type === "usb-a" ? 5 : 3.5;
  g.add(tip);
  return g;
}

/** Kabel als opgerolde lus met een stekker aan elk eind. */
function cable(hex, headA, headB, { braided = true, extraHeads = [] } = {}) {
  const g = new THREE.Group();
  const pts = [];
  const loops = 2.3;
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const a = t * Math.PI * 2 * loops;
    const r = 52 + Math.sin(t * Math.PI) * 6;
    pts.push([Math.cos(a) * r + t * 10, Math.sin(t * 13) * 1.5 + i * 0.06, Math.sin(a) * r * 0.9]);
  }
  const curve = cableCurve(pts);
  const mat = braided
    ? new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.75, bumpMap: (() => { const t = stripeTexture(); t.repeat.set(220, 2); return t; })(), bumpScale: 0.8, sheen: 0.4 })
    : new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.4, clearcoat: 0.3 });
  const tube = mesh(new THREE.TubeGeometry(curve, 600, 2.1, 16, false), mat);
  g.add(tube);
  const place = (head, t, dir) => {
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).multiplyScalar(dir);
    const c = connector(head, hex === "#f5f5f2" ? "#eeeeec" : shade(hex, 0.03));
    c.position.copy(p).addScaledVector(tangent, 12);
    c.lookAt(p.clone().addScaledVector(tangent, 40));
    g.add(c);
  };
  place(headA, 0, -1);
  place(headB, 1, 1);
  extraHeads.forEach((h, i) => place(h, 1 - (i + 1) * 0.02, 1));
  g.rotation.x = 0.15;
  return g;
}

function puck(hex) {
  const g = new THREE.Group();
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(27, 0),
    new THREE.Vector2(29.5, 1.5),
    new THREE.Vector2(30, 4),
    new THREE.Vector2(29, 6.2),
    new THREE.Vector2(0, 6.6),
  ];
  const body = mesh(new THREE.LatheGeometry(profile, 96), M.plastic(hex));
  g.add(body);
  const top = mesh(new THREE.CylinderGeometry(24, 24, 0.2, 96), M.silicone(shade(hex, lum(hex) > 0.5 ? -0.04 : 0.04)));
  top.position.y = 6.65;
  g.add(top);
  const curve = cableCurve([
    [29, 3, 0],
    [42, 3, 4],
    [52, 2, 18],
    [46, 1.5, 36],
    [30, 1.5, 44],
  ]);
  g.add(mesh(new THREE.TubeGeometry(curve, 200, 1.8, 12, false), M.plastic(hex)));
  g.rotation.x = 0.85;
  return g;
}

function standCharger(hex) {
  const g = new THREE.Group();
  const mat = M.plastic(hex);
  const base = mesh(new RoundedBoxGeometry(70, 10, 56, 6, 4), mat);
  base.position.set(0, 5, 0);
  const backrest = mesh(new RoundedBoxGeometry(62, 96, 10, 6, 4), mat);
  backrest.position.set(0, 52, -10);
  backrest.rotation.x = -0.28;
  const lip = mesh(new RoundedBoxGeometry(70, 10, 12, 4, 4), mat);
  lip.position.set(0, 13, 18);
  g.add(base, backrest, lip);
  const ph = phone("apple");
  ph.rotation.set(-0.28, Math.PI, 0);
  ph.position.set(0, 88, 0);
  g.add(ph);
  return g;
}

function carCharger(hex) {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(11, 10, 44, 64), M.plastic(hex));
  const collar = mesh(new THREE.CylinderGeometry(14.5, 14.5, 12, 64), M.plastic(shade(hex, 0.04)));
  collar.position.y = 26;
  const tip = mesh(new THREE.CylinderGeometry(3.5, 3, 6, 32), M.chrome());
  tip.position.y = -25;
  g.add(body, collar, tip);
  const c = usbC(2);
  c.rotation.x = Math.PI / 2;
  c.position.set(-4, 32.1, 0);
  const a = mesh(new RoundedBoxGeometry(12.5, 1.5, 5, 2, 0.3), M.port());
  a.position.set(5.5, 32.1, 0);
  a.rotation.y = Math.PI / 2;
  g.add(c, a);
  for (const s of [-1, 1]) {
    const spring = mesh(new RoundedBoxGeometry(2, 14, 4, 2, 0.8), M.chrome());
    spring.position.set(s * 10.6, -8, 0);
    g.add(spring);
  }
  g.rotation.x = 0.35;
  return g;
}

function powerbank(hex, { slim = false, ring = false, lightning = false, big = false } = {}) {
  const g = new THREE.Group();
  const w = slim ? 64 : big ? 76 : 68;
  const h = slim ? 98 : big ? 150 : 140;
  const t = slim ? 12 : big ? 26 : 16;
  const body = mesh(slab(roundedRectShape(w, h, slim ? 12 : 9), t, slim ? 4 : 5), M.silicone(hex));
  g.add(body);
  for (let i = 0; i < 4; i++) {
    const led = mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.4, 24), new THREE.MeshPhysicalMaterial({
      color: i < 3 ? "#7dd3fc" : "#3a3d42",
      emissive: i < 3 ? "#38bdf8" : "#000000",
      emissiveIntensity: 0.8,
    }));
    led.rotation.x = Math.PI / 2;
    led.position.set(-7.5 + i * 5, -h / 2 + 14, t / 2 + 0.1);
    g.add(led);
  }
  if (ring) g.add(magsafeRing(t / 2 + 0.03, shade(hex, lum(hex) > 0.5 ? -0.08 : 0.08)));
  const port = usbC(3);
  port.rotation.x = Math.PI / 2;
  port.position.set(0, -h / 2 - 1, 0);
  g.add(port);
  if (lightning) {
    const plug = connector("lightning", hex);
    plug.rotation.x = -Math.PI / 2;
    plug.position.set(0, h / 2 + 2, 0);
    plug.children[0].visible = false;
    g.add(plug);
  }
  return g;
}

function ventHolder(hex) {
  const g = new THREE.Group();
  const head = mesh(new THREE.CylinderGeometry(30, 30, 8, 96), M.silicone(hex));
  head.rotation.x = Math.PI / 2;
  g.add(head);
  const face = mesh(new THREE.RingGeometry(21, 24, 96), new THREE.MeshPhysicalMaterial({ color: shade(hex, lum(hex) > 0.5 ? -0.1 : 0.12), roughness: 0.5 }), { cast: false });
  face.position.z = 4.05;
  g.add(face);
  const ball = mesh(new THREE.SphereGeometry(8, 48, 32), M.plastic(shade(hex, 0.05)));
  ball.position.z = -10;
  const arm = mesh(new RoundedBoxGeometry(12, 12, 22, 3, 3), M.plastic(hex));
  arm.position.z = -22;
  const clip = mesh(new RoundedBoxGeometry(6, 34, 18, 3, 2.5), M.plastic(shade(hex, 0.02)));
  clip.position.set(0, -6, -36);
  g.add(ball, arm, clip);
  return g;
}

function clampHolder(hex) {
  const g = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(36, 40, 10, 96), M.plastic(hex));
  base.position.y = -80;
  const suction = mesh(new THREE.CylinderGeometry(40, 40, 2, 96), new THREE.MeshPhysicalMaterial({ color: "#9ca3af", roughness: 0.2, transmission: 0.6, thickness: 2 }));
  suction.position.y = -86;
  const pole = mesh(new THREE.CylinderGeometry(5, 5, 70, 32), M.plastic(shade(hex, 0.04)));
  pole.position.y = -40;
  pole.rotation.z = 0.25;
  const back = mesh(new RoundedBoxGeometry(74, 52, 10, 4, 4), M.plastic(hex));
  back.position.set(-8, 8, 0);
  const armL = mesh(new RoundedBoxGeometry(10, 46, 22, 3, 3), M.rubber(shade(hex, 0.06)));
  armL.position.set(-50, 8, 8);
  const armR = armL.clone();
  armR.position.set(34, 8, 8);
  g.add(base, suction, pole, back, armL, armR);
  return g;
}

function bikeHolder(hex) {
  const g = new THREE.Group();
  const bar = mesh(new THREE.CylinderGeometry(12, 12, 260, 48), new THREE.MeshPhysicalMaterial({ color: "#3a3d42", metalness: 0.6, roughness: 0.35 }));
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, -40, -18);
  const mount = mesh(new RoundedBoxGeometry(30, 34, 30, 4, 6), M.plastic(hex));
  mount.position.set(0, -40, -6);
  g.add(bar, mount);
  const frameShape = roundedRectShape(84, 164, 12);
  frameShape.holes.push(roundedRectPath(74, 154, 9));
  const frame = mesh(slab(frameShape, 8, 2), M.plastic(hex));
  frame.position.set(0, 30, 8);
  g.add(frame);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const c = mesh(new RoundedBoxGeometry(18, 18, 12, 4, 4), M.rubber(shade(hex, 0.05)));
    c.position.set(sx * 37, 30 + sy * 77, 10);
    g.add(c);
  }
  return g;
}

function deskStand(hex) {
  const g = new THREE.Group();
  const metal = new THREE.MeshPhysicalMaterial({ color: hex, metalness: 0.85, roughness: 0.35 });
  const base = mesh(new RoundedBoxGeometry(80, 8, 80, 6, 4), metal);
  base.position.y = -80;
  const pole = mesh(new THREE.CylinderGeometry(4, 4, 110, 32), metal);
  pole.position.set(0, -25, -10);
  pole.rotation.x = -0.1;
  const head = mesh(new THREE.CylinderGeometry(30, 30, 7, 96), metal);
  head.rotation.x = Math.PI / 2 - 0.25;
  head.position.set(0, 35, -4);
  const pad = mesh(new THREE.RingGeometry(20, 23, 96), new THREE.MeshPhysicalMaterial({ color: "#1d1f22", roughness: 0.8 }), { cast: false });
  pad.position.set(0, 35.8, -0.5);
  pad.rotation.x = -0.25;
  g.add(base, pole, head, pad);
  return g;
}

/* ------------------------------------------------------------------ */
/* Opbouw per opname                                                    */
/* ------------------------------------------------------------------ */

function build({ kind, brand = "apple", color = "#1f2226", view = 1 }) {
  const back = { rotation: [0.06, -0.42, 0.02] };
  const front = { rotation: [0.06, Math.PI + 0.42, -0.02] };
  let obj;
  let pose = view === 1 ? back : front;

  switch (kind) {
    case "case":
    case "silicone":
    case "hardcase":
    case "leather":
    case "rugged":
    case "wallet":
    case "clear":
      obj = phoneCase(kind === "case" ? "hardcase" : kind, brand, color, { magsafe: spec.magsafe });
      break;
    case "book":
      obj = bookCase(brand, color, view === 2);
      if (view === 2) spec.margin ??= 1.5;
      pose = view === 1 ? back : { rotation: [0.12, 0, 0] };
      break;
    case "glass":
    case "privacy":
    case "film":
      obj = screenProtector(kind, brand, color, view);
      pose = { rotation: [0.05, view === 1 ? -0.38 : 0.38, 0] };
      break;
    case "lens":
      obj = lensProtector(brand, color, view);
      pose = view === 1 ? { rotation: [0.15, -0.55, 0.05] } : { rotation: [0, 0, 0] };
      break;
    case "charger":
    case "dual":
      obj = wallCharger(color, kind === "dual" ? 2 : 1);
      pose = { rotation: view === 1 ? [0.35, -0.6, 0] : [0.5, 0.7, 0] };
      break;
    case "pps":
      if (view === 1) {
        obj = wallCharger(color, 1);
        pose = { rotation: [0.35, -0.6, 0] };
      } else {
        obj = cable(color, "usb-c", "usb-c");
        pose = { rotation: [0.6, 0.2, 0] };
      }
      break;
    case "wireless":
      obj = puck(color);
      pose = { rotation: [view === 1 ? 0.1 : 0.4, view === 1 ? -0.3 : 0.6, 0] };
      break;
    case "stand":
      obj = standCharger(color);
      pose = { rotation: [0.1, view === 1 ? -0.7 : 0.7, 0] };
      break;
    case "carcharger":
      obj = carCharger(color);
      pose = { rotation: [0, view === 1 ? -0.4 : 0.8, 0] };
      break;
    case "cable":
      obj = cable(color, view === 1 ? "usb-c" : "usb-a", "usb-c", { braided: true });
      pose = { rotation: [view === 1 ? 0.55 : 0.75, view === 1 ? 0.3 : -0.6, 0] };
      break;
    case "lightning":
      obj = cable(color, "usb-c", "lightning", { braided: false });
      pose = { rotation: [view === 1 ? 0.55 : 0.75, view === 1 ? 0.3 : -0.6, 0] };
      break;
    case "multi":
      obj = cable(color, "usb-a", "usb-c", { braided: true, extraHeads: ["lightning", "lightning"] });
      pose = { rotation: [0.6, view === 1 ? 0.3 : -0.6, 0] };
      break;
    case "vent":
      obj = ventHolder(color);
      pose = { rotation: [0.1, view === 1 ? -0.5 : 0.9, 0] };
      break;
    case "clamp":
      obj = clampHolder(color);
      pose = { rotation: [0.1, view === 1 ? -0.4 : 0.6, 0] };
      break;
    case "bike":
      obj = bikeHolder(color);
      pose = { rotation: [0.35, view === 1 ? -0.35 : 0.5, 0] };
      break;
    case "desk":
      obj = deskStand(color);
      pose = { rotation: [0.1, view === 1 ? -0.6 : 0.6, 0] };
      break;
    case "magpack":
      if (view === 1) {
        obj = powerbank(color, { slim: true, ring: true });
        pose = { rotation: [0.06, -0.42, 0.02] };
      } else {
        obj = new THREE.Group();
        obj.add(phone("apple"));
        const pb = powerbank(color, { slim: true });
        pb.position.set(0, -16, PHONE.t / 2 + 6.5);
        obj.add(pb);
        pose = { rotation: [0.06, -0.55, 0.02] };
      }
      break;
    case "powerbank":
      obj = powerbank(color, { big: spec.big });
      pose = { rotation: [0.08, view === 1 ? -0.45 : 0.6, 0.02] };
      break;
    case "minipack":
      obj = powerbank(color, { slim: true, lightning: true });
      pose = { rotation: [0.08, view === 1 ? -0.45 : 0.6, 0.02] };
      break;
    case "hero": {
      // Samenstelling voor de homepage: een rij hoesjes, licht gewaaierd.
      obj = new THREE.Group();
      const items = [
        { kind: "silicone", color: "#1f2f54", x: -150, z: -40, ry: -0.5 },
        { kind: "leather", color: "#9a5a2c", x: -55, z: 10, ry: -0.42 },
        { kind: "clear", color: "#dfe6ee", x: 45, z: 40, ry: -0.34 },
        { kind: "silicone", color: "#a3b39a", x: 145, z: 0, ry: -0.26 },
      ];
      for (const it of items) {
        const c = phoneCase(it.kind, "apple", it.color, { magsafe: true });
        c.position.set(it.x, 0, it.z);
        c.rotation.set(0.04, it.ry, 0.02);
        obj.add(c);
      }
      pose = { rotation: [0, 0.12, 0] };
      break;
    }
    default:
      obj = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), M.plastic(color));
  }

  obj.rotation.set(...pose.rotation);
  return obj;
}

const subject = build(spec);
scene.add(subject);

// Op de grond zetten en camera passend maken.
subject.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(subject);
const center = box.getCenter(new THREE.Vector3());
subject.position.sub(center);
subject.position.y += box.getSize(new THREE.Vector3()).y / 2;
subject.updateMatrixWorld(true);
const fitted = new THREE.Box3().setFromObject(subject);
const size = fitted.getSize(new THREE.Vector3());
const mid = fitted.getCenter(new THREE.Vector3());

const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.ShadowMaterial({ opacity: 0.16 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

const aspect = WIDTH / HEIGHT;
const camera = new THREE.PerspectiveCamera(24, aspect, 80, 6000);
const radius = Math.max(size.x / aspect, size.y, size.z * 0.8) * 0.5;
const margin = spec.margin ?? 1.32;
const dist = (radius * margin) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
camera.position.set(mid.x, mid.y + dist * 0.12, mid.z + dist);
camera.lookAt(mid.x, mid.y - radius * 0.02, mid.z);

key.target.position.copy(mid);
scene.add(key.target);

renderer.render(scene, camera);
renderer.render(scene, camera);
window.__done = true;
