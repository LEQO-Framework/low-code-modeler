/**
 * BlochSphere.tsx
 * Platzierung: src/components/BlochSphere.tsx
 *
 * Interaktive 3D Bloch-Sphäre mit Three.js
 * - Zeigt den Zustand eines einzelnen Qubits
 * - Rotierbar per Maus-Drag
 * - Qubit auswählbar
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface BlochSphereProps {
  /** Zustandsvektor des gesamten Systems */
  statevector: { re: number; im: number }[];
  /** Anzahl der Qubits */
  numQubits: number;
  /** Welches Qubit anzeigen */
  qubitIndex?: number;
}

/**
 * Berechnet die reduzierten Bloch-Koordinaten für ein einzelnes Qubit
 * durch partiellen Trace über alle anderen Qubits.
 *
 * Bloch-Vektor: r = (x, y, z) wobei
 *   x = 2 Re(ρ₀₁)  → |+⟩/|-⟩ Achse
 *   y = 2 Im(ρ₀₁)  → |i⟩/|-i⟩ Achse  
 *   z = ρ₀₀ - ρ₁₁  → |0⟩/|1⟩ Achse
 */
function getBlochVector(
  statevector: { re: number; im: number }[],
  numQubits: number,
  qubitIndex: number
): { x: number; y: number; z: number } {
  let rho00_re = 0, rho01_re = 0, rho01_im = 0, rho11_re = 0;

  const n = statevector.length;
  const bit = numQubits - 1 - qubitIndex;

  for (let i = 0; i < n; i++) {
    const bi = (i >> bit) & 1;
    for (let j = 0; j < n; j++) {
      const bj = (j >> bit) & 1;
      // Andere Bits müssen übereinstimmen
      const mask = ~(1 << bit) & (n - 1);
      if ((i & mask) !== (j & mask)) continue;

      // ρ_ij = ψ_i · ψ_j*
      const re =  statevector[i].re * statevector[j].re + statevector[i].im * statevector[j].im;
      const im =  statevector[i].im * statevector[j].re - statevector[i].re * statevector[j].im;

      if (bi === 0 && bj === 0) rho00_re += re;
      if (bi === 1 && bj === 1) rho11_re += re;
      if (bi === 0 && bj === 1) { rho01_re += re; rho01_im += im; }
    }
  }

  return {
    x: 2 * rho01_re,   // Re-Achse → Three.js X
    y: rho00_re - rho11_re,  // Z-Achse der Blochsphäre → Three.js Y (oben)
    z: -2 * rho01_im,  // Im-Achse → Three.js Z (negiert wegen Rechtshänder-System)
  };
}

