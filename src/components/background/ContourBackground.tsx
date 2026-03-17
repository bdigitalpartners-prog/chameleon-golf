"use client";

import { useEffect, useRef } from "react";

// ──────────────────────────────────────
// Perlin noise (seed-based with FBM)
// ──────────────────────────────────────

const GRAD3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

class PerlinNoise {
  perm: number[];

  constructor(seed: number) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;

    let s = seed || 42;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }

    this.perm = new Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const aa = this.perm[this.perm[X] + Y] % 12;
    const ab = this.perm[this.perm[X] + Y + 1] % 12;
    const ba = this.perm[this.perm[X + 1] + Y] % 12;
    const bb = this.perm[this.perm[X + 1] + Y + 1] % 12;
    const dot = (g: number[], dx: number, dy: number) => g[0] * dx + g[1] * dy;
    const x1 = dot(GRAD3[aa], xf, yf) * (1 - u) + dot(GRAD3[ba], xf - 1, yf) * u;
    const x2 = dot(GRAD3[ab], xf, yf - 1) * (1 - u) + dot(GRAD3[bb], xf - 1, yf - 1) * u;
    return x1 * (1 - v) + x2 * v;
  }

  fbm(x: number, y: number, octaves: number, lacunarity: number, gain: number): number {
    let sum = 0;
    let amp = 1;
    let freq = 1;
    let maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
      sum += this.noise(x * freq, y * freq) * amp;
      maxAmp += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / maxAmp;
  }
}

// ──────────────────────────────────────
// Terrain + contour algorithms
// ──────────────────────────────────────

const perlin1 = new PerlinNoise(42);
const perlin2 = new PerlinNoise(137);

function getTerrainValue(x: number, y: number, W: number, H: number, t: number): number {
  const nx = x / W;
  const ny = y / H;

  // Base rolling terrain
  let val = perlin1.fbm(nx * 3.5 + t * 0.02, ny * 3.5 + t * 0.01, 5, 2.0, 0.55);

  // Larger gentle hills (fairway undulations)
  val += perlin2.fbm(nx * 1.2 + t * 0.008, ny * 1.5 - t * 0.005, 3, 2.0, 0.5) * 0.6;

  // "Green" feature — smooth depression
  const gx = 0.65, gy = 0.4;
  const gDist = Math.sqrt((nx - gx) ** 2 + (ny - gy) ** 2);
  val -= Math.max(0, 0.3 - gDist) * 2.5 * Math.cos(gDist * 20);

  // "Fairway" ridge
  const fwDist = Math.abs(ny - (0.5 + Math.sin(nx * 4 + t * 0.015) * 0.15));
  val += Math.max(0, 0.12 - fwDist) * 1.5;

  // Water hazard depression
  const wx = 0.3, wy = 0.7;
  const wDist = Math.sqrt((nx - wx) ** 2 * 1.5 + (ny - wy) ** 2);
  val -= Math.max(0, 0.15 - wDist) * 3.0;

  // Bunker dimples
  const bx1 = 0.55, by1 = 0.55;
  const bDist1 = Math.sqrt((nx - bx1) ** 2 + (ny - by1) ** 2);
  val -= Math.max(0, 0.06 - bDist1) * 4.0;

  const bx2 = 0.75, by2 = 0.65;
  const bDist2 = Math.sqrt((nx - bx2) ** 2 + (ny - by2) ** 2);
  val -= Math.max(0, 0.05 - bDist2) * 3.5;

  return val;
}

interface Segment {
  from: [number, number];
  to: [number, number];
}

function getContourPaths(
  threshold: number,
  step: number,
  W: number,
  H: number,
  time: number,
): Segment[] {
  const paths: Segment[] = [];
  const visited = new Set<string>();

  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const v00 = getTerrainValue(x, y, W, H, time) >= threshold ? 1 : 0;
      const v10 = getTerrainValue(x + step, y, W, H, time) >= threshold ? 1 : 0;
      const v01 = getTerrainValue(x, y + step, W, H, time) >= threshold ? 1 : 0;
      const v11 = getTerrainValue(x + step, y + step, W, H, time) >= threshold ? 1 : 0;

      const cell = v00 | (v10 << 1) | (v11 << 2) | (v01 << 3);
      if (cell === 0 || cell === 15) continue;

      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const t00 = getTerrainValue(x, y, W, H, time);
      const t10 = getTerrainValue(x + step, y, W, H, time);
      const t01 = getTerrainValue(x, y + step, W, H, time);
      const t11 = getTerrainValue(x + step, y + step, W, H, time);

      const lerp = (a: number, b: number, va: number, vb: number) =>
        a + ((threshold - va) / (vb - va)) * (b - a);

      const top: [number, number] = [lerp(x, x + step, t00, t10), y];
      const bottom: [number, number] = [lerp(x, x + step, t01, t11), y + step];
      const left: [number, number] = [x, lerp(y, y + step, t00, t01)];
      const right: [number, number] = [x + step, lerp(y, y + step, t10, t11)];

      const segments: [number, number][][] = [];
      switch (cell) {
        case 1: case 14: segments.push([top, left]); break;
        case 2: case 13: segments.push([top, right]); break;
        case 3: case 12: segments.push([left, right]); break;
        case 4: case 11: segments.push([right, bottom]); break;
        case 5: segments.push([top, right], [left, bottom]); break;
        case 6: case 9: segments.push([top, bottom]); break;
        case 7: case 8: segments.push([left, bottom]); break;
        case 10: segments.push([top, left], [right, bottom]); break;
      }

      for (const seg of segments) {
        paths.push({ from: seg[0], to: seg[1] });
      }
    }
  }
  return paths;
}

