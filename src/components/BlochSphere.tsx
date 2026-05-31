/**
 * BlochSphere.tsx
 * Platzierung: src/components/BlochSphere.tsx
 * IBM Q-Sphere style visualization + Single Bloch Sphere
 */

import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlochSphereProps {
  statevector: { re: number; im: number }[];
  numQubits: number;
  qubitIndex?: number;
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function getBlochVector(
  statevector: { re: number; im: number }[],
  numQubits: number,
  qubitIndex: number
): { x: number; y: number; z: number } {
  let rho00 = 0, rho11 = 0, rho01_re = 0, rho01_im = 0;
  const n = statevector.length;
  const bit = numQubits - 1 - qubitIndex;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const mask = ~(1 << bit) & (n - 1);
      if ((i & mask) !== (j & mask)) continue;
      const bi = (i >> bit) & 1;
      const bj = (j >> bit) & 1;
      const re = statevector[i].re * statevector[j].re + statevector[i].im * statevector[j].im;
      const im = statevector[i].im * statevector[j].re - statevector[i].re * statevector[j].im;
      if (bi === 0 && bj === 0) rho00 += re;
      if (bi === 1 && bj === 1) rho11 += re;
      if (bi === 0 && bj === 1) { rho01_re += re; rho01_im += im; }
    }
  }

  return { x: 2 * rho01_re, y: rho00 - rho11, z: -2 * rho01_im };
}

/** Hamming weight (number of 1-bits) */
function hammingWeight(n: number): number {
  let count = 0;
  while (n) { count += n & 1; n >>= 1; }
  return count;
}

/** Phase in radians from complex amplitude */
function getPhase(re: number, im: number): number {
  return Math.atan2(im, re);
}

/** HSL color from phase angle (IBM-style rainbow) */
function phaseToColor(phase: number): THREE.Color {
  // Map [-π, π] → [0, 360] hue
  const hue = ((phase / Math.PI) * 180 + 360) % 360;
  const color = new THREE.Color();
  color.setHSL(hue / 360, 0.85, 0.55);
  return color;
}

/** CSS color string from phase */
function phaseToCSS(phase: number): string {
  const hue = ((phase / Math.PI) * 180 + 360) % 360;
  return `hsl(${hue.toFixed(0)}, 85%, 55%)`;
}

/**
 * Distribute states with the same Hamming weight evenly around a latitude ring.
 * Returns {x, y, z} on unit sphere.
 * y = cos(theta) where theta maps Hamming weight 0..n to poles.
 */
function statePosition(
  index: number,
  numQubits: number,
  statesPerWeight: Map<number, number[]>
): THREE.Vector3 {
  const hw = hammingWeight(index);
  const group = statesPerWeight.get(hw)!;
  const posInGroup = group.indexOf(index);
  const total = group.length;

  // Latitude: weight 0 → north pole (y=1), weight n → south pole (y=-1)
  const theta = (hw / numQubits) * Math.PI; // 0..π
  const y = Math.cos(theta);
  const r = Math.sin(theta);

  // Longitude: evenly distribute within group
  const phi = total === 1 ? 0 : (posInGroup / total) * 2 * Math.PI;
  const x = r * Math.cos(phi);
  const z = r * Math.sin(phi);

  return new THREE.Vector3(x, y, z);
}

// ---------------------------------------------------------------------------
// Q-Sphere Component (IBM style)
// ---------------------------------------------------------------------------

