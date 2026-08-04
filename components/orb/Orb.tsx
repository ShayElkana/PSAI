"use client";

import { useEffect, useRef } from "react";
import type { Emotion, RelayState } from "@/types/conversation";
import { colorsForEmotion, radiusFraction } from "./orb-animation";

interface OrbProps {
  state: RelayState;
  emotion: Emotion;
  audioLevel: number; // 0..1, smoothed by the caller
}

// Fixed offsets for the sparkle particles scattered across the glow — not
// random, so they don't jump around between renders, just individually
// twinkle in place.
const SPARKLES = [
  { dx: -0.55, dy: -0.1, phase: 0 },
  { dx: -0.2, dy: 0.25, phase: 1.1 },
  { dx: 0.15, dy: -0.3, phase: 2.3 },
  { dx: 0.5, dy: 0.05, phase: 3.4 },
  { dx: -0.4, dy: 0.35, phase: 4.2 },
  { dx: 0.35, dy: 0.3, phase: 5.1 },
];

export function Orb({ state, emotion, audioLevel }: OrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const pulseRef = useRef(0);

  // Keep latest props in refs so the animation loop (started once) always
  // reads current values without needing to restart on every render.
  const stateRef = useRef(state);
  const emotionRef = useRef(emotion);
  const audioLevelRef = useRef(audioLevel);
  useEffect(() => {
    stateRef.current = state;
    emotionRef.current = emotion;
    audioLevelRef.current = audioLevel;
  }, [state, emotion, audioLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      pulseRef.current += stateRef.current === "reconnecting" ? 0.045 : 0.02;

      const colors = colorsForEmotion(emotionRef.current);
      const frac = radiusFraction(stateRef.current, audioLevelRef.current);
      const spread = w * (frac + 0.22); // horizontal reach of the glow patch
      const cx = w / 2;
      // Sits near the top of this strip — roughly the waterline among the
      // rocks — so ripples have room to expand down into the visible water.
      const cy = h * 0.3;

      ctx.globalAlpha = stateRef.current === "error" ? 0.4 : 1;

      // Soft, irregular glow — a few overlapping flattened radial
      // gradients rather than one perfect circle, so it reads as light
      // welling up through water rather than a solid shape.
      const blobs = [
        { ox: 0, oy: 0, r: spread, alpha: 1 },
        { ox: -spread * 0.3, oy: spread * 0.08, r: spread * 0.65, alpha: 0.7 },
        { ox: spread * 0.35, oy: -spread * 0.05, r: spread * 0.6, alpha: 0.7 },
      ];
      for (const b of blobs) {
        const bx = cx + b.ox;
        const by = cy + b.oy;
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(1, 0.45);
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, b.r);
        glow.addColorStop(0, colors.glow);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha *= b.alpha;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = stateRef.current === "error" ? 0.4 : 1;
      }

      // Expanding ripple rings, like something glowing is disturbing the
      // water's surface.
      const ringCount = 3;
      const maxRingRadius = spread * 1.4;
      for (let i = 0; i < ringCount; i++) {
        const cycle = ((pulseRef.current * 18 + i * (maxRingRadius / ringCount)) % maxRingRadius) / maxRingRadius;
        const ringRadius = cycle * maxRingRadius;
        const ringAlpha = (1 - cycle) * 0.35;
        if (ringAlpha <= 0) continue;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, 0.4);
        ctx.strokeStyle = colors.outer;
        ctx.globalAlpha = ringAlpha;
        ctx.lineWidth = Math.max(1, spread * 0.015);
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // Twinkling sparkle particles scattered across the glow.
      for (const s of SPARKLES) {
        const twinkle = 0.15 + 0.25 * Math.max(0, Math.sin(pulseRef.current * 2.6 + s.phase * 2));
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.beginPath();
        ctx.ellipse(
          cx + s.dx * spread,
          cy + s.dy * spread * 0.45,
          spread * 0.03,
          spread * 0.015,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      frameRef.current = requestAnimationFrame(draw);
    }
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="psai-water-glow" aria-hidden="true" />;
}