export function BlochSphere({ statevector, numQubits, qubitIndex = 0 }: BlochSphereProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const arrowRef = useRef<THREE.ArrowHelper | null>(null);
  const frameRef = useRef<number>(0);

  // Maus-Drag für Rotation
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.3, y: 0.5 });

  const bloch = getBlochVector(statevector, numQubits, qubitIndex);

  useEffect(() => {
    if (!mountRef.current) return;
    const W = 260;
    const H = 260;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9fafb);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0, 5.0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Sphäre (transparent)
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    scene.add(new THREE.Mesh(sphereGeo, sphereMat));

    // Gitterlinien
    const wireGeo = new THREE.SphereGeometry(1.001, 16, 16);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    scene.add(new THREE.Mesh(wireGeo, wireMat));

    // Äquator-Kreis
    const equatorGeo = new THREE.TorusGeometry(1, 0.005, 8, 64);
    const equatorMat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
    scene.add(new THREE.Mesh(equatorGeo, equatorMat));

    // Achsen
    const axisLen = 1.3;
    const addAxis = (dir: THREE.Vector3, color: number) => {
      const mat = new THREE.LineBasicMaterial({ color });
      const geo = new THREE.BufferGeometry().setFromPoints([
        dir.clone().multiplyScalar(-axisLen),
        dir.clone().multiplyScalar(axisLen),
      ]);
      scene.add(new THREE.Line(geo, mat));
    };
    addAxis(new THREE.Vector3(1, 0, 0), 0xef4444); // X rot  → |+⟩/|-⟩
    addAxis(new THREE.Vector3(0, 1, 0), 0x6366f1); // Z blau → |0⟩/|1⟩
    addAxis(new THREE.Vector3(0, 0, 1), 0x22c55e); // Y grün → |i⟩/|-i⟩

    // Achsenbeschriftungen als Sprites
    const makeLabel = (text: string, pos: THREE.Vector3) => {
      const canvas = document.createElement("canvas");
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext("2d")!;
      ctx.font = "bold 36px sans-serif";
      ctx.fillStyle = "#374151";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 32, 32);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.3, 0.3, 1);
      sprite.position.copy(pos);
      scene.add(sprite);
    };

    makeLabel("|0⟩", new THREE.Vector3(0, 1.6, 0));
    makeLabel("|1⟩", new THREE.Vector3(0, -1.6, 0));
    makeLabel("|+⟩", new THREE.Vector3(1.6, 0, 0));
    makeLabel("|-⟩", new THREE.Vector3(-1.6, 0, 0));

    // Achsenbeschriftungen X, Y, Z
    makeLabel("X", new THREE.Vector3(1.6, 0.15, 0));
    makeLabel("Y", new THREE.Vector3(0, 0.15, 1.6));
    makeLabel("Z", new THREE.Vector3(0.15, 1.6, 0));

    // Licht
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dLight.position.set(2, 3, 4);
    scene.add(dLight);

    // Bloch-Vektor Pfeil
    // bloch.x → Three.js X, bloch.y → Three.js Y (oben=|0⟩), bloch.z → Three.js Z
    const dir = new THREE.Vector3(bloch.x, bloch.y, bloch.z).normalize();
    const len = Math.sqrt(bloch.x ** 2 + bloch.y ** 2 + bloch.z ** 2);
    const arrow = new THREE.ArrowHelper(
      len > 0.001 ? dir : new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      Math.min(Math.max(len, 0.01), 1),
      0xef4444, 0.2, 0.1
    );
    scene.add(arrow);
    arrowRef.current = arrow;

    // Pivot für Rotation
    const pivot = new THREE.Group();
    pivot.rotation.x = rotation.current.x;
    pivot.rotation.y = rotation.current.y;
    scene.children.forEach((c) => { if (c !== camera) { scene.remove(c); pivot.add(c); } });
    scene.add(pivot);

    // Render-Loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (cameraRef.current && rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Maus-Events – Links: X/Y Rotation, Rechts/Shift: Z Rotation
    const el = renderer.domElement;
    const onDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      if (e.shiftKey) {
        // Shift+Drag → Z-Rotation (um Y-Achse der Sphäre)
        pivot.rotation.z += dx * 0.01;
      } else {
        // Normal → X/Y Rotation
        pivot.rotation.y += dx * 0.01;
        pivot.rotation.x += dy * 0.01;
      }
    };
    const onUp = () => { isDragging.current = false; };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      cancelAnimationFrame(frameRef.current);
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      renderer.dispose();
      if (mountRef.current?.contains(el)) mountRef.current.removeChild(el);
    };
  }, []);

  // Bloch-Vektor aktualisieren wenn sich der Zustand ändert
  useEffect(() => {
    if (!arrowRef.current) return;
    const dir = new THREE.Vector3(bloch.x, bloch.y, bloch.z);
    const len = dir.length();
    if (len > 0.001) {
      arrowRef.current.setDirection(dir.normalize());
      arrowRef.current.setLength(Math.min(len, 1), 0.2, 0.1);
    }
  }, [bloch.x, bloch.y, bloch.z]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <div
        ref={mountRef}
        style={{ width: 260, height: 260, cursor: "grab", borderRadius: "8px", overflow: "hidden" }}
      />
      <span style={{ fontSize: "10px", color: "#9ca3af" }}>
        Drag to rotate · Shift+Drag for Z-axis
      </span>
    </div>
  );
}
