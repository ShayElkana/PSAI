"use client";

import { useEffect, useRef } from "react";
import type { Emotion, RelayState } from "@/types/conversation";
import { colorsForEmotion, radiusFraction } from "./orb-animation";

interface OrbProps {
  state: RelayState;
  emotion: Emotion;
  audioLevel: number; // 0..1, smoothed by the caller
}

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
      const size = Math.min(canvas.clientWidth, canvas.clientHeight);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      pulseRef.current += stateRef.current === "reconnecting" ? 0.05 : 0.02;
      const wobble = Math.sin(pulseRef.current) * 0.015;

      const colors = colorsForEmotion(emotionRef.current);
      const frac = radiusFraction(stateRef.current, audioLevelRef.current) + wobble;
      const radius = Math.min(w, h) * frac;
      const cx = w / 2;
      const cy = h / 2;

      const glowRadius = radius * 2.2;
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, glowRadius);
      glow.addColorStop(0, colors.glow);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      const body = ctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.3,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      body.addColorStop(0, colors.inner);
      body.addColorStop(1, colors.outer);
      ctx.fillStyle = body;
      ctx.globalAlpha = stateRef.current === "error" ? 0.4 : 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      frameRef.current = requestAnimationFrame(draw);
    }
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "min(60vw, 320px)", height: "min(60vw, 320px)" }}
      aria-hidden="true"
    />
  );
}
