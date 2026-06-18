/**
 * BlochSphere.tsx
 * Platzierung: src/components/BlochSphere.tsx
 * IBM Quantum Composer style Bloch sphere
 */

import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";

interface BlochSphereProps {
  statevector: { re: number; im: number }[];
  numQubits: number;
  qubitIndex?: number;
}

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

  return {
    x: 2 * rho01_re,
    y: rho00 - rho11,
    z: -2 * rho01_im,
  };
}

function SingleBlochSphere({ bloch, label }: { bloch: { x: number; y: number; z: number }; label: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const pivotRef = useRef<THREE.Group | null>(null);
  const arrowRef = useRef<THREE.ArrowHelper | null>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Compute theta and phi
  const theta = Math.acos(Math.max(-1, Math.min(1, bloch.y)));
  const phi = Math.atan2(bloch.z, bloch.x);
  const thetaDeg = Math.round(theta * 180 / Math.PI);
  const phiDeg = Math.round(((phi * 180 / Math.PI) + 360) % 360);

  // Symbolische Zustandsformel mit eingesetzten Winkeln:
  // |psi> = cos(theta/2)|0> + e^{i*phi}*sin(theta/2)|1>
  const cosHalfTheta = Math.cos(theta / 2);
  const sinHalfTheta = Math.sin(theta / 2);
  const fmt = (n: number) => {
    const rounded = Math.round(n * 1000) / 1000;
    return (rounded >= 0 ? "" : "") + rounded.toFixed(3).replace(/\.?0+$/, "").replace(/^$/, "0");
  };
  const stateFormula = `|ψ⟩ = cos(${thetaDeg}°/2)|0⟩ + e^(i·${phiDeg}°)·sin(${thetaDeg}°/2)|1⟩ ≈ ${fmt(cosHalfTheta)}|0⟩ + e^(i·${phiDeg}°)·${fmt(sinHalfTheta)}|1⟩`;

  useEffect(() => {
    if (!mountRef.current) return;
    const W = 220, H = 220;

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

    // Sphere (transparent)
    const sphereGeo = new THREE.SphereGeometry(1, 48, 48);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0xdbeafe, transparent: true, opacity: 0.15, side: THREE.DoubleSide,
    });
    pivot.add(new THREE.Mesh(sphereGeo, sphereMat));

    // Wireframe
    const wireGeo = new THREE.SphereGeometry(1.001, 16, 16);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd, wireframe: true, transparent: true, opacity: 0.15,
    });
    pivot.add(new THREE.Mesh(wireGeo, wireMat));

    // Equator circle
    const equatorGeo = new THREE.TorusGeometry(1, 0.008, 8, 64);
    pivot.add(new THREE.Mesh(equatorGeo, new THREE.MeshBasicMaterial({ color: 0x60a5fa })));

    // Meridian circles (XZ and YZ planes)
    const meridianGeo1 = new THREE.TorusGeometry(1, 0.005, 8, 64);
    const meridian1 = new THREE.Mesh(meridianGeo1, new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.4 }));
    meridian1.rotation.y = Math.PI / 2;
    pivot.add(meridian1);

    // Axes with arrows
    const addAxis = (dir: THREE.Vector3, color: number, label: string, negLabel: string) => {
      const len = 1.35;
      const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
      const geo = new THREE.BufferGeometry().setFromPoints([
        dir.clone().multiplyScalar(-len * 0.6),
        dir.clone().multiplyScalar(len),
      ]);
      pivot.add(new THREE.Line(geo, mat));

      // Arrow head
      const arrow = new THREE.ArrowHelper(dir.clone().normalize(), dir.clone().multiplyScalar(len - 0.25), 0.25, color, 0.15, 0.08);
      pivot.add(arrow);

      // Labels
      const makeSprite = (text: string, pos: THREE.Vector3, size: number = 0.28) => {
        const canvas = document.createElement("canvas");
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext("2d")!;
        ctx.font = "bold 52px sans-serif";
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

      makeSprite(label, dir.clone().multiplyScalar(len + 0.2));
      makeSprite(negLabel, dir.clone().multiplyScalar(-len * 0.6 - 0.2), 0.22);
    };

    addAxis(new THREE.Vector3(1, 0, 0), 0xef4444, "x", "-x");
    addAxis(new THREE.Vector3(0, 1, 0), 0x22c55e, "|0⟩", "|1⟩");
    addAxis(new THREE.Vector3(0, 0, 1), 0x6366f1, "y", "-y");

    // State vector arrow (thick, IBM style)
    const dir3 = new THREE.Vector3(bloch.x, bloch.y, bloch.z);
    const len3 = dir3.length();
    const arrow = new THREE.ArrowHelper(
      len3 > 0.001 ? dir3.normalize() : new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      Math.min(len3, 0.98),
      0x1e40af, 0.18, 0.1
    );
    pivot.add(arrow);
    arrowRef.current = arrow;

    // Dot at tip
    const dotGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0x1e40af }));
    dot.position.copy(new THREE.Vector3(bloch.x, bloch.y, bloch.z).normalize().multiplyScalar(Math.min(len3, 0.98)));
    pivot.add(dot);

    // Dashed line from tip to Z-axis (projection)
    const tipPos = new THREE.Vector3(bloch.x, bloch.y, bloch.z).normalize().multiplyScalar(Math.min(len3, 0.98));
    const projPos = new THREE.Vector3(0, tipPos.y, 0);
    const projGeo = new THREE.BufferGeometry().setFromPoints([tipPos, projPos]);
    const projMat = new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.06, gapSize: 0.04 });
    const projLine = new THREE.Line(projGeo, projMat);
    projLine.computeLineDistances();
    pivot.add(projLine);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dLight.position.set(3, 5, 4);
    scene.add(dLight);

    // Initial rotation (IBM-like perspective)
    pivot.rotation.x = 0.2;
    pivot.rotation.y = -0.4;

    // Mouse drag
    const el = renderer.domElement;
    const onDown = (e: MouseEvent) => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !pivotRef.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      if (e.shiftKey) {
        pivotRef.current.rotation.z += dx * 0.01;
      } else {
        pivotRef.current.rotation.y += dx * 0.01;
        pivotRef.current.rotation.x += dy * 0.01;
      }
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
  }, []);

  // Update arrow when bloch changes
  useEffect(() => {
    if (!arrowRef.current || !pivotRef.current) return;
    const dir = new THREE.Vector3(bloch.x, bloch.y, bloch.z);
    const len = dir.length();
    if (len > 0.001) {
      arrowRef.current.setDirection(dir.normalize());
      arrowRef.current.setLength(Math.min(len, 0.98), 0.18, 0.1);
    }
  }, [bloch.x, bloch.y, bloch.z]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{label}</div>
      <div
        ref={mountRef}
        style={{ width: 220, height: 220, cursor: "grab", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}
      />
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6b7280" }}>
        <span>θ = {thetaDeg}°</span>
        <span>φ = {phiDeg}°</span>
      </div>
      <div style={{ fontSize: 10.5, color: "#4b5563", textAlign: "center", maxWidth: 230, fontFamily: "monospace" }}>
        {stateFormula}
      </div>
      <div style={{ fontSize: 10, color: "#9ca3af" }}>Drag · Shift+Drag Z-axis</div>
    </div>
  );
}

export function BlochSphere({ statevector, numQubits, qubitIndex = 0 }: BlochSphereProps) {
  const bloch = useMemo(() =>
    getBlochVector(statevector, numQubits, qubitIndex),
    [statevector, numQubits, qubitIndex]
  );

  return <SingleBlochSphere bloch={bloch} label={`q${qubitIndex}`} />;
}

// Multi-qubit version showing all qubits side by side
export function BlochSphereMulti({ statevector, numQubits }: { statevector: { re: number; im: number }[]; numQubits: number }) {
  const blochVectors = useMemo(() =>
    Array.from({ length: numQubits }, (_, i) => getBlochVector(statevector, numQubits, i)),
    [statevector, numQubits]
  );

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
      {blochVectors.map((bloch, i) => (
        <SingleBlochSphere key={i} bloch={bloch} label={`q${i}`} />
      ))}
    </div>
  );
}
