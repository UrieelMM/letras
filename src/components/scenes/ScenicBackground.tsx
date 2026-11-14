import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import type { ScenicBackgroundPreset } from '../../lib/scenicBackgrounds';
import { scenicPosterStyle } from './posters';
import type { BuildScene, ScenePlayback } from './scene';

const loadScene: Record<ScenicBackgroundPreset, () => Promise<BuildScene>> = {
  comicCity: () => import('./comicCity').then(({ comicCity }) => comicCity),
  jerichoCollapse: () => import('./jerichoCollapse').then(({ jerichoCollapse }) => jerichoCollapse),
  fjordStorm: () => import('./mountains').then(({ fjordStorm }) => fjordStorm),
  livingReef: () => import('./livingReef').then(({ livingReef }) => livingReef),
  alpineAurora: () => import('./mountains').then(({ alpineAurora }) => alpineAurora),
  rainbowForest: () => import('./rainbowForest').then(({ rainbowForest }) => rainbowForest),
  astronaut: () => import('./astronaut').then(({ astronaut }) => astronaut),
  gloryCross: () => import('./gloryCross').then(({ gloryCross }) => gloryCross),
  discoEighties: () => import('./discoEighties').then(({ discoEighties }) => discoEighties),
};

function disposeScene(scene: T.Scene) {
  const resources = new Set<{ dispose: () => void }>();
  scene.traverse((object) => {
    if (!(object instanceof T.Mesh || object instanceof T.Points || object instanceof T.Line)) return;
    resources.add(object.geometry);
    if (object instanceof T.InstancedMesh) resources.add(object);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) resources.add(material);
  });
  resources.forEach((resource) => resource.dispose());
}

function mountScene(target: HTMLDivElement, build: BuildScene, preset: ScenicBackgroundPreset,
  colorA: string, colorB: string, onRendered: (ready: boolean) => void) {
  const canvas = document.createElement('canvas');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer: T.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return;
  }

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(46, 16 / 9, 0.18, 510);
  function dispose() {
    canvas.remove();
    disposeScene(scene);
    renderer.dispose();
    renderer.forceContextLoss();
  }
  let playback: ScenePlayback;
  try {
    playback = build({ scene, camera, accent: new T.Color(colorA), base: new T.Color(colorB) });
  } catch (error) {
    dispose();
    console.error('No se pudo preparar el escenario 3D:', preset, error);
    return;
  }

  renderer.outputColorSpace = T.LinearSRGBColorSpace;
  canvas.className = 'absolute inset-0 block size-full';
  canvas.style.visibility = 'hidden';
  target.appendChild(canvas);

  let visible = true;
  let contextLost = false;
  let failed = false;
  let rendered = false;
  let frame = 0;
  let elapsed = 0;
  let lastFrame: number | undefined;
  let interval = 1000 / 30;

  function show(ready: boolean) {
    if (rendered === ready) return;
    rendered = ready;
    canvas.style.visibility = ready ? '' : 'hidden';
    onRendered(ready);
  }

  function fail(error: unknown) {
    failed = true;
    show(false);
    console.error('No se pudo dibujar el escenario 3D:', preset, error);
  }

  renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
    fail(gl.getProgramInfoLog(program) || gl.getShaderInfoLog(vertex) || gl.getShaderInfoLog(fragment));
  };

  function draw() {
    if (!target.clientWidth || !target.clientHeight || contextLost || failed) return;
    try {
      playback.update(preference.matches ? playback.still : elapsed);
      renderer.render(scene, camera);
      if (!failed && !renderer.getContext().isContextLost()) show(true);
    } catch (error) {
      fail(error);
    }
  }

  function tick(now: number) {
    if (lastFrame === undefined || now - lastFrame >= interval - 1) {
      if (lastFrame !== undefined) elapsed += Math.min(0.12, (now - lastFrame) / 1000);
      lastFrame = now;
      draw();
    }
    if (!failed) frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    lastFrame = undefined;
    if (!visible || document.hidden || contextLost || failed) return;
    if (preference.matches) draw();
    else frame = requestAnimationFrame(tick);
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = target;
    if (!width || !height) return;
    const costly = preset === 'fjordStorm' || preset === 'rainbowForest';
    const budget = costly ? 1280 * 720 : 1920 * 1080;
    interval = 1000 / (width < 720 || costly ? 30 : 60);
    const density = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(budget / (width * height)));
    if (renderer.getPixelRatio() !== density) renderer.setPixelRatio(density);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (visible && !document.hidden) draw();
  }

  function lost(event: Event) {
    event.preventDefault();
    contextLost = true;
    show(false);
    sync();
  }

  function restored() {
    contextLost = false;
    sync();
  }

  const sizes = new ResizeObserver(resize);
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  sizes.observe(target);
  visibility.observe(target);
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  resize();
  sync();

  return () => {
    cancelAnimationFrame(frame);
    sizes.disconnect();
    visibility.disconnect();
    preference.removeEventListener('change', sync);
    document.removeEventListener('visibilitychange', sync);
    canvas.removeEventListener('webglcontextlost', lost);
    canvas.removeEventListener('webglcontextrestored', restored);
    dispose();
  };
}

export default function ScenicBackground({ preset, colorA, colorB }: {
  preset: ScenicBackgroundPreset;
  colorA: string;
  colorB: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const target = container.current;
    if (!target) return;
    let active = true;
    let dispose: (() => void) | undefined;
    setRendered(false);
    void loadScene[preset]().then((build) => {
      if (active) dispose = mountScene(target, build, preset, colorA, colorB, setRendered);
    }).catch((error: unknown) => {
      if (active) console.error('No se pudo cargar el escenario 3D:', preset, error);
    });
    return () => {
      active = false;
      dispose?.();
    };
  }, [preset, colorA, colorB]);

  return (
    <div
      ref={container}
      data-scenic-background={preset}
      data-rendered={rendered}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-cover bg-center"
      style={scenicPosterStyle(preset, colorB)}
    />
  );
}
