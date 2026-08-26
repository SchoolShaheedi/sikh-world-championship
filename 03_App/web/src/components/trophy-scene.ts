/**
 * The 3D trophy — built procedurally in Three.js.
 *
 * IMPORTANT: this module is only ever reached through a dynamic import from
 * TrophyHero.tsx, so Three.js lands in its own chunk and never touches first paint.
 * Nothing else in the app may import it statically.
 *
 * Procedural rather than a glTF model on purpose: no asset to download, no CDN, nothing
 * to 404, and the whole shape is a handful of lathe profiles. A downloaded model would be
 * bigger than the code that draws this one.
 */
import type * as THREE_NS from "three";

export interface TrophyHandle {
  destroy: () => void;
}

/** Gold, in the same family as the --swc-gold token. */
const GOLD = 0xd8b45a;
const GOLD_LIGHT = 0xf6df9a;

/**
 * Equirectangular gradient used as the scene environment.
 * Metal with no environment renders black — it has nothing to reflect. Generating a
 * gradient on a canvas gives believable reflections for a few KB, instead of pulling in
 * an HDR file or RoomEnvironment.
 */
function makeEnvironment(THREE: typeof THREE_NS): THREE_NS.Texture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, "#8fa6d8"); // sky above
  g.addColorStop(0.42, "#e8eefc"); // horizon glow
  g.addColorStop(0.5, "#ffd9a0"); // warm kesri band, so the gold picks up our brand
  g.addColorStop(0.62, "#2a3350");
  g.addColorStop(1.0, "#05070d"); // dark floor
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The cup profile, revolved into a lathe. x = radius, y = height. */
function cupProfile(THREE: typeof THREE_NS): THREE_NS.Vector2[] {
  return [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.62, 0.0),
    new THREE.Vector2(0.72, 0.06),
    new THREE.Vector2(0.78, 0.22),
    new THREE.Vector2(0.8, 0.5),
    new THREE.Vector2(0.76, 0.8),
    new THREE.Vector2(0.7, 1.0),
    new THREE.Vector2(0.72, 1.04),
    new THREE.Vector2(0.72, 1.1),
    new THREE.Vector2(0.66, 1.1),
    new THREE.Vector2(0.64, 1.02),
    new THREE.Vector2(0.0, 0.02),
  ];
}

export async function createTrophyScene(
  canvas: HTMLCanvasElement,
  opts: { dpr: number; antialias: boolean },
): Promise<TrophyHandle> {
  const THREE = await import("three");

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: opts.antialias,
    powerPreference: "low-power", // this is a decoration; never spin up the discrete GPU
  });
  renderer.setPixelRatio(opts.dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const env = makeEnvironment(THREE);
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.55, 5.1);
  camera.lookAt(0, 0.35, 0);

  const root = new THREE.Group();
  scene.add(root);

  const goldMat = new THREE.MeshStandardMaterial({
    color: GOLD,
    metalness: 1,
    roughness: 0.24,
  });
  const goldBright = new THREE.MeshStandardMaterial({
    color: GOLD_LIGHT,
    metalness: 1,
    roughness: 0.16,
  });
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x11182a,
    metalness: 0.35,
    roughness: 0.55,
  });

  // Cup
  const cup = new THREE.Mesh(
    new THREE.LatheGeometry(cupProfile(THREE), 96),
    goldMat,
  );
  cup.position.y = 0.42;
  root.add(cup);

  // Handles — a torus each side, squashed and tilted so they read as loops not rings.
  const handleGeo = new THREE.TorusGeometry(0.34, 0.055, 20, 64, Math.PI * 1.25);
  for (const side of [-1, 1]) {
    const h = new THREE.Mesh(handleGeo, goldMat);
    h.position.set(side * 0.78, 1.06, 0);
    h.rotation.z = side * -0.5;
    h.scale.set(1, 1.25, 1);
    root.add(h);
  }

  // Stem
  const stem = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.3, 0.0),
        new THREE.Vector2(0.16, 0.1),
        new THREE.Vector2(0.13, 0.3),
        new THREE.Vector2(0.24, 0.42),
        new THREE.Vector2(0.0, 0.44),
      ],
      64,
    ),
    goldBright,
  );
  stem.position.y = 0.0;
  root.add(stem);

  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.72, 0.16, 64),
    goldMat,
  );
  base.position.y = -0.08;
  root.add(base);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.88, 0.2, 64),
    plinthMat,
  );
  plinth.position.y = -0.26;
  root.add(plinth);

  root.position.y = -0.35;

  // Lights. The environment does most of the work; these add definable highlights.
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(3, 4, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xf2842b, 2.0); // kesri rim light
  rim.position.set(-4, 1.5, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x6f8fd0, 1.1);
  fill.position.set(-2, -1, 3);
  scene.add(fill);

  /* ---------- sizing ---------- */
  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  /* ---------- pointer parallax ---------- */
  let targetX = 0;
  let targetY = 0;
  const onPointer = (e: PointerEvent) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.5;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.3;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  /* ---------- render loop ----------
     Runs ONLY while the canvas is on screen and the tab is visible. A trophy spinning
     in a background tab is pure battery drain, and this thing lives on a page people
     leave open at an event. */
  let raf = 0;
  let running = false;
  let spin = 0;
  let last = performance.now();

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    spin += dt * 0.35;
    root.rotation.y = spin + targetX;
    root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, targetY * 0.5, 0.06);
    root.position.y = -0.35 + Math.sin(spin * 1.4) * 0.03; // slow float

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
  };

  const io = new IntersectionObserver(
    ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
    { threshold: 0.05 },
  );
  io.observe(canvas);

  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);

  /* ---------- teardown ----------
     Explicit disposal matters: WebGL contexts and GPU buffers are not garbage collected
     the way plain objects are, and leaking one on every client-side navigation will
     eventually crash a phone. */
  return {
    destroy() {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);

      scene.traverse((obj) => {
        const mesh = obj as THREE_NS.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      goldMat.dispose();
      goldBright.dispose();
      plinthMat.dispose();
      handleGeo.dispose();
      env.dispose();
      renderer.dispose();
    },
  };
}
