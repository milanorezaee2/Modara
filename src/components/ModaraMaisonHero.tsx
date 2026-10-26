import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
import { ArrowLeft, Pause, Play, ShoppingBag, Sparkles, Star, X } from 'lucide-react';
import { supabase, type Product } from '../lib/supabase';
import { seedProducts } from '../lib/demoSeed';
import { asset, formatPrice } from '../lib/format';

type ModaraMaisonHeroProps = {
  onNavigate: (view: string, param?: string) => void;
};

type TimelineState = {
  elapsed: number;
  paused: boolean;
  hoverPaused: boolean;
  focusedSlug: string | null;
  lastInteraction: number;
};

type DragState = {
  dragging: boolean;
  startX: number;
  startY: number;
  baseYaw: number;
  basePitch: number;
  targetYaw: number;
  targetPitch: number;
  currentYaw: number;
  currentPitch: number;
};

type ProductObjectConfig = {
  slug: string;
  display: 'hanging' | 'shelf';
  texture: string;
  position: [number, number, number];
  size: [number, number];
  rotationY?: number;
  hangerDrop?: number;
  proceduralHanger?: boolean;
  focusOffset: [number, number, number];
  focusRotationY?: number;
  focusCamera: [number, number, number];
  focusTarget: [number, number, number];
  floatOffset?: number;
};

type ActCopy = {
  key: string;
  label: string;
  headline: string;
  description: string;
  theme: 'light' | 'dark';
  fallbackImage: string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const TIMELINE_DURATION = 21;
const ACT_STARTS = [0, 7, 12, 17];
const SEGMENT_DURATIONS = [7000, 5000, 5000, 4000];
const HERO_THEME_EVENT = 'modara:hero-theme';

const acts: ActCopy[] = [
  {
    key: 'wall',
    label: 'دیوار مُدارا',
    headline: 'ظرافت، در یک قاب لوکس',
    description: 'تراورتن گرم، برنج برس‌خورده و نظمی آرام؛ دیوار بوتیک مُدارا پیش روی شما.',
    theme: 'light',
    fallbackImage: '/images/hero-wall/luxury-wall-poster.jpg',
  },
  {
    key: 'rail',
    label: 'رگال نیم‌رخ',
    headline: 'لباس‌ها، در ردیفی از نور',
    description: 'دوربین از کنار رگال عبور می‌کند تا برش و افت پارچه‌ها لایه‌لایه دیده شوند.',
    theme: 'light',
    fallbackImage: '/images/hero-wall/luxury-wall-poster.jpg',
  },
  {
    key: 'shelves',
    label: 'شلف‌های طلایی',
    headline: 'جزئیات، امضای مُدارا',
    description: 'کیف، ساعت و عینک روی سه شلف سنگی، با نور اختصاصی هر قطعه.',
    theme: 'light',
    fallbackImage: '/images/hero-wall/luxury-wall-poster.jpg',
  },
];

const productObjects: ProductObjectConfig[] = [
  {
    slug: 'satin-blazer-black-women',
    display: 'hanging',
    texture: '/images/hero-wall/garment-black-satin-blazer.webp',
    position: [-2.82, 3.62, -1.28],
    size: [1.09, 1.65],
    rotationY: Math.PI / 2 - 0.03,
    hangerDrop: 0.02,
    focusOffset: [0.72, -0.02, 0.83],
    focusRotationY: 0.72,
    focusCamera: [-0.25, 2.9, 2.05],
    focusTarget: [-2.1, 2.78, -0.45],
    floatOffset: 0.4,
  },
  {
    slug: 'wool-blazer-navy-men',
    display: 'hanging',
    texture: '/images/hero-wall/garment-navy-blazer.webp',
    position: [-2.38, 3.62, -1.28],
    size: [1.11, 1.65],
    rotationY: Math.PI / 2 + 0.02,
    hangerDrop: 0.02,
    focusOffset: [0.72, -0.02, 0.83],
    focusRotationY: 0.72,
    focusCamera: [0.19, 2.9, 2.05],
    focusTarget: [-1.66, 2.78, -0.45],
    floatOffset: 1.1,
  },
  {
    slug: 'trench-coat-camel-women',
    display: 'hanging',
    texture: '/images/hero-boutique/layer-trench.webp',
    position: [-1.94, 3.62, -1.28],
    size: [1.07, 2.25],
    rotationY: Math.PI / 2 - 0.015,
    hangerDrop: 0.24,
    proceduralHanger: true,
    focusOffset: [0.72, -0.02, 0.83],
    focusRotationY: 0.72,
    focusCamera: [0.63, 2.38, 2.05],
    focusTarget: [-1.22, 2.26, -0.45],
    floatOffset: 1.8,
  },
  {
    slug: 'wide-leg-trousers-black-women',
    display: 'hanging',
    texture: '/images/hero-wall/garment-black-wide-trousers.webp',
    position: [-1.5, 3.62, -1.28],
    size: [0.92, 2.05],
    rotationY: Math.PI / 2 + 0.025,
    hangerDrop: 0.02,
    focusOffset: [0.72, -0.02, 0.83],
    focusRotationY: 0.72,
    focusCamera: [1.07, 2.7, 2.05],
    focusTarget: [-0.78, 2.58, -0.45],
    floatOffset: 2.4,
  },
  {
    slug: 'formal-trousers-charcoal-men',
    display: 'hanging',
    texture: '/images/hero-wall/garment-charcoal-trousers.webp',
    position: [-1.06, 3.62, -1.28],
    size: [0.79, 2.05],
    rotationY: Math.PI / 2 - 0.02,
    hangerDrop: 0.02,
    focusOffset: [0.72, -0.02, 0.83],
    focusRotationY: 0.72,
    focusCamera: [1.51, 2.7, 2.05],
    focusTarget: [-0.34, 2.58, -0.45],
    floatOffset: 3,
  },
  {
    slug: 'paperbag-pants-cream-women',
    display: 'hanging',
    texture: '/images/hero-boutique/layer-pants.webp',
    position: [-0.62, 3.62, -1.28],
    size: [0.8, 2],
    rotationY: Math.PI / 2 + 0.015,
    hangerDrop: 0.24,
    proceduralHanger: true,
    focusOffset: [0.72, -0.02, 0.83],
    focusRotationY: 0.72,
    focusCamera: [1.95, 2.5, 2.05],
    focusTarget: [0.1, 2.38, -0.45],
    floatOffset: 3.6,
  },
  {
    slug: 'aviator-gold-sunglasses',
    display: 'shelf',
    texture: '/images/hero-boutique/layer-glasses.webp',
    position: [-4.35, 3.36, -1.78],
    size: [1.35, 0.53],
    rotationY: -0.04,
    focusOffset: [0.28, 0.03, 0.72],
    focusRotationY: -0.18,
    focusCamera: [-2.55, 3.25, 1.55],
    focusTarget: [-4.07, 3.39, -1.06],
    floatOffset: 0.7,
  },
  {
    slug: 'luxury-gold-watch',
    display: 'shelf',
    texture: '/images/hero-boutique/layer-watch.webp',
    position: [-4.38, 2.49, -1.78],
    size: [0.47, 0.78],
    rotationY: 0.05,
    focusOffset: [0.25, 0.02, 0.7],
    focusRotationY: -0.16,
    focusCamera: [-2.85, 2.45, 1.35],
    focusTarget: [-4.13, 2.51, -1.08],
    floatOffset: 1.6,
  },
  {
    slug: 'quilted-chain-bag',
    display: 'shelf',
    texture: '/images/hero-boutique/layer-bag.webp',
    position: [-4.35, 1.44, -1.76],
    size: [1.21, 0.84],
    rotationY: -0.03,
    focusOffset: [0.25, 0.02, 0.72],
    focusRotationY: -0.18,
    focusCamera: [-2.65, 1.8, 1.7],
    focusTarget: [-4.1, 1.46, -1.04],
    floatOffset: 2.3,
  },
];

const categoryPortals = [
  { slug: 'clothing', label: 'لباس', texture: '/images/categories/category-clothing.jpg' },
  { slug: 'pants', label: 'شلوار', texture: '/images/categories/category-pants.jpg' },
  { slug: 'glasses', label: 'عینک', texture: '/images/categories/category-glasses.jpg' },
  { slug: 'watch', label: 'ساعت', texture: '/images/categories/category-watch.jpg' },
  { slug: 'bag', label: 'کیف', texture: '/images/categories/category-bag.jpg' },
  { slug: 'accessory', label: 'اکسسوری', texture: '/images/categories/category-accessory.jpg' },
];

const TEXTURE_URLS = [
  '/images/hero-wall/garment-black-satin-blazer.webp',
  '/images/hero-wall/garment-navy-blazer.webp',
  '/images/hero-boutique/layer-trench.webp',
  '/images/hero-wall/garment-black-wide-trousers.webp',
  '/images/hero-wall/garment-charcoal-trousers.webp',
  '/images/hero-boutique/layer-pants.webp',
  '/images/hero-boutique/layer-glasses.webp',
  '/images/hero-boutique/layer-watch.webp',
  '/images/hero-boutique/layer-bag.webp',
  '/images/hero-wall/texture-travertine.jpg',
  '/images/hero-wall/texture-brushed-brass.jpg',
  ...categoryPortals.map((portal) => portal.texture),
];

const cameraKeys: Array<{
  time: number;
  position: [number, number, number];
  look: [number, number, number];
  fov: number;
  roll: number;
}> = [
  { time: 0, position: [4.15, 2.45, 9.2], look: [-1.9, 2.3, -2], fov: 36, roll: 0 },
  { time: 2.5, position: [2.75, 2.3, 7.6], look: [-2.4, 2.25, -1.9], fov: 36, roll: 0 },
  { time: 7, position: [0.35, 2.08, 5.2], look: [-3.85, 2.2, -1.78], fov: 36, roll: 0 },
  { time: 9.5, position: [1.15, 2.32, 3.65], look: [-1.72, 2.32, -1.32], fov: 36, roll: 0 },
  { time: 12, position: [-3.35, 2.48, 3.15], look: [-1.68, 2.26, -1.34], fov: 36, roll: 0 },
  { time: 14.5, position: [-4.85, 1.95, 4.35], look: [-4.35, 2.12, -1.8], fov: 36, roll: 0 },
  { time: 17, position: [-2.55, 2.28, 5.9], look: [0.38, 2.27, -2], fov: 36, roll: 0 },
  { time: 19, position: [-0.65, 2.72, 7.4], look: [-1.55, 2.3, -2], fov: 36, roll: 0 },
  { time: 21, position: [0.95, 2.9, 9.05], look: [-1.85, 2.3, -2], fov: 36, roll: 0 },
];

const cameraPositionCurve = new THREE.CatmullRomCurve3(
  cameraKeys.map((key) => new THREE.Vector3(...key.position)),
  false,
  'centripetal',
  0.5,
);
const cameraLookCurve = new THREE.CatmullRomCurve3(
  cameraKeys.map((key) => new THREE.Vector3(...key.look)),
  false,
  'centripetal',
  0.5,
);

const contentVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.35 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE },
  },
};

