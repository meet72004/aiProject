// CREDIT: Component inspired by @BalintFerenczy on X
// https://codepen.io/BalintFerenczy/pen/KwdoyEN

import { useRef, useEffect, useState } from "react";
import "./ElectricBorder.css";

function hexToRgba(hex, alpha = 1) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(125, 249, 255, ${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function ElectricBorder({
  color = "#7df9ff",
  speed = 1,
  chaos = 0.12,
  thickness = 2,
  style = {},
  children,
  className = "",
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const borderRadius = typeof style?.borderRadius === "number" ? style.borderRadius : 16;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      if (container) {
        const { width, height } = container.getBoundingClientRect();
        setSize({ width: Math.round(width), height: Math.round(height) });
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width <= 0 || size.height <= 0) return;

    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    let rafId;

    const draw = () => {
      frame++;
      const t = frame * 0.02 * speed;
      const w = size.width;
      const h = size.height;
      const r = Math.min(borderRadius, w / 4, h / 4);
      const inset = thickness / 2;
      const x0 = inset;
      const y0 = inset;
      const x1 = w - inset;
      const y1 = h - inset;

      ctx.clearRect(0, 0, w, h);

      const steps = 120;
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const s = i / steps;
        const seed = s * 10 + t;
        const jitter = chaos * 12 * (Math.sin(seed) * 0.6 + Math.sin(seed * 2.3 + 1) * 0.4);
        let x, y, nx, ny;
        if (s < 0.25) {
          const u = s / 0.25;
          x = x0 + r + u * (x1 - x0 - 2 * r);
          y = y0;
          nx = 0;
          ny = -1;
        } else if (s < 0.5) {
          const u = (s - 0.25) / 0.25;
          x = x1;
          y = y0 + r + u * (y1 - y0 - 2 * r);
          nx = 1;
          ny = 0;
        } else if (s < 0.75) {
          const u = (s - 0.5) / 0.25;
          x = x1 - r - u * (x1 - x0 - 2 * r);
          y = y1;
          nx = 0;
          ny = 1;
        } else {
          const u = (s - 0.75) / 0.25;
          x = x0;
          y = y1 - r - u * (y1 - y0 - 2 * r);
          nx = -1;
          ny = 0;
        }
        pts.push([x + nx * jitter, y + ny * jitter]);
      }

      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();

      ctx.strokeStyle = hexToRgba(color, 0.9);
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.strokeStyle = hexToRgba(color, 0.4);
      ctx.lineWidth = thickness + 6;
      ctx.stroke();

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [size, color, speed, chaos, thickness, borderRadius]);

  return (
    <div
      ref={containerRef}
      className={`electric-border ${className}`}
      style={{
        ...style,
        ["--electric-border-color"]: color,
      }}
    >
      <div className="eb-canvas-container" style={{ width: size.width, height: size.height }}>
        <canvas ref={canvasRef} className="eb-canvas" width={size.width} height={size.height} />
      </div>
      <div className="eb-layers">
        <div className="eb-glow-1" />
        <div className="eb-glow-2" />
        <div className="eb-background-glow" />
      </div>
      <div className="eb-content">{children}</div>
    </div>
  );
}