export function QSphere({
  statevector,
  numQubits,
}: {
  statevector: { re: number; im: number }[];
  numQubits: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const pivotRef = useRef<THREE.Group | null>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const n = statevector.length;

  // Group state indices by Hamming weight
  const statesPerWeight = useMemo(() => {
    const map = new Map<number, number[]>();
    for (let i = 0; i < n; i++) {
      const hw = hammingWeight(i);
      if (!map.has(hw)) map.set(hw, []);
      map.get(hw)!.push(i);
    }
    return map;
  }, [n]);

  // Compute positions and amplitudes
  const stateData = useMemo(() => {
    return Array.from({ length: n }, (_, i) => {
      const { re, im } = statevector[i];
      const prob = re * re + im * im;
      const phase = getPhase(re, im);
      const pos = statePosition(i, numQubits, statesPerWeight);
      const label = i.toString(2).padStart(numQubits, "0");
      return { index: i, prob, phase, pos, label, re, im };
    }).filter(d => d.prob > 1e-6);
  }, [statevector, numQubits, statesPerWeight, n]);

  useEffect(() => {
    if (!mountRef.current) return;
    const W = 320, H = 320;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa);

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const pivot = new THREE.Group();
    scene.add(pivot);
    pivotRef.current = pivot;

    // --- Sphere (transparent shell) ---
    const sphereGeo = new THREE.SphereGeometry(1, 48, 48);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0xdbeafe, transparent: true, opacity: 0.08, side: THREE.DoubleSide,
    });
    pivot.add(new THREE.Mesh(sphereGeo, sphereMat));

    // Wireframe (subtle)
    const wireGeo = new THREE.SphereGeometry(1.001, 18, 18);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd, wireframe: true, transparent: true, opacity: 0.12,
    });
    pivot.add(new THREE.Mesh(wireGeo, wireMat));

    // Equator ring
    const eqGeo = new THREE.TorusGeometry(1, 0.007, 8, 64);
    pivot.add(new THREE.Mesh(eqGeo, new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.5 })));

    // Latitude rings for each Hamming weight level
    for (let hw = 0; hw <= numQubits; hw++) {
      if (hw === 0 || hw === numQubits) continue; // skip poles (degenerate)
      const theta = (hw / numQubits) * Math.PI;
      const r = Math.sin(theta);
      const y = Math.cos(theta);
      if (r < 0.05) continue;
      const latGeo = new THREE.TorusGeometry(r, 0.004, 8, 64);
      const latMesh = new THREE.Mesh(latGeo, new THREE.MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.3 }));
      latMesh.position.y = y;
      pivot.add(latMesh);
    }

    // Axes (thin)
    const addAxis = (dir: THREE.Vector3, color: number, posLabel: string, negLabel: string) => {
      const len = 1.3;
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });
      const geo = new THREE.BufferGeometry().setFromPoints([
        dir.clone().multiplyScalar(-len * 0.5),
        dir.clone().multiplyScalar(len),
      ]);
      pivot.add(new THREE.Line(geo, mat));

      const makeSprite = (text: string, pos: THREE.Vector3, size = 0.22) => {
        const canvas = document.createElement("canvas");
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext("2d")!;
        ctx.font = "bold 48px sans-serif";
        ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 64, 64);
        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
        sprite.scale.set(size, size, 1);
        sprite.position.copy(pos);
        pivot.add(sprite);
      };

      makeSprite(posLabel, dir.clone().multiplyScalar(len + 0.18));
      makeSprite(negLabel, dir.clone().multiplyScalar(-len * 0.5 - 0.18), 0.18);
    };

    addAxis(new THREE.Vector3(0, 1, 0), 0x22c55e, "|0...0⟩", "|1...1⟩");
    addAxis(new THREE.Vector3(1, 0, 0), 0xef4444, "x", "-x");
    addAxis(new THREE.Vector3(0, 0, 1), 0x6366f1, "y", "-y");

    // --- State dots and lines ---
    const maxProb = Math.max(...stateData.map(d => d.prob), 0.01);

    for (const d of stateData) {
      const color = phaseToColor(d.phase);

      // Line from center to dot
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        d.pos.clone(),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
      pivot.add(new THREE.Line(lineGeo, lineMat));

      // Dot (size proportional to sqrt(prob) like IBM)
      const radius = 0.03 + 0.07 * Math.sqrt(d.prob / maxProb);
      const dotGeo = new THREE.SphereGeometry(radius, 16, 16);
      const dotMat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(d.pos);
      pivot.add(dot);

      // Label sprite for basis state – larger, with background pill
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 100;
      const ctx = canvas.getContext("2d")!;
      // Background pill
      const ph = 64, pw = 300, px = 10, py = 18, pr = 14;
      ctx.beginPath();
      ctx.moveTo(px + pr, py); ctx.lineTo(px + pw - pr, py);
      ctx.quadraticCurveTo(px + pw, py, px + pw, py + pr);
      ctx.lineTo(px + pw, py + ph - pr);
      ctx.quadraticCurveTo(px + pw, py + ph, px + pw - pr, py + ph);
      ctx.lineTo(px + pr, py + ph);
      ctx.quadraticCurveTo(px, py + ph, px, py + ph - pr);
      ctx.lineTo(px, py + pr);
      ctx.quadraticCurveTo(px, py, px + pr, py);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fill();
      ctx.strokeStyle = phaseToCSS(d.phase);
      ctx.lineWidth = 3;
      ctx.stroke();
      // Text
      ctx.font = "bold 46px monospace";
      ctx.fillStyle = "#111827";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`|${d.label}⟩`, 160, 50);
      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      sprite.scale.set(0.52, 0.16, 1);
      // Offset label outside the dot
      sprite.position.copy(d.pos.clone().multiplyScalar(1.22).add(new THREE.Vector3(0, 0.08, 0)));
      pivot.add(sprite);
    }

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dLight.position.set(3, 5, 4);
    scene.add(dLight);

    // Initial rotation (IBM-like angle)
    pivot.rotation.x = 0.25;
    pivot.rotation.y = 0.4;

    // Mouse drag
    const el = renderer.domElement;
    const onDown = (e: MouseEvent) => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !pivotRef.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      pivotRef.current.rotation.y += dx * 0.01;
      pivotRef.current.rotation.x += dy * 0.01;
    };
    const onUp = () => { isDragging.current = false; };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      renderer.dispose();
      if (mountRef.current?.contains(el)) mountRef.current.removeChild(el);
    };
  }, [stateData, numQubits]);

  // Phase legend entries
  const legendEntries = stateData.slice(0, 8).map(d => ({
    label: d.label,
    color: phaseToCSS(d.phase),
    prob: Math.round(d.prob * 1000) / 10,
    phase: Math.round((d.phase * 180) / Math.PI),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        ref={mountRef}
        style={{
          width: 320, height: 320,
          cursor: "grab",
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      />

      {/* Phase color wheel legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", justifyContent: "center", maxWidth: 320 }}>
        {legendEntries.map(e => (
          <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#374151" }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: e.color, flexShrink: 0,
            }} />
            <span style={{ fontFamily: "monospace" }}>|{e.label}⟩</span>
            <span style={{ color: "#9ca3af" }}>{e.prob}%</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, color: "#9ca3af" }}>Drag to rotate · Color = phase</div>

      {/* Erklärungsbox */}
      <div style={{
        maxWidth: 320, width: "100%",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "10px 12px",
        fontSize: 11,
        color: "#475569",
        lineHeight: 1.6,
      }}>
        <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: 6, fontSize: 12 }}>
          How to read the Q-Sphere
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ minWidth: 14 }}>📍</span>
            <span><b>Position:</b> Each dot is a basis state. North pole = |00…0⟩, south pole = |11…1⟩. States with the same number of 1s share the same latitude.</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ minWidth: 14 }}>⭕</span>
            <span><b>Size:</b> Larger dot = higher measurement probability.</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ minWidth: 14 }}>🎨</span>
            <span><b>Color:</b> Encodes the quantum phase of the amplitude. Same color = same phase. A phase difference causes interference.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Bloch Sphere (kept for 1-qubit case)