const headlineLineVariants: Variants = {
  hidden: { y: '112%' },
  show: (line: number) => ({
    y: '0%',
    transition: { duration: 1, delay: line * 0.12, ease: EASE },
  }),
};

const pad = (value: number) => String(value).padStart(2, '0');
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function actFromTime(time: number) {
  if (time < ACT_STARTS[1]) return { act: 0, finale: false };
  if (time < ACT_STARTS[2]) return { act: 1, finale: false };
  if (time < ACT_STARTS[3]) return { act: 2, finale: false };
  return { act: 2, finale: true };
}

function sampleCamera(time: number) {
  const t = Math.min(Math.max(time, 0), TIMELINE_DURATION);
  let index = cameraKeys.findIndex((key) => t < key.time);
  if (index < 0) index = cameraKeys.length - 1;
  if (index === 0) index = 1;
  const from = cameraKeys[index - 1];
  const to = cameraKeys[index];
  const local = clamp01((t - from.time) / (to.time - from.time || 1));
  const curveT = (index - 1 + local) / (cameraKeys.length - 1);
  const position = cameraPositionCurve.getPoint(curveT);
  const look = cameraLookCurve.getPoint(curveT);
  return {
    time: t,
    position: [position.x, position.y, position.z] as [number, number, number],
    look: [look.x, look.y, look.z] as [number, number, number],
    fov: 36,
    roll: 0,
  };
}

function useWalnutMaps() {
  return useMemo(() => {
    const makeCanvas = (bump: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const context = canvas.getContext('2d');
      if (!context) return canvas;
      context.fillStyle = bump ? '#808080' : '#2b1a10';
      context.fillRect(0, 0, canvas.width, canvas.height);
      let seed = 417;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };

      for (let i = 0; i < 125; i += 1) {
        const x = random() * canvas.width;
        const drift = (random() - 0.5) * 26;
        context.strokeStyle = bump
          ? `rgba(${86 + random() * 92}, ${86 + random() * 92}, ${86 + random() * 92}, ${0.22 + random() * 0.3})`
          : `rgba(${58 + random() * 58}, ${34 + random() * 34}, ${17 + random() * 20}, ${0.16 + random() * 0.28})`;
        context.lineWidth = 0.6 + random() * 2.8;
        context.beginPath();
        context.moveTo(x, -24);
        context.bezierCurveTo(x + drift, 280, x - drift, 700, x + drift * 0.4, 1048);
        context.stroke();
      }

      for (let i = 0; i < 1500; i += 1) {
        const x = random() * canvas.width;
        const y = random() * canvas.height;
        context.fillStyle = bump
          ? `rgba(255,255,255,${0.025 + random() * 0.05})`
          : `rgba(214,164,105,${0.018 + random() * 0.045})`;
        context.fillRect(x, y, 0.7 + random() * 1.1, 8 + random() * 34);
      }
      return canvas;
    };

    const map = new THREE.CanvasTexture(makeCanvas(false));
    map.wrapS = THREE.MirroredRepeatWrapping;
    map.wrapT = THREE.MirroredRepeatWrapping;
    map.repeat.set(1.6, 1.1);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;

    const bumpMap = new THREE.CanvasTexture(makeCanvas(true));
    bumpMap.wrapS = THREE.MirroredRepeatWrapping;
    bumpMap.wrapT = THREE.MirroredRepeatWrapping;
    bumpMap.repeat.copy(map.repeat);
    bumpMap.anisotropy = 8;
    return { map, bumpMap };
  }, []);
}

function useRadialShadowTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 126);
      gradient.addColorStop(0, 'rgba(12,7,2,0.62)');
      gradient.addColorStop(0.48, 'rgba(12,7,2,0.28)');
      gradient.addColorStop(1, 'rgba(12,7,2,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

function cloneSurfaceMap(
  source: THREE.Texture | undefined,
  repeat: [number, number],
  srgb = true,
  offset: [number, number] = [0, 0],
) {
  if (!source) return undefined;
  const texture = source.clone();
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.offset.set(offset[0], offset[1]);
  texture.center.set(0.5, 0.5);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function EnvironmentSetup() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    RectAreaLightUniformsLib.init();
    const pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.42;
    return () => {
      scene.environment = null;
      scene.environmentIntensity = 1;
      environment.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}

function RoundedBox({
  size,
  radius = 0.02,
  position,
  rotation,
  material,
  castShadow = false,
  receiveShadow = false,
}: {
  size: [number, number, number];
  radius?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  material?: THREE.Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const [width, height, depth] = size;
  const geometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        width,
        height,
        depth,
        3,
        Math.min(radius, Math.min(width, height, depth) / 2.05),
      ),
    [depth, height, radius, width],
  );
  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      material={material}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}

function BayFrame({
  center,
  width,
  height,
  z,
  material,
}: {
  center: number;
  width: number;
  height: number;
  z: number;
  material: THREE.Material;
}) {
  return (
    <group position={[center, 2.35, z]}>
      <RoundedBox size={[width, 0.045, 0.05]} radius={0.012} position={[0, height / 2, 0]} material={material} castShadow />
      <RoundedBox size={[width, 0.045, 0.05]} radius={0.012} position={[0, -height / 2, 0]} material={material} castShadow />
      <RoundedBox size={[0.045, height, 0.05]} radius={0.012} position={[-width / 2, 0, 0]} material={material} castShadow />
      <RoundedBox size={[0.045, height, 0.05]} radius={0.012} position={[width / 2, 0, 0]} material={material} castShadow />
    </group>
  );
}

function Architecture({ textures }: { textures: Map<string, THREE.Texture> }) {
  const stoneSource = textures.get('/images/hero-wall/texture-travertine.jpg');
  const brassSource = textures.get('/images/hero-wall/texture-brushed-brass.jpg');
  const walnutMaps = useWalnutMaps();
  const contactShadowTexture = useRadialShadowTexture();

  const surfaceMaps = useMemo(
    () => ({
      wall: cloneSurfaceMap(stoneSource, [5.5, 4]),
      wallBump: cloneSurfaceMap(stoneSource, [5.5, 4], false),
      floor: cloneSurfaceMap(stoneSource, [4, 6.5], true, [0.17, 0.31]),
      floorBump: cloneSurfaceMap(stoneSource, [4, 6.5], false, [0.17, 0.31]),
      panel: cloneSurfaceMap(stoneSource, [2.4, 1.8], true, [0.42, 0.18]),
      panelBump: cloneSurfaceMap(stoneSource, [2.4, 1.8], false, [0.42, 0.18]),
      shelf: cloneSurfaceMap(stoneSource, [1.5, 0.75], true, [0.08, 0.52]),
      shelfBump: cloneSurfaceMap(stoneSource, [1.5, 0.75], false, [0.08, 0.52]),
      brass: cloneSurfaceMap(brassSource, [2, 1]),
      brassBump: cloneSurfaceMap(brassSource, [2, 1], false),
    }),
    [brassSource, stoneSource],
  );

  const materials = useMemo(
    () => ({
      stone: new THREE.MeshStandardMaterial({
        map: surfaceMaps.wall,
        bumpMap: surfaceMaps.wallBump,
        bumpScale: 0.028,
        color: '#f4e9d4',
        roughness: 0.63,
        metalness: 0.0,
        envMapIntensity: 0.38,
      }),
      shelfStone: new THREE.MeshStandardMaterial({
        map: surfaceMaps.shelf,
        bumpMap: surfaceMaps.shelfBump,
        bumpScale: 0.02,
        color: '#f4e9d4',
        roughness: 0.52,
        metalness: 0.0,
        envMapIntensity: 0.48,
      }),
      floor: new THREE.MeshPhysicalMaterial({
        map: surfaceMaps.floor,
        bumpMap: surfaceMaps.floorBump,
        bumpScale: 0.011,
        color: '#e9d8ba',
        roughness: 0.34,
        metalness: 0.0,
        clearcoat: 0.38,
        clearcoatRoughness: 0.28,
        envMapIntensity: 0.62,
      }),
      palePanel: new THREE.MeshStandardMaterial({
        map: surfaceMaps.panel,
        bumpMap: surfaceMaps.panelBump,
        bumpScale: 0.024,
        color: '#dcc49c',
        roughness: 0.68,
        metalness: 0.0,
        envMapIntensity: 0.34,
      }),
      walnut: new THREE.MeshStandardMaterial({
        map: walnutMaps.map,
        bumpMap: walnutMaps.bumpMap,
        bumpScale: 0.016,
        color: '#d9c7b2',
        roughness: 0.48,
        metalness: 0.0,
        envMapIntensity: 0.32,
      }),
      walnutLight: new THREE.MeshStandardMaterial({
        map: walnutMaps.map,
        bumpMap: walnutMaps.bumpMap,
        bumpScale: 0.012,
        color: '#ead6bd',
        roughness: 0.54,
        metalness: 0.0,
        envMapIntensity: 0.3,
      }),
      brass: new THREE.MeshStandardMaterial({
        map: surfaceMaps.brass,
        bumpMap: surfaceMaps.brassBump,
        bumpScale: 0.006,
        color: '#d8bd80',
        metalness: 1,
        roughness: 0.3,
        envMapIntensity: 0.92,
      }),
      bronze: new THREE.MeshStandardMaterial({
        map: surfaceMaps.brass,
        bumpMap: surfaceMaps.brassBump,
        bumpScale: 0.006,
        color: '#8f6f35',
        metalness: 0.96,
        roughness: 0.39,
        envMapIntensity: 0.72,
      }),
      black: new THREE.MeshStandardMaterial({ color: '#171008', roughness: 0.42, metalness: 0.28, envMapIntensity: 0.5 }),
      led: new THREE.MeshBasicMaterial({ color: '#ffe9bb', toneMapped: false }),
      contactShadow: new THREE.MeshBasicMaterial({
        map: contactShadowTexture,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      }),
      floorSeam: new THREE.MeshBasicMaterial({ color: '#7d6242', transparent: true, opacity: 0.17, depthWrite: false }),
    }),
    [contactShadowTexture, surfaceMaps, walnutMaps],
  );

  const shelfTops = [1.02, 2.02, 3.02];
  const spotlightX = [-4.35, -1.72, 0.55];

  return (
    <group>
      {/* Polished stone floor and room shell */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.8, 0, 1]} material={materials.floor} receiveShadow>
        <planeGeometry args={[18, 16]} />
      </mesh>
      {[-1.1, 1.15, 3.4, 5.65].map((z) => (
        <mesh key={`floor-seam-z-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[-0.8, 0.004, z]} material={materials.floorSeam}>
          <planeGeometry args={[16, 0.018]} />
        </mesh>
      ))}
      {[-5.2, -2.7, -0.2, 2.3, 4.8].map((x) => (
        <mesh key={`floor-seam-x-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, 1]} material={materials.floorSeam}>
          <planeGeometry args={[0.018, 14]} />
        </mesh>
      ))}
      <mesh position={[-0.8, 3.2, -2.38]} material={materials.stone} receiveShadow>
        <boxGeometry args={[16, 6.4, 0.25]} />
      </mesh>
      <mesh position={[-7.9, 3.1, 1]} rotation={[0, Math.PI / 2, 0]} material={materials.palePanel} receiveShadow>
        <planeGeometry args={[16, 6.2]} />
      </mesh>
      <mesh position={[7.3, 3.1, 1]} rotation={[0, -Math.PI / 2, 0]} material={materials.palePanel} receiveShadow>
        <planeGeometry args={[16, 6.2]} />
      </mesh>
      <mesh position={[-0.8, 5.48, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#2a1c0f" roughness={0.88} />
      </mesh>
      <mesh position={[-0.8, 5.02, -1.05]} material={materials.stone} castShadow receiveShadow>
        <boxGeometry args={[15, 0.34, 2.35]} />
      </mesh>
      <mesh position={[-0.8, 0.1, -2.22]} material={materials.bronze}>
        <boxGeometry args={[15, 0.2, 0.055]} />
      </mesh>

      {/* Quiet stone panel seams */}
      {[-6.2, -3.05, -0.15, 1.65, 3.8].map((x) => (
        <mesh key={x} position={[x, 2.7, -2.245]} material={materials.bronze}>
          <boxGeometry args={[0.022, 5.3, 0.018]} />
        </mesh>
      ))}

      {/* Three recessed display bays */}
      <RoundedBox size={[2.62, 3.9, 0.1]} radius={0.018} position={[-4.38, 2.35, -2.2]} material={materials.walnut} receiveShadow />
      <RoundedBox size={[2.6, 3.9, 0.08]} radius={0.015} position={[-1.72, 2.35, -2.21]} material={materials.palePanel} receiveShadow />
      <RoundedBox size={[1.86, 3.9, 0.1]} radius={0.018} position={[0.55, 2.35, -2.2]} material={materials.walnut} receiveShadow />
      <BayFrame center={-4.38} width={2.65} height={3.93} z={-2.13} material={materials.brass} />
      <BayFrame center={-1.72} width={2.63} height={3.93} z={-2.14} material={materials.brass} />
      <BayFrame center={0.55} width={1.89} height={3.93} z={-2.13} material={materials.brass} />

      {/* Fine vertical walnut fluting */}
      {Array.from({ length: 13 }, (_, index) => -5.55 + index * 0.2).map((x) => (
        <mesh key={`shelf-flute-${x}`} position={[x, 2.35, -2.145]} material={materials.walnutLight}>
          <boxGeometry args={[0.025, 3.72, 0.018]} />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, index) => -0.32 + index * 0.2).map((x) => (
        <mesh key={`cat-flute-${x}`} position={[x, 2.35, -2.145]} material={materials.walnutLight}>
          <boxGeometry args={[0.025, 3.72, 0.018]} />
        </mesh>
      ))}


      {/* Three floating stone shelves with brass edges and under-lighting */}
      {shelfTops.map((top) => (
        <group key={top}>
          <RoundedBox
            size={[2.45, 0.11, 0.62]}
            radius={0.018}
            position={[-4.35, top - 0.055, -1.86]}
            material={materials.shelfStone}
            castShadow
            receiveShadow
          />
          <mesh position={[-4.35, top - 0.018, -1.54]} material={materials.brass}>
            <boxGeometry args={[2.45, 0.026, 0.026]} />
          </mesh>
          <mesh position={[-4.35, top - 0.125, -1.62]} material={materials.led}>
            <boxGeometry args={[2.2, 0.018, 0.018]} />
          </mesh>
          {[-5.32, -3.38].map((x) => (
            <mesh key={x} position={[x, top - 0.25, -2.02]} material={materials.bronze} castShadow>
              <boxGeometry args={[0.055, 0.3, 0.3]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Display plinths for eyewear and watch */}
      <RoundedBox size={[1.12, 0.07, 0.34]} radius={0.012} position={[-4.35, 3.055, -1.76]} material={materials.bronze} castShadow receiveShadow />
      <RoundedBox size={[0.52, 0.08, 0.32]} radius={0.012} position={[-4.38, 2.06, -1.76]} material={materials.bronze} castShadow receiveShadow />

      {/* Wall-mounted side-profile garment rail */}
      <mesh position={[-1.72, 3.62, -1.28]} rotation={[0, 0, Math.PI / 2]} material={materials.brass} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 2.55, 20]} />
      </mesh>
      {[-2.99, -0.45].map((x) => (
        <mesh key={x} position={[x, 3.62, -1.28]} material={materials.brass} castShadow>
          <sphereGeometry args={[0.062, 20, 20]} />
        </mesh>
      ))}
      {[-2.92, -1.72, -0.52].map((x) => (
        <group key={x}>
          <mesh position={[x, 3.62, -2.16]} material={materials.bronze} castShadow>
            <boxGeometry args={[0.17, 0.46, 0.055]} />
          </mesh>
          <mesh position={[x, 3.62, -1.72]} rotation={[Math.PI / 2, 0, 0]} material={materials.brass} castShadow>
            <cylinderGeometry args={[0.026, 0.026, 0.92, 16]} />
          </mesh>
          <mesh position={[x, 3.34, -1.76]} rotation={[0.62, 0, 0]} material={materials.bronze} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.98, 14]} />
          </mesh>
        </group>
      ))}

      {/* Ceiling track and museum spotlights */}
      <mesh position={[-1.75, 4.83, -0.35]} material={materials.black}>
        <boxGeometry args={[8.6, 0.055, 0.09]} />
      </mesh>
      {spotlightX.map((x) => (
        <group key={x} position={[x, 4.72, -0.35]}>
          <mesh rotation={[0.34, 0, 0]} material={materials.black} castShadow>
            <cylinderGeometry args={[0.075, 0.095, 0.28, 20]} />
          </mesh>
          <mesh position={[0, -0.13, -0.045]} rotation={[Math.PI / 2 + 0.34, 0, 0]} material={materials.led}>
            <circleGeometry args={[0.052, 20]} />
          </mesh>
        </group>
      ))}
      {/* Flush brass floor inlay */}
      <mesh position={[-1.68, 0.008, -0.45]} material={materials.brass}>
        <boxGeometry args={[6.7, 0.008, 0.026]} />
      </mesh>

      {/* Soft baked ambient-occlusion pools */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.72, 0.012, -1.2]} material={materials.contactShadow} renderOrder={1}>
        <planeGeometry args={[4.3, 1.7]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.35, 0.013, -1.55]} material={materials.contactShadow} renderOrder={1}>
        <planeGeometry args={[3.3, 1.3]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.85, 0.014, 0.95]} material={materials.contactShadow} renderOrder={1}>
        <planeGeometry args={[3.1, 1.05]} />
      </mesh>

      {/* Low stone bench for foreground depth */}
      <group position={[-1.85, 0, 0.95]}>
        <RoundedBox size={[2.45, 0.2, 0.62]} radius={0.028} position={[0, 0.31, 0]} material={materials.shelfStone} castShadow receiveShadow />
        {[-1.02, 1.02].map((x) => (
          <mesh key={x} position={[x, 0.11, 0]} material={materials.bronze} castShadow>
            <boxGeometry args={[0.12, 0.22, 0.46]} />
          </mesh>
        ))}
        <mesh position={[-0.45, 0.46, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.72, 0.09, 0.44]} />
          <meshStandardMaterial color="#e9dcc2" roughness={0.82} />
        </mesh>
        <mesh position={[-0.45, 0.52, 0]} castShadow>
          <boxGeometry args={[0.58, 0.035, 0.36]} />
          <meshStandardMaterial color="#c9b083" roughness={0.78} />
        </mesh>
      </group>

      {/* Foreground stone portals create parallax without cluttering the wall */}
      {[-6.35, 4.9].map((x) => (
        <RoundedBox key={x} size={[0.34, 5.3, 0.34]} radius={0.025} position={[x, 2.65, 2.55]} material={materials.palePanel} castShadow receiveShadow />
      ))}
    </group>
  );
}

