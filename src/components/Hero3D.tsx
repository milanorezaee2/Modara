import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Gem,
  Glasses,
  Package,
  Shirt,
  ShoppingBag,
  Watch,
} from 'lucide-react';
import type { ProductPreview } from '../lib/catalog';
import { getProductsBySlugs } from '../lib/catalog';
import { asset, formatPrice, imageSrcSet, optimizedAsset } from '../lib/format';

type Hero3DProps = {
  onNavigate: (view: string, param?: string) => void;
};

type Chapter = {
  key: string;
  label: string;
  headline: string;
  note: string;
  productSlug: string;
  still: string;
  productName: string;
  productPrice: string;
};

const CHAPTER_MS = 5200;
const HERO_THEME_EVENT = 'modara:hero-theme';
const RING_STEP = (Math.PI * 2) / 6;
const RING_RADIUS = 3.25;

const CHAPTERS: Chapter[] = [
  {
    key: 'clothing',
    label: 'لباس',
    headline: 'جایی که استایلِ شما آغاز می‌شود',
    note: 'ترنچ‌کت، پیراهن و بلیزر؛ فرمِ روزِ شما در یک قاب',
    productSlug: 'trench-coat-camel-women',
    still: '/images/categories/category-clothing.jpg',
    productName: 'ترنچ‌کت زنانه شتری',
    productPrice: '۳٬۹۰۰٬۰۰۰ تومان',
  },
  {
    key: 'pants',
    label: 'شلوار',
    headline: 'برشی که با هر قدم، وقار را همراه می‌کند',
    note: 'راسته و فراخ، بی‌زمان و بی‌دردسر',
    productSlug: 'wide-leg-trousers-black-women',
    still: '/images/categories/category-pants.jpg',
    productName: 'شلوار فراخ زنانه مشکی',
    productPrice: '۱٬۵۹۰٬۰۰۰ تومان',
  },
  {
    key: 'glasses',
    label: 'عینک',
    headline: 'قابی که نگاهِ شما را به یاد می‌سپارد',
    note: 'فریم‌هایی برای صورت‌هایی که دیده می‌شوند',
    productSlug: 'luxury-sunglasses-classic',
    still: '/images/categories/category-glasses.jpg',
    productName: 'عینک آفتابی لوکس کلاسیک',
    productPrice: '۱٬۸۰۰٬۰۰۰ تومان',
  },
  {
    key: 'watch',
    label: 'ساعت',
    headline: 'دقت، وقتی به طلا و فولاد ترجمه می‌شود',
    note: 'ثانیه‌هایی که وزن دارند',
    productSlug: 'steel-chronograph-watch',
    still: '/images/categories/category-watch.jpg',
    productName: 'ساعت کرنوگراف استیل',
    productPrice: '۵٬۶۰۰٬۰۰۰ تومان',
  },
  {
    key: 'bag',
    label: 'کیف',
    headline: 'چرمی که با گذرِ زمان، شخصی‌تر می‌شود',
    note: 'همراهی که هر روز، امضای شما را می‌برد',
    productSlug: 'leather-tote-bag-tan',
    still: '/images/categories/category-bag.jpg',
    productName: 'کیف توت چرم عسلی',
    productPrice: '۲٬۶۵۰٬۰۰۰ تومان',
  },
  {
    key: 'accessory',
    label: 'اکسسوری',
    headline: 'جزئیاتِ کوچک، امضای کامل',
    note: 'کمربند، جواهر و کلاه؛ آخرین ضربهٔ یک استایل',
    productSlug: 'womens-jewelry-set',
    still: '/images/categories/category-accessory.jpg',
    productName: 'ست جواهری زنانه',
    productPrice: '۳٬۲۰۰٬۰۰۰ تومان',
  },
];

const chapterIcons: Record<string, ReactNode> = {
  clothing: <Shirt className="h-3.5 w-3.5" aria-hidden="true" />,
  pants: <Package className="h-3.5 w-3.5" aria-hidden="true" />,
  glasses: <Glasses className="h-3.5 w-3.5" aria-hidden="true" />,
  watch: <Watch className="h-3.5 w-3.5" aria-hidden="true" />,
  bag: <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />,
  accessory: <Gem className="h-3.5 w-3.5" aria-hidden="true" />,
};