// ---------------------------------------------------------------------------

function SingleBlochSphere({ bloch, label }: { bloch: { x: number; y: number; z: number }; label: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const pivotRef = useRef<THREE.Group | null>(null);
  const arrowRef = useRef<THREE.ArrowHelper | null>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const theta = Math.acos(Math.max(-1, Math.min(1, bloch.y)));
  const phi = Math.atan2(bloch.z, bloch.x);
  const thetaDeg = Math.round(theta * 180 / Math.PI);
  const phiDeg = Math.round(((phi * 180 / Math.PI) + 360) % 360);

  useEffect(() => {
    if (!mountRef.current) return;
    const W = 280, H = 280;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa);

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(1.5, 1.2, 2.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const pivot = new THREE.Group();
    scene.add(pivot);
    pivotRef.current = pivot;

    pivot.add(new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 48),
      new THREE.MeshPhongMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    ));
    pivot.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.001, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x93c5fd, wireframe: true, transparent: true, opacity: 0.15 })
    ));

    // Equator
    const eq = new THREE.Mesh(new THREE.TorusGeometry(1, 0.008, 8, 64), new THREE.MeshBasicMaterial({ color: 0x60a5fa }));
    pivot.add(eq);

    // Meridian
    const mer = new THREE.Mesh(new THREE.TorusGeometry(1, 0.005, 8, 64), new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.4 }));
    mer.rotation.y = Math.PI / 2;
    pivot.add(mer);

    const addAxis = (dir: THREE.Vector3, color: number, label: string, negLabel: string) => {
      const len = 1.35;
      pivot.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([dir.clone().multiplyScalar(-len * 0.6), dir.clone().multiplyScalar(len)]),
        new THREE.LineBasicMaterial({ color })
      ));
      pivot.add(new THREE.ArrowHelper(dir.clone().normalize(), dir.clone().multiplyScalar(len - 0.25), 0.25, color, 0.15, 0.08));

      const makeSprite = (text: string, pos: THREE.Vector3, size = 0.28) => {
        const c = document.createElement("canvas");
        c.width = 128; c.height = 128;
        const ctx = c.getContext("2d")!;
        ctx.font = "bold 52px sans-serif";
        ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(text, 64, 64);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c) }));
        s.scale.set(size, size, 1);
        s.position.copy(pos);
        pivot.add(s);
      };
      makeSprite(label, dir.clone().multiplyScalar(len + 0.2));
      makeSprite(negLabel, dir.clone().multiplyScalar(-len * 0.6 - 0.2), 0.22);
    };

    addAxis(new THREE.Vector3(1, 0, 0), 0xef4444, "x", "-x");
    addAxis(new THREE.Vector3(0, 1, 0), 0x22c55e, "|0⟩", "|1⟩");
    addAxis(new THREE.Vector3(0, 0, 1), 0x6366f1, "y", "-y");

    const dir3 = new THREE.Vector3(bloch.x, bloch.y, bloch.z);
    const len3 = dir3.length();
    const arrow = new THREE.ArrowHelper(
      len3 > 0.001 ? dir3.clone().normalize() : new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      Math.min(len3, 0.98),
      0x1e40af, 0.18, 0.1
    );
    pivot.add(arrow);
    arrowRef.current = arrow;

    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color: 0x1e40af }));
    const tipPos = dir3.clone().normalize().multiplyScalar(Math.min(len3, 0.98));
    dot.position.copy(tipPos);
    pivot.add(dot);

    // Projection dashed line
    const projGeo = new THREE.BufferGeometry().setFromPoints([tipPos, new THREE.Vector3(0, tipPos.y, 0)]);
    const projLine = new THREE.Line(projGeo, new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.06, gapSize: 0.04 }));
    projLine.computeLineDistances();
    pivot.add(projLine);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dl = new THREE.DirectionalLight(0xffffff, 0.4);
    dl.position.set(3, 5, 4);
    scene.add(dl);

    pivot.rotation.x = 0.2;
    pivot.rotation.y = -0.4;

    const el = renderer.domElement;
    const onDown = (e: MouseEvent) => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !pivotRef.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      if (e.shiftKey) pivotRef.current.rotation.z += dx * 0.01;
      else { pivotRef.current.rotation.y += dx * 0.01; pivotRef.current.rotation.x += dy * 0.01; }
    };
    const onUp = () => { isDragging.current = false; };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    const animate = () => { frameRef.current = requestAnimationFrame(animate); renderer.render(scene, camera); };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      renderer.dispose();
      if (mountRef.current?.contains(el)) mountRef.current.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (!arrowRef.current) return;
    const dir = new THREE.Vector3(bloch.x, bloch.y, bloch.z);
    const len = dir.length();
    if (len > 0.001) { arrowRef.current.setDirection(dir.normalize()); arrowRef.current.setLength(Math.min(len, 0.98), 0.18, 0.1); }
  }, [bloch.x, bloch.y, bloch.z]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{label}</div>
      <div ref={mountRef} style={{ width: 280, height: 280, cursor: "grab", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }} />
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6b7280" }}>
        <span>θ = {thetaDeg}°</span>
        <span>φ = {phiDeg}°</span>
      </div>
      <div style={{ fontSize: 10, color: "#9ca3af" }}>Drag · Shift+Drag Z-axis</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------------

/** Single-qubit Bloch sphere (for 1-qubit circuits) */
export function BlochSphere({ statevector, numQubits, qubitIndex = 0 }: BlochSphereProps) {
  const bloch = useMemo(() =>
    getBlochVector(statevector, numQubits, qubitIndex),
    [statevector, numQubits, qubitIndex]
  );
  return <SingleBlochSphere bloch={bloch} label={`q${qubitIndex}`} />;
}

/**
 * Multi-qubit visualization:
 * - 1 qubit → single Bloch sphere
 * - 2+ qubits → Q-Sphere (IBM style)
 */
export function BlochSphereMulti({
  statevector,
  numQubits,
}: {
  statevector: { re: number; im: number }[];
  numQubits: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <QSphere statevector={statevector} numQubits={numQubits} />
    </div>
  );
}