function Particles({ lowQuality }: { lowQuality: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = lowQuality ? 32 : 72;
    const positions = new Float32Array(count * 3);
    let seed = 197;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = -6.2 + random() * 10.5;
      positions[i * 3 + 1] = 0.3 + random() * 4.4;
      positions[i * 3 + 2] = -1.7 + random() * 6.4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [lowQuality]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.position.y = Math.sin(clock.elapsedTime * 0.12) * 0.035;
    pointsRef.current.position.x = Math.sin(clock.elapsedTime * 0.05) * 0.025;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#ffd98a"
        size={0.016}
        transparent
        opacity={0.12}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function ProductObject({
  config,
  texture,
  isHovered,
  isFocused,
  onHover,
  onFocus,
}: {
  config: ProductObjectConfig;
  texture: THREE.Texture;
  isHovered: boolean;
  isFocused: boolean;
  onHover: (slug: string | null) => void;
  onFocus: (slug: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isHanging = config.display === 'hanging';
  const hangerDrop = config.hangerDrop ?? 0;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(config.size[0], config.size[1], 28, 20);
    const positions = geo.attributes.position;
    const phase = config.floatOffset ?? 0;
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const nx = x / (config.size[0] / 2);
      const ny = y / (config.size[1] / 2);
      const hang = (1 - ny) / 2;
      const bodyCurve = -0.055 * (1 - nx * nx);
      const fabricWave = isHanging
        ? (Math.sin(nx * 3.1 + phase) * 0.009 + Math.sin(nx * 7.3 + phase * 1.7) * 0.0035) * (0.35 + hang * 0.65)
        : 0;
      positions.setZ(i, bodyCurve + fabricWave);
    }
    geo.computeVertexNormals();
    return geo;
  }, [config.floatOffset, config.size, isHanging]);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const t = clock.elapsedTime + (config.floatOffset ?? 0);
    const targetX = config.position[0] + (isFocused ? config.focusOffset[0] : 0);
    const targetY = config.position[1] + (isFocused ? config.focusOffset[1] : 0);
    const targetZ = config.position[2] + (isFocused ? config.focusOffset[2] : 0);
    group.position.x = THREE.MathUtils.damp(group.position.x, targetX, 3.6, delta);
    group.position.y = THREE.MathUtils.damp(group.position.y, targetY, 3.6, delta);
    group.position.z = THREE.MathUtils.damp(group.position.z, targetZ, 3.6, delta);

    const baseRotation = config.rotationY ?? 0;
    const idleRotation = isHanging ? Math.sin(t * 0.38) * 0.006 : 0;
    const targetRotation = isFocused
      ? config.focusRotationY ?? baseRotation
      : baseRotation + idleRotation + (isHovered ? 0.05 : 0);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetRotation, 4, delta);
    group.rotation.x = THREE.MathUtils.damp(
      group.rotation.x,
      isHanging ? Math.sin(t * 0.55) * (isFocused ? 0.0035 : 0.008) : 0,
      3.2,
      delta,
    );
    group.rotation.z = THREE.MathUtils.damp(
      group.rotation.z,
      isHanging ? Math.sin(t * 0.36) * 0.002 : 0,
      3.2,
      delta,
    );

    const targetScale = isFocused ? 1.035 : isHovered ? 1.018 : 1;
    group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, targetScale, 5, delta));
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 7) return;
    event.stopPropagation();
    onFocus(config.slug);
  };

  const planeContent = (
    <>
      <mesh geometry={geometry} position={[0, 0, -0.026]} scale={1.004}>
        <meshStandardMaterial
          map={texture}
          color="#5d4c38"
          transparent
          opacity={0.15}
          alphaTest={0.045}
          side={THREE.DoubleSide}
          roughness={0.78}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.045}
          side={THREE.DoubleSide}
          roughness={0.74}
          metalness={0.0}
          envMapIntensity={0.22}
          emissive="#fff6e6"
          emissiveMap={texture}
          emissiveIntensity={0.035}
        />
      </mesh>
      {(isHovered || isFocused) && (
        <mesh geometry={geometry} position={[0, 0, -0.044]} scale={1.025}>
          <meshBasicMaterial
            map={texture}
            color="#d8b96d"
            transparent
            opacity={0.1}
            alphaTest={0.04}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  );

  return (
    <group
      ref={groupRef}
      position={config.position}
      rotation={[0, config.rotationY ?? 0, 0]}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(config.slug);
      }}
      onPointerOut={() => onHover(null)}
      onClick={handleClick}
    >
      {isHanging ? (
        <>
          {config.proceduralHanger && (
            <group>
              <mesh position={[0, -0.045, 0]}>
                <torusGeometry args={[0.075, 0.007, 8, 24, Math.PI]} />
                <meshStandardMaterial color="#c9a45c" metalness={0.9} roughness={0.22} />
              </mesh>
              <mesh position={[0, -0.12, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.16, 8]} />
                <meshStandardMaterial color="#a97d2f" metalness={0.88} roughness={0.24} />
              </mesh>
              {[-1, 1].map((sign) => (
                <mesh key={sign} position={[sign * 0.17, -0.19, 0]} rotation={[0, 0, sign * 0.48]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.42, 8]} />
                  <meshStandardMaterial color="#a97d2f" metalness={0.88} roughness={0.24} />
                </mesh>
              ))}
            </group>
          )}
          <group position={[0, -hangerDrop - config.size[1] / 2, 0]}>{planeContent}</group>
        </>
      ) : (
        planeContent
      )}
    </group>
  );
}