/* ————————————————————————————————————————————————
   Real 3D scene: six catalogue pieces hung in a lit vitrine.
   Every card is a physical mesh (frame + printed panel) standing on a
   brass pedestal, inside a real arch, with a rotating ring, depth fog,
   spot lighting, contact shadows and metal reflections.
   ———————————————————————————————————————————————— */

type StageProps = {
  chapters: Chapter[];
  textures: Record<string, THREE.Texture>;
  active: number;
  dragRef: React.MutableRefObject<{ offset: number; dragging: boolean }>;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  onPick: (index: number) => void;
  lowQuality: boolean;
  reduceMotion: boolean;
};

function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;
    scene.environment = environment;
    return () => {
      scene.environment = null;
      environment.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function CameraRig({
  pointer,
  active,
  reduceMotion,
}: {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  active: number;
  reduceMotion: boolean;
}) {
  const { camera } = useThree();
  const base = useMemo(() => new THREE.Vector3(0, 0.62, 9.15), []);
  useFrame((_, delta) => {
    if (reduceMotion) {
      camera.position.copy(base);
      camera.lookAt(0, 0.28, 0);
      return;
    }
    const p = pointer.current;
    const targetX = base.x + p.x * 0.62;
    const targetY = base.y - p.y * 0.34 + 0.05;
    const dolly = 9.15 + Math.sin(active * 0.7) * 0.06;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 3.4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 3.4, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, dolly, 2.4, delta);
    camera.lookAt(0, 0.28, 0);
  });
  return null;
}

