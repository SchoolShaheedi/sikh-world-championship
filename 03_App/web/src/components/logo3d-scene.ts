/**
 * Loads and displays the 3D logo (`public/brand/logo-3d.glb`).
 *
 * Only reached through a dynamic import, so Three.js and the glTF loader stay out of the
 * initial bundle. Same shape as trophy-scene.ts: idle-time load, pauses off-screen and in
 * background tabs, disposes everything on unmount.
 */
import type * as THREE_NS from "three";

export interface Logo3DHandle {
  destroy: () => void;
}

/** Same canvas-gradient environment as the trophy — metal needs something to reflect. */
function makeEnvironment(THREE: typeof THREE_NS): THREE_NS.Texture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, "#8fa6d8");
  g.addColorStop(0.42, "#e8eefc");
  g.addColorStop(0.5, "#ffd9a0");
  g.addColorStop(0.62, "#2a3350");
  g.addColorStop(1.0, "#05070d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export async function createLogo3DScene(
  canvas: HTMLCanvasElement,
  url: string,
  opts: { dpr: number; antialias: boolean },
): Promise<Logo3DHandle> {
  const THREE = await import("three");
  const { GLTFLoader } = await import(
    "three/examples/jsm/loaders/GLTFLoader.js"
  );

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: opts.antialias,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(opts.dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const env = makeEnvironment(THREE);
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(3, 4, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xf2842b, 2.0);
  rim.position.set(-4, 1.5, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x6f8fd0, 1.1);
  fill.position.set(-2, -1, 3);
  scene.add(fill);

  const gltf = await new GLTFLoader().loadAsync(url);
  const model = gltf.scene;

  /**
   * Normalise whatever comes out of the exporter: centre it on the origin and scale so
   * its largest dimension is 2 units. Without this, a model authored at millimetre scale
   * or offset from origin arrives microscopic or off-screen — and that's most exports.
   */
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  model.position.sub(centre);
  model.scale.setScalar(2 / maxDim);
  root.add(model);

  camera.position.set(0, 0.2, 4.6);
  camera.lookAt(0, 0, 0);

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

  let targetX = 0;
  let targetY = 0;
  const onPointer = (e: PointerEvent) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.5;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.3;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  let raf = 0;
  let running = false;
  let t = 0;
  let last = performance.now();

  /**
   * MOTION: a bounded sway, NOT a full rotation.
   *
   * The model is a thin textured plane — a flat card. Spinning it 360° turns it edge-on
   * (where it vanishes to a hairline) and then shows a blank back face. That's what made
   * the first version look broken.
   *
   * Instead it swings gently within about ±18°, so the face is always toward the viewer
   * and the light just travels across it. Slow and shallow reads as expensive; a full
   * spin on flat geometry reads as a mistake.
   */
  const SWAY_Y = 0.32; // radians, ~18°
  const SWAY_X = 0.10; // ~6°

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;

    // Two different periods so the motion never looks like a metronome.
    const swayY = Math.sin(t * 0.55) * SWAY_Y;
    const swayX = Math.sin(t * 0.41) * SWAY_X;

    root.rotation.y = swayY + targetX * 0.6;
    root.rotation.x = THREE.MathUtils.lerp(
      root.rotation.x,
      swayX + targetY * 0.4,
      0.08,
    );
    root.position.y = Math.sin(t * 0.7) * 0.045;

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
        const mat = mesh.material as THREE_NS.Material | THREE_NS.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      env.dispose();
      renderer.dispose();
    },
  };
}