function CategoryWall({
  textures,
  timelineRef,
  onNavigate,
}: {
  textures: Map<string, THREE.Texture>;
  timelineRef: MutableRefObject<TimelineState>;
  onNavigate: (slug: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const reveal = smoothstep((timelineRef.current.elapsed - 16.35) / 1.5);
    groupRef.current.position.z = -2.03 + reveal * 0.035;
  });

  return (
    <group ref={groupRef} position={[0, 0, -2.03]}>
      {categoryPortals.map((portal, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = 0.08 + column * 0.94;
        const y = 3.34 - row * 1.16;
        const texture = textures.get(portal.texture);
        if (!texture) return null;
        return (
          <group
            key={portal.slug}
            position={[x, y, 0]}
            onClick={(event) => {
              if (event.delta > 7) return;
              event.stopPropagation();
              onNavigate(portal.slug);
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
          >
            <mesh position={[0, 0, -0.035]} castShadow>
              <boxGeometry args={[0.84, 1.1, 0.07]} />
              <meshStandardMaterial color="#8a611f" metalness={0.88} roughness={0.3} envMapIntensity={0.65} />
            </mesh>
            <mesh>
              <planeGeometry args={[0.76, 1.02]} />
              <meshPhysicalMaterial map={texture} roughness={0.48} clearcoat={0.22} clearcoatRoughness={0.35} envMapIntensity={0.3} />
            </mesh>
            <mesh position={[0, -0.61, 0.012]}>
              <boxGeometry args={[0.58, 0.018, 0.02]} />
              <meshBasicMaterial color="#ffe9bb" toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function CameraRig({
  timelineRef,
  dragRef,
  focusedConfig,
  prefersReducedMotion,
  onTimeline,
  onReady,
  onLowPerformance,
}: {
  timelineRef: MutableRefObject<TimelineState>;
  dragRef: MutableRefObject<DragState>;
  focusedConfig: ProductObjectConfig | null;
  prefersReducedMotion: boolean;
  onTimeline: (act: number, finale: boolean) => void;
  onReady: () => void;
  onLowPerformance: () => void;
}) {
  const camera = useThree((state) => state.camera);
  const lookRef = useRef(new THREE.Vector3(-1.9, 2.3, -2));
  const rollRef = useRef(0);
  const readyRef = useRef(false);
  const perfRef = useRef({ frames: 0, startedAt: 0, checked: false });
  const previousElapsedRef = useRef(0);

  useFrame((state, delta) => {
    if (!readyRef.current) {
      readyRef.current = true;
      onReady();
      perfRef.current.startedAt = state.clock.elapsedTime;
    }

    if (!perfRef.current.checked) {
      perfRef.current.frames += 1;
      const elapsedReal = state.clock.elapsedTime - perfRef.current.startedAt;
      if (elapsedReal > 2.5) {
        perfRef.current.checked = true;
        if (perfRef.current.frames / elapsedReal < 45) onLowPerformance();
      }
    }

    const timeline = timelineRef.current;
    const idleFor = performance.now() - timeline.lastInteraction;
    const shouldPause =
      timeline.paused || timeline.hoverPaused || Boolean(timeline.focusedSlug) || idleFor < 4000;

    if (!prefersReducedMotion && !shouldPause) {
      timeline.elapsed += Math.min(delta, 0.05);
      if (timeline.elapsed >= TIMELINE_DURATION) timeline.elapsed = 0;
    }

    const { act, finale } = actFromTime(timeline.elapsed);
    onTimeline(act, finale);

    const drag = dragRef.current;
    if (!drag.dragging && idleFor > 4000) {
      drag.targetYaw = THREE.MathUtils.damp(drag.targetYaw, 0, 0.7, delta);
      drag.targetPitch = THREE.MathUtils.damp(drag.targetPitch, 0, 0.7, delta);
    }
    drag.currentYaw = THREE.MathUtils.damp(drag.currentYaw, drag.targetYaw, 5, delta);
    drag.currentPitch = THREE.MathUtils.damp(drag.currentPitch, drag.targetPitch, 5, delta);

    const sampled = sampleCamera(timeline.elapsed);
    const desiredPosition = new THREE.Vector3(...sampled.position);
    const desiredLook = new THREE.Vector3(...sampled.look);

    if (focusedConfig) {
      desiredPosition.set(...focusedConfig.focusCamera);
      desiredLook.set(...focusedConfig.focusTarget);
    } else if (!prefersReducedMotion) {
      const micro = state.clock.elapsedTime;
      desiredPosition.x += Math.sin(micro * 0.42) * 0.012;
      desiredPosition.y += Math.sin(micro * 0.57 + 1.2) * 0.008;
      desiredPosition.z += Math.sin(micro * 0.36 + 0.5) * 0.01;
      desiredLook.x += Math.sin(micro * 0.29) * 0.018;
      desiredLook.y += Math.sin(micro * 0.49) * 0.012;
    }

    desiredPosition.x += drag.currentYaw * 0.42;
    desiredPosition.y += drag.currentPitch * 0.2;
    desiredPosition.z += -Math.abs(drag.currentYaw) * 0.06;
    desiredLook.x += drag.currentYaw * 1.55;
    desiredLook.y += drag.currentPitch * 0.78;

    const rollTarget =
      drag.currentYaw * -0.012 +
      (!prefersReducedMotion && !focusedConfig ? Math.sin(state.clock.elapsedTime * 0.27) * 0.0015 : 0);

    const lambda = prefersReducedMotion ? 14 : 2.55;
    const wrapped = previousElapsedRef.current > timeline.elapsed + 10;
    if (wrapped) {
      camera.position.copy(desiredPosition);
      lookRef.current.copy(desiredLook);
      rollRef.current = rollTarget;
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredPosition.x, lambda, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredPosition.y, lambda, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredPosition.z, lambda, delta);
      lookRef.current.x = THREE.MathUtils.damp(lookRef.current.x, desiredLook.x, lambda, delta);
      lookRef.current.y = THREE.MathUtils.damp(lookRef.current.y, desiredLook.y, lambda, delta);
      lookRef.current.z = THREE.MathUtils.damp(lookRef.current.z, desiredLook.z, lambda, delta);
      rollRef.current = THREE.MathUtils.damp(rollRef.current, rollTarget, 3.2, delta);
    }
    previousElapsedRef.current = timeline.elapsed;
    camera.lookAt(lookRef.current);
    camera.rotateZ(rollRef.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = state.size.width / Math.max(state.size.height, 1);
      const baseFov = aspect < 0.75 ? 58 : aspect < 1.15 ? 47 : 36;
      const targetFov = baseFov;
      const nextFov = THREE.MathUtils.damp(camera.fov, targetFov, 2.2, delta);
      if (Math.abs(nextFov - camera.fov) > 0.01) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
}

function FadePlane({ timelineRef }: { timelineRef: MutableRefObject<TimelineState> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const camera = useThree((state) => state.camera);
  const direction = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    camera.getWorldDirection(direction);
    mesh.position.copy(camera.position).addScaledVector(direction, 0.55);
    mesh.quaternion.copy(camera.quaternion);
    const time = timelineRef.current.elapsed;
    const opacity = time > 20.35 ? (time - 20.35) / 0.65 : time < 0.45 ? 1 - time / 0.45 : 0;
    (mesh.material as THREE.MeshBasicMaterial).opacity = clamp01(opacity);
  });

  return (
    <mesh ref={meshRef} renderOrder={999}>
      <planeGeometry args={[4, 4]} />
      <meshBasicMaterial color="#070402" transparent opacity={1} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

function Softbox({
  position,
  target,
  width,
  height,
  intensity,
  color = '#fff1d6',
}: {
  position: [number, number, number];
  target: [number, number, number];
  width: number;
  height: number;
  intensity: number;
  color?: string;
}) {
  const lightRef = useRef<THREE.RectAreaLight>(null);
  useEffect(() => {
    lightRef.current?.lookAt(target[0], target[1], target[2]);
  }, [target]);
  return <rectAreaLight ref={lightRef} position={position} width={width} height={height} intensity={intensity} color={color} />;
}

function BaySpotlight({
  position,
  target,
  intensity,
  angle,
  castShadow = false,
}: {
  position: [number, number, number];
  target: [number, number, number];
  intensity: number;
  angle: number;
  castShadow?: boolean;
}) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Group>(null);
  useEffect(() => {
    if (lightRef.current && targetRef.current) lightRef.current.target = targetRef.current;
  }, []);
  return (
    <>
      <group ref={targetRef} position={target} />
      <spotLight
        ref={lightRef}
        position={position}
        intensity={intensity}
        angle={angle}
        penumbra={1}
        decay={1.55}
        distance={10}
        color="#ffe3ae"
        castShadow={castShadow}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00025}
        shadow-normalBias={0.02}
      />
    </>
  );
}

function MaisonScene({
  timelineRef,
  dragRef,
  focusedSlug,
  hoveredSlug,
  lowQuality,
  prefersReducedMotion,
  onHover,
  onFocus,
  onNavigateCategory,
  onTimeline,
  onReady,
  onLowPerformance,
}: {
  timelineRef: MutableRefObject<TimelineState>;
  dragRef: MutableRefObject<DragState>;
  focusedSlug: string | null;
  hoveredSlug: string | null;
  lowQuality: boolean;
  prefersReducedMotion: boolean;
  onHover: (slug: string | null) => void;
  onFocus: (slug: string) => void;
  onNavigateCategory: (slug: string) => void;
  onTimeline: (act: number, finale: boolean) => void;
  onReady: () => void;
  onLowPerformance: () => void;
}) {
  const loadedTextures = useLoader(THREE.TextureLoader, TEXTURE_URLS.map(asset));
  const textures = useMemo(() => {
    loadedTextures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
    });
    return new Map(TEXTURE_URLS.map((url, index) => [url, loadedTextures[index]]));
  }, [loadedTextures]);

  const focusedConfig = productObjects.find((config) => config.slug === focusedSlug) ?? null;

  return (
    <>
      <EnvironmentSetup />
      <ambientLight intensity={0.08} />
      <hemisphereLight args={['#fff2d0', '#2a1a0d', 0.28]} />
      <Softbox position={[3.6, 4.3, 5]} target={[-1.8, 2.1, -1.8]} width={7} height={4} intensity={2.35} />
      <Softbox position={[-5.2, 3.4, 3.6]} target={[-3.1, 2.05, -1.8]} width={5} height={3} intensity={1.05} />
      <directionalLight
        position={[4.8, 6.4, 5.2]}
        intensity={0.52}
        color="#fff0d2"
        castShadow={!lowQuality}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-4}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-bias={-0.00028}
        shadow-normalBias={0.025}
      />
      <BaySpotlight position={[-4.35, 4.65, -0.32]} target={[-4.38, 2.05, -1.85]} intensity={19} angle={0.48} />
      <BaySpotlight position={[-1.72, 4.68, -0.22]} target={[-1.72, 2.05, -1.34]} intensity={23} angle={0.55} castShadow={!lowQuality} />
      <BaySpotlight position={[0.55, 4.65, -0.32]} target={[0.55, 2.2, -2]} intensity={16} angle={0.46} />

      <Architecture textures={textures} />
      <Particles lowQuality={lowQuality} />

      {productObjects.map((config) => {
        const texture = textures.get(config.texture);
        if (!texture) return null;
        return (
          <ProductObject
            key={config.slug}
            config={config}
            texture={texture}
            isHovered={hoveredSlug === config.slug}
            isFocused={focusedSlug === config.slug}
            onHover={onHover}
            onFocus={onFocus}
          />
        );
      })}

      <CategoryWall textures={textures} timelineRef={timelineRef} onNavigate={onNavigateCategory} />
      <CameraRig
        timelineRef={timelineRef}
        dragRef={dragRef}
        focusedConfig={focusedConfig}
        prefersReducedMotion={prefersReducedMotion}
        onTimeline={onTimeline}
        onReady={onReady}
        onLowPerformance={onLowPerformance}
      />
      <FadePlane timelineRef={timelineRef} />
    </>
  );
}

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

export default function ModaraMaisonHero({ onNavigate }: ModaraMaisonHeroProps) {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [activeAct, setActiveAct] = useState(0);
  const [isFinale, setIsFinale] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);
  const [manualPaused, setManualPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [inView, setInView] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [lowQuality, setLowQuality] = useState(false);
  const [webglOk] = useState(canUseWebGL);
  const prefersReducedMotion = Boolean(useReducedMotion());

  const sectionRef = useRef<HTMLElement | null>(null);
  const lastThemeRef = useRef('');
  const timelineRef = useRef<TimelineState>({
    elapsed: 0,
    paused: false,
    hoverPaused: false,
    focusedSlug: null,
    lastInteraction: 0,
  });
  const dragRef = useRef<DragState>({
    dragging: false,
    startX: 0,
    startY: 0,
    baseYaw: 0,
    basePitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    currentYaw: 0,
    currentPitch: 0,
  });

  const activeCopy = isFinale
    ? {
        label: 'نمای کامل',
        headline: 'دیوار مُدارا، پیش روی شما',
        description: 'شش قاب دسته‌بندی روی دیوار روشن شده‌اند؛ یکی را انتخاب کنید و وارد فروشگاه شوید.',
        theme: 'light' as const,
        fallbackImage: acts[2].fallbackImage,
      }
    : acts[activeAct];
  const isDark = activeCopy.theme === 'dark';
  const focusedProduct = focusedSlug
    ? products.find((product) => product.slug === focusedSlug) ??
      seedProducts.find((product) => product.slug === focusedSlug)
    : null;
  const timelineSegment = isFinale ? 3 : activeAct;
  const progressPaused = manualPaused || tabHidden || Boolean(focusedSlug) || Boolean(hoveredSlug);

  useEffect(() => {
    timelineRef.current.paused = manualPaused || tabHidden || !inView;
    timelineRef.current.hoverPaused = Boolean(hoveredSlug);
    timelineRef.current.focusedSlug = focusedSlug;
  }, [focusedSlug, hoveredSlug, inView, manualPaused, tabHidden]);

  useEffect(() => {
    let alive = true;
    supabase
      .from('products')
      .select('*')
      .order('rating', { ascending: false })
      .limit(120)
      .then(({ data }) => {
        if (alive && data?.length) setProducts(data as Product[]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const sources = [
      ...TEXTURE_URLS,
      ...acts.map((act) => act.fallbackImage),
      ...productObjects
        .map((config) => seedProducts.find((product) => product.slug === config.slug)?.image_url)
        .filter((source): source is string => Boolean(source)),
    ];
    sources.forEach((source) => {
      const image = new Image();
      image.src = asset(source);
    });
  }, []);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.08,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const emitTheme = () => {
      const element = sectionRef.current;
      const inHero = element ? element.getBoundingClientRect().bottom > 88 : true;
      const theme = inHero ? activeCopy.theme : 'light';
      if (lastThemeRef.current !== theme) {
        lastThemeRef.current = theme;
        window.dispatchEvent(new CustomEvent(HERO_THEME_EVENT, { detail: theme }));
      }
    };
    emitTheme();
    window.addEventListener('scroll', emitTheme, { passive: true });
    return () => {
      window.removeEventListener('scroll', emitTheme);
      window.dispatchEvent(new CustomEvent(HERO_THEME_EVENT, { detail: 'light' }));
    };
  }, [activeCopy.theme]);

  /* Poster fallback still cycles its chapters. */
  useEffect(() => {
    if (webglOk || manualPaused || focusedSlug || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      if (isFinale) {
        setActiveAct(0);
        setIsFinale(false);
      } else if (activeAct < 2) {
        setActiveAct(activeAct + 1);
      } else {
        setIsFinale(true);
      }
      setCycleKey((current) => current + 1);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeAct, focusedSlug, isFinale, manualPaused, prefersReducedMotion, webglOk]);

  const goToSegment = (segment: number) => {
    const normalized = Math.min(Math.max(segment, 0), 3);
    timelineRef.current.elapsed = ACT_STARTS[normalized] + 0.01;
    timelineRef.current.lastInteraction = 0;
    timelineRef.current.focusedSlug = null;
    setFocusedSlug(null);
    setHoveredSlug(null);
    setActiveAct(normalized === 3 ? 2 : normalized);
    setIsFinale(normalized === 3);
    setCycleKey((current) => current + 1);
  };

  const handleTimeline = (act: number, finale: boolean) => {
    setActiveAct((current) => (current === act ? current : act));
    setIsFinale((current) => (current === finale ? current : finale));
  };

  const handleHover = (slug: string | null) => {
    setHoveredSlug(slug);
    timelineRef.current.hoverPaused = Boolean(slug);
    timelineRef.current.lastInteraction = performance.now();
    document.body.style.cursor = slug ? 'pointer' : 'auto';
  };

  const handleFocus = (slug: string) => {
    setFocusedSlug(slug);
    timelineRef.current.focusedSlug = slug;
    timelineRef.current.lastInteraction = performance.now();
  };

  const closeFocus = () => {
    setFocusedSlug(null);
    timelineRef.current.focusedSlug = null;
    timelineRef.current.lastInteraction = performance.now();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    const drag = dragRef.current;
    drag.dragging = true;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.baseYaw = drag.targetYaw;
    drag.basePitch = drag.targetPitch;
    timelineRef.current.lastInteraction = performance.now();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!drag.dragging) {
      if (!prefersReducedMotion) {
        drag.targetYaw = ((event.clientX - rect.left) / rect.width - 0.5) * 0.1;
        drag.targetPitch = -((event.clientY - rect.top) / rect.height - 0.5) * 0.05;
      }
      return;
    }
    drag.targetYaw = THREE.MathUtils.clamp(
      drag.baseYaw + (event.clientX - drag.startX) * 0.0035,
      -0.27,
      0.27,
    );
    drag.targetPitch = THREE.MathUtils.clamp(
      drag.basePitch - (event.clientY - drag.startY) * 0.0024,
      -0.15,
      0.15,
    );
    timelineRef.current.lastInteraction = performance.now();
  };

  const handlePointerUp = () => {
    dragRef.current.dragging = false;
    timelineRef.current.lastInteraction = performance.now();
  };

  const faNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      tabIndex={0}
      aria-label="دیوار سه‌بعدی مُدارا"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') goToSegment(timelineSegment + 1);
        if (event.key === 'ArrowRight') goToSegment(timelineSegment - 1);
        if (event.key === 'Escape') closeFocus();
      }}
      className={`relative h-[100svh] min-h-[640px] select-none overflow-hidden bg-[#120d08] outline-none transition-colors duration-700 ${
        isDark ? 'text-[#f7f1e5]' : 'text-[#211a12]'
      }`}
    >
      {/* Poster beneath the WebGL canvas and fallback if WebGL is unavailable */}
      <div aria-hidden="true" className="absolute inset-0">
        <AnimatePresence>
          <motion.img
            key={activeCopy.fallbackImage}
            src={asset(activeCopy.fallbackImage)}
            alt=""
            draggable={false}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: EASE }}
            className="absolute inset-0 h-full w-full object-cover object-[32%_center] lg:object-center"
          />
        </AnimatePresence>
      </div>

      {webglOk && (
        <div className="absolute inset-0 z-[1]" style={{ touchAction: 'pan-y' }}>
          <Canvas
            shadows={lowQuality ? false : 'soft'}
            dpr={lowQuality ? [1, 1.2] : [1, 1.75]}
            frameloop={inView ? 'always' : 'never'}
            camera={{ position: [4.15, 2.45, 9.2], fov: 36, near: 0.1, far: 45 }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.04;
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
          >
            <color attach="background" args={['#171008']} />
            <fog attach="fog" args={['#20150b', 15, 36]} />
            <Suspense fallback={null}>
              <MaisonScene
                timelineRef={timelineRef}
                dragRef={dragRef}
                focusedSlug={focusedSlug}
                hoveredSlug={hoveredSlug}
                lowQuality={lowQuality}
                prefersReducedMotion={prefersReducedMotion}
                onHover={handleHover}
                onFocus={handleFocus}
                onNavigateCategory={(slug) => onNavigate('shop', slug)}
                onTimeline={handleTimeline}
                onReady={() => setSceneReady(true)}
                onLowPerformance={() => setLowQuality(true)}
              />
            </Suspense>
          </Canvas>
        </div>
      )}

      {/* Cinematic grade */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[2] ${
          isDark
            ? 'bg-[linear-gradient(to_left,rgba(7,4,2,0.86)_0%,rgba(7,4,2,0.48)_34%,transparent_62%)]'
            : 'bg-[linear-gradient(to_left,rgba(250,246,238,0.76)_0%,rgba(250,246,238,0.38)_34%,transparent_60%)]'
        }`}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(to_bottom,rgba(10,7,4,0.18),transparent_28%,transparent_74%,rgba(10,7,4,0.26))] lg:bg-[radial-gradient(circle_at_50%_42%,transparent_52%,rgba(20,12,4,0.18)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] opacity-[0.032] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Loading seam */}
      <AnimatePresence>
        {webglOk && !sceneReady && (
          <motion.div
            aria-hidden="true"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center bg-[#0d0803]/70 backdrop-blur-[2px]"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.span
                animate={{ scaleX: [0.25, 1, 0.25], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="h-px w-40 bg-gradient-to-l from-transparent via-gold-300 to-transparent"
              />
              <span className="text-xs font-bold tracking-wide text-gold-200">در حال آماده‌سازی دیوار مُدارا</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copy */}
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="show"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 px-5 pt-24 sm:px-8 lg:left-auto lg:right-[3.5%] lg:top-1/2 lg:w-[33%] lg:-translate-y-1/2 lg:px-0 lg:pt-0"
      >
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.55, duration: 0.8, ease: EASE }}
            style={{ transformOrigin: 'right center' }}
            className="h-px w-12 bg-gradient-to-l from-gold-500 to-transparent"
          />
          <span className={`text-sm font-extrabold sm:text-base ${isDark ? 'text-gold-300' : 'text-gold-700'}`}>
            دیوار مُدارا؛ روایت واقعی نور و پارچه
          </span>
          <span dir="ltr" className={`font-display text-[9px] font-semibold tracking-[0.34em] ${isDark ? 'text-white/40' : 'text-[#211a12]/40'}`}>
            THE MODARA WALL — CINEMATIC
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mt-4 text-[2.15rem] font-black leading-[1.16] sm:text-5xl lg:mt-5 lg:text-[3.2rem] xl:text-[3.7rem]"
        >
          <span className="-my-1 block overflow-hidden py-1">
            <motion.span custom={0} variants={headlineLineVariants} className="block">
              استایل، با نوری واقعی
            </motion.span>
          </span>
          <span className="-my-1 mt-1 block overflow-hidden py-1 pb-3">
            <motion.span
              custom={1}
              variants={headlineLineVariants}
              className="block bg-gradient-to-l from-gold-600 via-[#d8b96d] to-gold-500 bg-clip-text text-transparent"
            >
              جان می‌گیرد
            </motion.span>
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className={`mt-3 max-w-xl text-sm leading-7 sm:text-base lg:leading-8 ${isDark ? 'text-white/70' : 'text-[#211a12]/70'}`}
        >
          یک برداشت سینمایی و واقعی از دیوار بوتیک مُدارا؛ از رگال نیم‌رخ تا شلف‌های سنگی، هر قطعه در نور طبیعی صحنه دیده می‌شود.
        </motion.p>

        <div className="mt-4 min-h-[8.25rem] lg:min-h-[9rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeCopy.label}-copy`}
              initial={{ opacity: 0, y: 24, filter: 'blur(7px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(6px)', transition: { duration: 0.28, ease: EASE } }}
              transition={{ duration: 0.65, ease: EASE }}
            >
              <p className={`text-xs font-extrabold ${isDark ? 'text-gold-300' : 'text-gold-700'}`}>{activeCopy.label}</p>
              <h2 className="mt-2 text-2xl font-black leading-9 sm:text-[1.7rem]">{activeCopy.headline}</h2>
              <p className={`mt-2 max-w-lg text-sm leading-7 ${isDark ? 'text-white/70' : 'text-[#211a12]/70'}`}>
                {activeCopy.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div variants={itemVariants} className="pointer-events-auto mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full py-1.5 pe-1.5 ps-7 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-[0.97] sm:py-2 sm:pe-2 sm:ps-9 sm:text-base ${
              isDark
                ? 'bg-[#f3ead6] text-[#1a150c] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)]'
                : 'bg-[#17120b] text-[#f7efdc] shadow-[0_18px_40px_-16px_rgba(23,18,11,0.55)]'
            }`}
          >
            <span aria-hidden="true" className="absolute inset-0 -translate-x-[101%] bg-gradient-to-l from-gold-300 via-gold-500 to-gold-600 transition-transform duration-500 ease-out group-hover:translate-x-0" />
            <span className="relative z-10 transition-colors duration-300 group-hover:text-[#171208]">مشاهده محصولات</span>
            <span aria-hidden="true" className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${isDark ? 'bg-[#171208] text-gold-300' : 'bg-gold-500 text-[#171208] group-hover:bg-[#171208] group-hover:text-gold-300'}`}>
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5 sm:h-5 sm:w-5" />
            </span>
          </button>
          <span className={`inline-flex items-center gap-2 text-xs font-bold sm:text-sm ${isDark ? 'text-white/55' : 'text-[#211a12]/55'}`}>
            <Sparkles className="h-4 w-4 text-gold-500" aria-hidden="true" />
            بکشید تا زاویهٔ دوربین را تغییر دهید
          </span>
        </motion.div>
      </motion.div>

      {/* Film timeline */}
      <div className="absolute inset-x-4 bottom-4 z-30 flex items-end gap-4 sm:inset-x-6 lg:bottom-7 lg:left-8 lg:right-auto lg:w-[58%]">
        <div className="min-w-0 flex-1" role="tablist" aria-label="خط زمانی دیوار مُدارا">
          <div className="flex items-end gap-3 sm:gap-5">
            {[...acts.map((act) => act.label), 'نمای کامل'].map((label, index) => {
              const isActive = index === timelineSegment;
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`نمایش ${label}`}
                  onClick={() => goToSegment(index)}
                  className="group flex-1 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <span className="mb-2 flex items-baseline gap-2">
                    <span dir="ltr" className={`font-display text-xs font-semibold ${isActive ? 'text-gold-500' : isDark ? 'text-white/45' : 'text-[#211a12]/45'}`}>
                      {pad(index + 1)}
                    </span>
                    <span className={`hidden text-xs font-bold sm:block ${isActive ? '' : isDark ? 'text-white/50' : 'text-[#211a12]/50'}`}>
                      {label}
                    </span>
                  </span>
                  <span className={`relative block h-[3px] overflow-hidden rounded-full ${isDark ? 'bg-white/25' : 'bg-[#211a12]/20'}`}>
                    {isActive ? (
                      <span
                        key={`${label}-${cycleKey}`}
                        className="hero-progress-fill absolute inset-0 block bg-gradient-to-l from-gold-400 to-gold-600 shadow-[0_0_10px_rgba(216,185,109,0.7)]"
                        style={{
                          animationDuration: `${SEGMENT_DURATIONS[index]}ms`,
                          animationPlayState: progressPaused || prefersReducedMotion ? 'paused' : 'running',
                          transform: prefersReducedMotion ? 'scaleX(1)' : undefined,
                        }}
                      />
                    ) : (
                      <span className={`absolute inset-0 block origin-right bg-gold-500/55 transition-transform duration-500 ${index < timelineSegment ? 'scale-x-100' : 'scale-x-0'}`} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setManualPaused((current) => !current)}
          aria-label={manualPaused ? 'پخش حرکت دوربین' : 'توقف حرکت دوربین'}
          aria-pressed={manualPaused}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-95 ${
            isDark
              ? 'border-white/20 bg-black/25 text-white hover:border-gold-300 hover:bg-gold-500 hover:text-[#171208]'
              : 'border-[#211a12]/15 bg-white/40 text-[#211a12] hover:border-gold-600 hover:bg-gold-500 hover:text-white'
          }`}
        >
          {manualPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      {/* Focused product */}
      <AnimatePresence>
        {focusedProduct && (
          <motion.aside
            key={`focus-${focusedProduct.slug}`}
            role="dialog"
            aria-label={`نمایش ${focusedProduct.name}`}
            initial={{ opacity: 0, y: 44, scale: 0.94, rotate: -0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 28, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 185, damping: 22, mass: 0.85 }}
            className={`absolute inset-x-3 bottom-20 z-40 overflow-hidden rounded-[1.6rem] border shadow-[0_32px_70px_-28px_rgba(0,0,0,0.65)] backdrop-blur-2xl lg:inset-x-auto lg:bottom-24 lg:left-8 lg:w-[21rem] ${
              isDark
                ? 'border-white/15 bg-[#120d08]/80 text-[#f7f1e5]'
                : 'border-white/55 bg-[#fffaf0]/85 text-[#211a12]'
            }`}
          >
            <span aria-hidden="true" className="absolute inset-x-7 top-0 h-px bg-gradient-to-l from-transparent via-gold-500/80 to-transparent" />
            <button
              type="button"
              onClick={closeFocus}
              aria-label="بستن نمایش محصول"
              className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#171208]/85 text-gold-200 shadow-lg backdrop-blur transition hover:bg-gold-500 hover:text-[#171208] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex gap-4 p-4">
              <button
                type="button"
                onClick={() => onNavigate('product', focusedProduct.slug)}
                aria-label={`مشاهده ${focusedProduct.name}`}
                className="group h-36 w-28 shrink-0 overflow-hidden rounded-[1.15rem] bg-[#f3ede0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <img
                  src={asset(focusedProduct.image_url)}
                  alt={focusedProduct.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </button>
              <div className="min-w-0 flex-1 py-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold opacity-65">
                  <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-500" aria-hidden="true" />
                  {faNumber(focusedProduct.rating)}
                </span>
                <h2 className="mt-2 line-clamp-2 text-[15px] font-black leading-6">{focusedProduct.name}</h2>
                <p className="mt-2 text-sm font-black">{formatPrice(focusedProduct.price)}</p>
                <button
                  type="button"
                  onClick={() => onNavigate('product', focusedProduct.slug)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#171208] px-3.5 py-2 text-[11px] font-extrabold text-gold-200 transition hover:bg-gold-500 hover:text-[#171208] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                  مشاهده محصول
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-14 bg-gradient-to-t from-[#faf8f5]/90 to-transparent" />
    </section>
  );
}