// ──────────────────────────────────────
// Contour levels
// ──────────────────────────────────────

const LEVELS = [
  { threshold: -0.5,  alpha: 0.04, width: 0.6 },
  { threshold: -0.35, alpha: 0.06, width: 0.7 },
  { threshold: -0.2,  alpha: 0.09, width: 0.8 },
  { threshold: -0.05, alpha: 0.11, width: 0.9 },
  { threshold: 0.0,   alpha: 0.14, width: 1.1 },
  { threshold: 0.05,  alpha: 0.12, width: 1.0 },
  { threshold: 0.1,   alpha: 0.16, width: 1.2 },
  { threshold: 0.15,  alpha: 0.13, width: 1.0 },
  { threshold: 0.2,   alpha: 0.18, width: 1.3 },
  { threshold: 0.25,  alpha: 0.15, width: 1.1 },
  { threshold: 0.3,   alpha: 0.20, width: 1.4 },
  { threshold: 0.35,  alpha: 0.17, width: 1.2 },
  { threshold: 0.4,   alpha: 0.22, width: 1.5 },
  { threshold: 0.5,   alpha: 0.25, width: 1.6 },
  { threshold: 0.6,   alpha: 0.28, width: 1.7 },
  { threshold: 0.7,   alpha: 0.22, width: 1.3 },
];

// ──────────────────────────────────────
// Draw function
// ──────────────────────────────────────

function draw(ctx: CanvasRenderingContext2D, W: number, H: number, time: number) {
  ctx.clearRect(0, 0, W, H);

  // Background gradient
  const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.7);
  bgGrad.addColorStop(0, "#0f1a12");
  bgGrad.addColorStop(0.5, "#0c1410");
  bgGrad.addColorStop(1, "#080d09");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  const step = Math.max(8, Math.round(Math.min(W, H) / 140));

  // Contour lines
  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i];
    const isIndex = i % 5 === 4;
    const segments = getContourPaths(level.threshold, step, W, H, time);

    const alpha = isIndex ? Math.min(1, level.alpha * 1.8) : level.alpha;
    ctx.strokeStyle = `rgba(34, 197, 94, ${alpha.toFixed(2)})`;
    ctx.lineWidth = isIndex ? level.width * 1.5 : level.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    for (const seg of segments) {
      ctx.moveTo(seg.from[0], seg.from[1]);
      ctx.lineTo(seg.to[0], seg.to[1]);
    }
    ctx.stroke();
  }

  // Elevation crosshair markers at peaks
  for (let y = step * 4; y < H; y += step * 8) {
    for (let x = step * 4; x < W; x += step * 8) {
      const v = getTerrainValue(x, y, W, H, time);
      if (v > 0.45) {
        const alpha = Math.min(0.2, (v - 0.45) * 0.8);
        const size = 3 + (v - 0.45) * 8;
        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.stroke();
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha * 1.5})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Elevation labels at select peaks
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  let labelCount = 0;
  for (let y = step * 6; y < H - step * 4; y += step * 12) {
    for (let x = step * 6; x < W - step * 4; x += step * 12) {
      const v = getTerrainValue(x, y, W, H, time);
      if (v > 0.5 && labelCount < 8) {
        const elev = Math.round(v * 120 + 40);
        ctx.fillStyle = "rgba(34, 197, 94, 0.12)";
        ctx.fillText(elev + "ft", x, y - 8);
        labelCount++;
      }
    }
  }

  // Subtle grid dots (survey markers)
  ctx.fillStyle = "rgba(34, 197, 94, 0.04)";
  const gridStep = 60;
  for (let y = gridStep; y < H; y += gridStep) {
    for (let x = gridStep; x < W; x += gridStep) {
      ctx.beginPath();
      ctx.arc(x, y, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ──────────────────────────────────────
// React component
// ──────────────────────────────────────

export default function ContourBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ W: 0, H: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas!.parentElement?.clientWidth ?? window.innerWidth;
      const H = canvas!.parentElement?.clientHeight ?? window.innerHeight;
      sizeRef.current = { W, H };
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = W + "px";
      canvas!.style.height = H + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function loop() {
      const { W, H } = sizeRef.current;
      if (W > 0 && H > 0) {
        draw(ctx!, W, H, timeRef.current);
        timeRef.current += 0.15;
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    resize();
    loop();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Canvas layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />

      {/* Radial glow overlays */}
      <div
        className="absolute rounded-full pointer-events-none animate-[glowFadeIn_3s_ease-out_0.5s_forwards]"
        style={{
          width: 600, height: 600,
          top: "-10%", left: "-5%",
          background: "radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%)",
          filter: "blur(120px)",
          zIndex: 1,
          opacity: 0,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none animate-[glowFadeIn_3s_ease-out_1s_forwards]"
        style={{
          width: 500, height: 500,
          bottom: "-10%", right: "-5%",
          background: "radial-gradient(circle, rgba(34, 197, 94, 0.06) 0%, transparent 70%)",
          filter: "blur(120px)",
          zIndex: 1,
          opacity: 0,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none animate-[glowFadeIn_3s_ease-out_1.5s_forwards]"
        style={{
          width: 400, height: 400,
          top: "40%", left: "55%",
          background: "radial-gradient(circle, rgba(34, 197, 94, 0.04) 0%, transparent 70%)",
          filter: "blur(120px)",
          zIndex: 1,
          opacity: 0,
        }}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          zIndex: 2,
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />
    </>
  );
}