function DustField({ count, reduceMotion }: { count: number; reduceMotion: boolean }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 5.4 - 1.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const node = points.current;
    if (!node || reduceMotion) return;
    node.rotation.y += delta * 0.012;
    const attr = node.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < count; i += 1) {
      const y = attr.getY(i) + delta * (0.045 + (i % 5) * 0.012);
      attr.setY(i, y > 4.4 ? -1.3 : y);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.028}
        color="#e8cf97"
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function VitrineArch() {
  return (
    <group position={[0, -1.55, -4.4]}>
      {/* Half torus: the arch itself, in brushed brass */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[3.15, 0.05, 14, 72, Math.PI]} />
        <meshStandardMaterial
          color="#d9bd82"
          metalness={0.92}
          roughness={0.26}
          envMapIntensity={1.4}
        />
      </mesh>
      {/* Second, wider hoop for depth */}
      <mesh position={[0, 0, -1.5]}>
        <torusGeometry args={[3.62, 0.028, 12, 72, Math.PI]} />
        <meshStandardMaterial color="#8a6f42" metalness={0.85} roughness={0.4} />
      </mesh>
      {/* Columns */}
      {[-3.15, 3.15].map((x) => (
        <mesh key={x} position={[x, -1.35, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.075, 2.7, 18]} />
          <meshStandardMaterial color="#d9bd82" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {[-3.62, 3.62].map((x) => (
        <mesh key={`outer-${x}`} position={[x, -1.9, -1.5]}>
          <cylinderGeometry args={[0.03, 0.04, 3.8, 14]} />
          <meshStandardMaterial color="#8a6f42" metalness={0.8} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

const frameOuter = () => new RoundedBoxGeometry(2.04, 2.62, 0.09, 4, 0.05);
const frameInner = () => new RoundedBoxGeometry(1.9, 2.48, 0.11, 4, 0.04);

function ProductCard({
  texture,
  angle,
  active,
  onPick,
  index,
  reduceMotion,
}: {
  texture?: THREE.Texture;
  angle: number;
  active: boolean;
  onPick: (index: number) => void;
  index: number;
  reduceMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const outer = useMemo(frameOuter, []);
  const inner = useMemo(frameInner, []);
  useEffect(
    () => () => {
      outer.dispose();
      inner.dispose();
    },
    [outer, inner],
  );

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;
    const targetY = active ? 0.4 : 0.02;
    const targetScale = active ? 1.04 : 0.9;
    if (reduceMotion) {
      node.position.y = targetY;
      node.scale.setScalar(targetScale);
      return;
    }
    node.position.y = THREE.MathUtils.damp(node.position.y, targetY, 4.5, delta);
    const next = THREE.MathUtils.damp(node.scale.x, targetScale, 5, delta);
    node.scale.setScalar(next);
    // Float: an almost imperceptible breathing of the hung piece
    node.rotation.z = Math.sin(state.clock.elapsedTime * 0.6 + index) * 0.006;
  });

  return (
    <group
      ref={group}
      position={[Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS]}
      rotation={[0, angle, 0]}
    >
      {/* Printed panel: the real product photograph, lit by the room */}
      <mesh position={[0, 0, 0.075]} castShadow receiveShadow>
        <planeGeometry args={[1.86, 2.44]} />
        <meshStandardMaterial
          map={texture ?? undefined}
          color={texture ? '#ffffff' : '#2c2318'}
          roughness={0.5}
          metalness={0.04}
          envMapIntensity={0.55}
        />
      </mesh>

      {/* Brass frame */}
      <mesh geometry={outer} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#c0913f" metalness={0.9} roughness={0.3} envMapIntensity={1.3} />
      </mesh>
      <mesh geometry={inner} position={[0, 0, 0.015]} receiveShadow>
        <meshStandardMaterial color="#161009" roughness={0.55} metalness={0.35} />
      </mesh>

      {/* Glow behind the active piece */}
      <mesh position={[0, 0, -0.12]}>
        <planeGeometry args={[2.5, 3.2]} />
        <meshBasicMaterial
          color="#e2c279"
          transparent
          opacity={active ? 0.22 : 0.05}
          depthWrite={false}
        />
      </mesh>

      {/* Brass pedestal */}
      <mesh position={[0, -1.62, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.42, 0.62, 24]} />
        <meshStandardMaterial color="#2a2118" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, -1.31, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.02, 24]} />
        <meshStandardMaterial color="#d9bd82" metalness={0.95} roughness={0.22} />
      </mesh>

      {/* Invisible hit target for a real click on the card */}
      <mesh
        position={[0, 0, 0.14]}
        onClick={(event) => {
          event.stopPropagation();
          onPick(index);
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
        }}
      >
        <planeGeometry args={[2.04, 2.62]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Stage({
  chapters,
  textures,
  active,
  dragRef,
  pointer,
  onPick,
  lowQuality,
  reduceMotion,
}: StageProps) {
  const ring = useRef<THREE.Group>(null);
  const targetYaw = -active * RING_STEP;

  useFrame((_, delta) => {
    const node = ring.current;
    if (!node) return;
    const target = targetYaw + dragRef.current.offset;
    node.rotation.y = reduceMotion
      ? target
      : THREE.MathUtils.damp(node.rotation.y, target, 4.2, delta);
  });

  return (
    <>
      <color attach="background" args={['#080605']} />
      <fog attach="fog" args={['#080605', 10.5, 26]} />
      <StudioEnvironment />
      <CameraRig pointer={pointer} active={active} reduceMotion={reduceMotion} />

      <ambientLight intensity={0.42} />
      <hemisphereLight args={['#f7ecd6', '#120d08', 0.45]} />
      <spotLight
        position={[2.6, 5.4, 5.6]}
        angle={0.62}
        penumbra={0.9}
        intensity={190}
        distance={26}
        color="#fff3dc"
        castShadow={!lowQuality}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />
      <spotLight
        position={[-3.8, 3.4, 4.2]}
        angle={0.7}
        penumbra={1}
        intensity={70}
        distance={22}
        color="#e2c279"
      />
      <directionalLight position={[-2, 2.6, -6]} intensity={1.1} color="#8fa6d8" />
      <pointLight position={[0, 0.6, 4.2]} intensity={16} distance={9} color="#ffe6b8" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.9, 0]} receiveShadow>
        <planeGeometry args={[46, 46]} />
        <meshStandardMaterial color="#0c0906" roughness={0.34} metalness={0.62} />
      </mesh>

      {/* Carousel track: a brass circle the pieces stand on */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.89, 0]}>
        <torusGeometry args={[RING_RADIUS, 0.012, 8, 120]} />
        <meshStandardMaterial color="#d9bd82" metalness={0.95} roughness={0.25} />
      </mesh>

      <VitrineArch />

      <group ref={ring}>
        {chapters.map((chapter, index) => (
          <ProductCard
            key={chapter.key}
            index={index}
            texture={textures[chapter.key]}
            angle={index * RING_STEP}
            active={index === active}
            onPick={onPick}
            reduceMotion={reduceMotion}
          />
        ))}
      </group>

      <DustField count={lowQuality ? 90 : 220} reduceMotion={reduceMotion} />
    </>
  );
}

/* ————————————————————————————————————————————————
   Hero: the 3D vitrine + the editorial overlay
   ———————————————————————————————————————————————— */

/** If the GL context fails for any reason, fall back to the printed poster. */
class GLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[ModAra] 3D hero disabled after a render error:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function supportsWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

export default function Hero3D({ onNavigate }: Hero3DProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const drag = useRef({ offset: 0, dragging: false, startX: 0, startOffset: 0, moved: 0 });

  const [active, setActive] = useState(0);
  const [events, setEvents] = useState({ hover: false, focus: false });
  const [inView, setInView] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const [products, setProducts] = useState<Record<string, ProductPreview>>({});
  const [textures, setTextures] = useState<Record<string, THREE.Texture>>({});
  const [webgl] = useState(supportsWebGL);
  const [lowQuality] = useState(() => {
    if (typeof window === 'undefined') return true;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    return coarse || window.innerWidth < 900;
  });
  const [curtainOpen, setCurtainOpen] = useState(false);

  const chapter = CHAPTERS[active];
  const product = products[chapter.productSlug];

  /* Header needs a light logo on the dark stage. */
  useEffect(() => {
    const emit = (theme: 'dark' | 'light') =>
      window.dispatchEvent(new CustomEvent(HERO_THEME_EVENT, { detail: theme }));
    emit('dark');
    return () => {
      emit('light');
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setCurtainOpen(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.05,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* Real catalogue records for the six pieces on the stage. */
  useEffect(() => {
    let cancelled = false;
    getProductsBySlugs(CHAPTERS.map((item) => item.productSlug))
      .then((list) => {
        if (cancelled) return;
        const map: Record<string, ProductPreview> = {};
        list.forEach((item) => {
          map[item.slug] = item;
        });
        setProducts(map);
      })
      .catch(() => {
        /* The stage keeps the printed posters if the catalogue is offline. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Load the product photographs as real 3D textures. */
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let cancelled = false;
    CHAPTERS.forEach((item) => {
      const record = products[item.productSlug];
      const url = record ? optimizedAsset(record.image_url, 720) : asset(item.still);
      loader.load(
        url,
        (texture) => {
          if (cancelled) return;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 8;
          setTextures((prev) => ({ ...prev, [item.key]: texture }));
        },
        undefined,
        () => {
          /* Keep the previous texture on failure. */
        },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [products]);

  const pick = useCallback((index: number) => {
    // A drag that releases on top of a card must not open that product.
    if (drag.current.moved > 12) return;
    drag.current.offset = 0;
    setActive(((index % CHAPTERS.length) + CHAPTERS.length) % CHAPTERS.length);
  }, []);

  const step = useCallback((direction: number) => {
    drag.current.offset = 0;
    setActive((current) => (current + direction + CHAPTERS.length) % CHAPTERS.length);
  }, []);

  useEffect(() => {
    if (reduceMotion || tabHidden || !inView || events.hover || events.focus) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % CHAPTERS.length);
    }, CHAPTER_MS);
    return () => window.clearInterval(timer);
  }, [active, events.focus, events.hover, inView, reduceMotion, tabHidden]);

  const paused = !inView || tabHidden;

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.current.x = (event.clientX - rect.left) / rect.width - 0.5;
    pointer.current.y = (event.clientY - rect.top) / rect.height - 0.5;
    if (!drag.current.dragging) return;
    const dx = event.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    drag.current.offset = drag.current.startOffset + (dx / rect.width) * Math.PI * 1.6;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current.dragging = true;
    drag.current.startX = event.clientX;
    drag.current.startOffset = drag.current.offset;
    drag.current.moved = 0;
  };

  const endDrag = () => {
    if (!drag.current.dragging) return;
    drag.current.dragging = false;
    if (drag.current.moved > 40) {
      const turns = Math.round(drag.current.offset / RING_STEP);
      setActive((current) => (current - turns + CHAPTERS.length * 2) % CHAPTERS.length);
    }
    drag.current.offset = 0;
  };

  const plateName = product?.name ?? chapter.productName;
  const platePrice = product ? formatPrice(product.price) : chapter.productPrice;

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      aria-label="ویترین سه‌بعدی مُدارا"
      className="relative isolate overflow-hidden"
      style={{ minHeight: '100svh', backgroundColor: '#080605', color: '#f6efe2' }}
      onFocusCapture={() => setEvents((prev) => ({ ...prev, focus: true }))}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setEvents((prev) => ({ ...prev, focus: false }));
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          step(1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          step(-1);
        }
      }}
    >
      {/* ——— The real 3D stage ——— */}
      {webgl ? (
        <div
          className="absolute inset-0 touch-pan-y"
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={endDrag}
          onPointerLeave={() => {
            endDrag();
            pointer.current.x = 0;
            pointer.current.y = 0;
          }}
        >
          <GLBoundary
            fallback={
              <img
                src={asset(chapter.still)}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover opacity-40 blur-sm"
              />
            }
          >
          <Canvas
            shadows={!lowQuality}
            dpr={lowQuality ? [1, 1.35] : [1, 1.9]}
            camera={{ position: [0, 0.62, 9.15], fov: 37, near: 0.1, far: 60 }}
            gl={{ antialias: !lowQuality, powerPreference: 'high-performance' }}
            frameloop={paused ? 'demand' : 'always'}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.02;
            }}
          >
            <Stage
              chapters={CHAPTERS}
              textures={textures}
              active={active}
              dragRef={drag}
              pointer={pointer}
              onPick={pick}
              lowQuality={lowQuality}
              reduceMotion={reduceMotion}
            />
          </Canvas>
          </GLBoundary>
        </div>
      ) : (
        <div className="absolute inset-0">
          <img
            src={asset(chapter.still)}
            alt=""
            className="h-full w-full object-cover opacity-40 blur-sm"
          />
        </div>
      )}

      {/* Grade so the copy side reads while the vitrine keeps its light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(270deg, rgba(8,7,6,.93) 0%, rgba(9,8,6,.8) 28%, rgba(10,8,6,.22) 58%, rgba(8,7,6,.82) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(8,7,6,.88) 0%, transparent 26%, transparent 58%, rgba(8,7,6,.95) 100%)',
        }}
      />

      {/* Arch hairline drawn over the frame, echoing the 3D arch */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
        <div
          className="absolute inset-x-4 inset-y-14 sm:inset-x-8 sm:inset-y-16 lg:inset-x-12 lg:inset-y-20"
          style={{
            border: '1px solid rgba(217,189,130,.18)',
            borderBottom: 'none',
            borderRadius: '46% 46% 0 0 / 26% 26% 0 0',
          }}
        />
      </div>

      {/* ——— Overlay ——— */}
      <div className="pointer-events-none relative z-30 mx-auto flex min-h-[100svh] w-full max-w-[92rem] flex-col justify-end gap-8 px-6 pb-16 pt-24 sm:px-10 sm:pt-28 lg:grid lg:grid-cols-[1.02fr_.98fr] lg:items-end lg:gap-12 lg:px-16 lg:pb-24">
        <div className="pointer-events-auto text-center lg:text-right">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto max-w-xl lg:mx-0"
          >
            <div className="mb-4 flex items-center justify-center gap-3 lg:justify-start">
              <span
                className="h-px w-10 sm:w-14"
                style={{ backgroundImage: 'linear-gradient(to left, rgba(213,171,85,.85), transparent)' }}
              />
              <span
                dir="ltr"
                className="font-display text-[10px] font-semibold uppercase tracking-[0.42em] sm:text-[11px]"
                style={{ color: 'rgba(237,218,166,.9)' }}
              >
                Modara Maison · 3D
              </span>
              <span
                className="h-px w-10 sm:w-14"
                style={{ backgroundImage: 'linear-gradient(to right, rgba(213,171,85,.85), transparent)' }}
              />
            </div>

            <div className="mb-3 flex items-center justify-center lg:justify-start">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold"
                style={{
                  border: '1px solid rgba(237,218,166,.32)',
                  backgroundColor: 'rgba(255,255,255,.07)',
                  color: 'rgba(246,237,211,.95)',
                }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-300/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-300" />
                </span>
                {chapter.label}
              </span>
            </div>

            <h1
              className="relative text-[1.68rem] font-black leading-[1.35] tracking-[-0.01em] sm:text-[2.3rem] sm:leading-[1.3] lg:text-[2.7rem] xl:text-[3.05rem]"
              style={{ color: '#fdf8ec', textWrap: 'balance' }}
            >
              <span className="sr-only">مُدارا — فروشگاه آنلاین مد و فشن</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`headline-${chapter.key}`}
                  aria-hidden="true"
                  className="block"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span
                    style={{
                      backgroundImage:
                        'linear-gradient(to left, #fdf8ec 0%, #f6edd3 45%, #e8cf97 78%, #c0913f 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {chapter.headline}
                  </span>
                </motion.span>
              </AnimatePresence>
            </h1>

            <div className="relative mt-3 min-h-[1.9rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={`note-${chapter.key}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.14 } }}
                  transition={{ duration: 0.4 }}
                  className="mx-auto max-w-lg text-[13px] leading-7 sm:text-[15px] lg:mx-0"
                  style={{ color: 'rgba(255,255,255,.68)' }}
                >
                  {chapter.note}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <button
                type="button"
                onClick={() => onNavigate('shop', chapter.key)}
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full px-7 py-3.5 text-[13px] font-extrabold transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 sm:text-sm"
                style={{
                  backgroundImage: 'linear-gradient(to left, #eddaa6, #e2c279 52%, #c0913f)',
                  color: '#1a1305',
                  boxShadow: '0 18px 40px -18px rgba(217,189,130,.75)',
                }}
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">ورود به کالکشن {chapter.label}</span>
                <ArrowLeft className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-bold transition-colors duration-300 sm:text-sm"
                style={{
                  border: '1px solid rgba(255,255,255,.24)',
                  backgroundColor: 'rgba(255,255,255,.06)',
                  color: 'rgba(255,255,255,.88)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                همهٔ محصولات
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6">
              <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
                {CHAPTERS.map((item, itemIndex) => {
                  const isActive = itemIndex === active;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => pick(itemIndex)}
                      aria-current={isActive ? 'true' : undefined}
                      aria-label={`نمایش ${item.label} در ویترین سه‌بعدی`}
                      className="flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold transition-all duration-300 sm:text-xs"
                      style={
                        isActive
                          ? {
                              border: '1px solid rgba(237,218,166,.6)',
                              backgroundColor: 'rgba(226,194,121,.18)',
                              color: 'rgba(253,248,236,.98)',
                              boxShadow: '0 0 24px -8px rgba(217,189,130,.8)',
                            }
                          : {
                              border: '1px solid rgba(255,255,255,.12)',
                              backgroundColor: 'rgba(255,255,255,.03)',
                              color: 'rgba(255,255,255,.62)',
                            }
                      }
                    >
                      <span style={{ color: isActive ? '#eddaa6' : 'rgba(255,255,255,.45)' }}>
                        {chapterIcons[item.key]}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Product plate + stage controls */}
        <div
          className="pointer-events-auto relative mx-auto w-full max-w-[21rem] sm:max-w-[24rem] lg:mx-0 lg:max-w-[21rem] lg:justify-self-start"
          onMouseEnter={() => setEvents((prev) => ({ ...prev, hover: true }))}
          onMouseLeave={() => setEvents((prev) => ({ ...prev, hover: false }))}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.aside
              key={`plate-${chapter.key}`}
              aria-label={`محصول شاخص ${chapter.label}`}
              initial={{ opacity: 0, y: 14, rotate: -0.7 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.16 } }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[1.4rem] p-3.5 shadow-[0_34px_70px_-30px_rgba(0,0,0,0.92)]"
              style={{
                backgroundColor: '#fbf6ea',
                color: '#1b1409',
                border: '1px solid rgba(226,194,121,.4)',
              }}
            >
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() =>
                    product ? onNavigate('product', product.slug) : onNavigate('shop', chapter.key)
                  }
                  aria-label={`مشاهده ${plateName}`}
                  className="group relative h-[5.5rem] w-[4.35rem] shrink-0 overflow-hidden rounded-xl focus-visible:outline-none"
                  style={{ backgroundColor: '#efe6d5' }}
                >
                  <img
                    src={product ? optimizedAsset(product.image_url, 480) : asset(chapter.still)}
                    srcSet={product ? imageSrcSet(product.image_url, [480, 720]) : undefined}
                    sizes="72px"
                    alt={plateName}
                    width={480}
                    height={640}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.16em]"
                    style={{ color: '#855d28' }}
                  >
                    {chapterIcons[chapter.key]}
                    {chapter.label}
                  </span>
                  <p className="mt-1.5 line-clamp-2 text-[13px] font-black leading-5">{plateName}</p>
                  <p className="mt-1 text-[12px] font-extrabold" style={{ color: '#3a2c15' }}>
                    {platePrice}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    product ? onNavigate('product', product.slug) : onNavigate('shop', chapter.key)
                  }
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-extrabold transition-colors hover:brightness-110"
                  style={{ backgroundColor: '#171008', color: '#f6edd3' }}
                >
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                  دیدن محصول
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('shop', chapter.key)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-extrabold transition-colors"
                  style={{ border: '1px solid rgba(27,20,9,.16)', color: 'rgba(27,20,9,.72)' }}
                >
                  کل دسته
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>

              {!reduceMotion && !paused && (
                <span
                  key={`progress-${chapter.key}`}
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 h-[2px]"
                  style={{
                    backgroundImage: 'linear-gradient(to left, #e2c279, #c0913f, #e2c279)',
                    animation: `heroProgress ${CHAPTER_MS}ms linear forwards`,
                    transformOrigin: 'right center',
                  }}
                />
              )}
            </motion.aside>
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-center gap-3 lg:justify-start">
            <div
              className="flex items-center gap-1 rounded-full px-1.5 py-1.5"
              style={{
                border: '1px solid rgba(255,255,255,.16)',
                backgroundColor: 'rgba(13,10,7,.62)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="قطعهٔ قبلی"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,.7)' }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1 px-1" aria-hidden="true">
                {CHAPTERS.map((item, itemIndex) => (
                  <span
                    key={`dot-${item.key}`}
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      width: itemIndex === active ? 22 : 6,
                      backgroundImage:
                        itemIndex === active
                          ? 'linear-gradient(to left, #eddaa6, #c0913f)'
                          : undefined,
                      backgroundColor: itemIndex === active ? undefined : 'rgba(255,255,255,.28)',
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="قطعهٔ بعدی"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,.7)' }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <span
              className="hidden text-[10px] font-bold tracking-[0.2em] sm:block"
              style={{ color: 'rgba(255,255,255,.42)' }}
            >
              بکشید تا بچرخد
            </span>
          </div>
        </div>
      </div>

      {/* Curtain */}
      <AnimatePresence>
        {!curtainOpen && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 1, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => setCurtainOpen(true)}
            className="pointer-events-none absolute inset-0 z-40"
            style={{ backgroundColor: '#080605' }}
          >
            <span
              className="absolute inset-x-0 top-1/2 h-px"
              style={{
                backgroundImage:
                  'linear-gradient(to right, transparent, rgba(226,194,121,.5), transparent)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
