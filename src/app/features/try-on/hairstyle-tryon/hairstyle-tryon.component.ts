import {
  Component,
  signal,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as faceapi from 'face-api.js';

interface Landmark { x: number; y: number; }

interface HairstyleOption {
  id: string;
  name: string;
  category: 'corto' | 'medio' | 'largo' | 'rizado' | 'fade';
  icon: string;
  description: string;
}

const HAIRSTYLES: HairstyleOption[] = [
  { id: 'pixie',      name: 'Pixie Cut',        category: 'corto',  icon: '✂️', description: 'Muy corto, moderno' },
  { id: 'undercut',   name: 'Undercut',          category: 'fade',   icon: '⚡', description: 'Fade con volumen arriba' },
  { id: 'classic',    name: 'Clásico con raya',  category: 'corto',  icon: '💼', description: 'Raya lateral elegante' },
  { id: 'bob',        name: 'Bob Liso',          category: 'medio',  icon: '〰️', description: 'A la altura del cuello' },
  { id: 'waves',      name: 'Ondas',             category: 'medio',  icon: '🌊', description: 'Mediano con ondas' },
  { id: 'long',       name: 'Liso Largo',        category: 'largo',  icon: '💫', description: 'Largo y liso' },
  { id: 'curly',      name: 'Rizado Natural',    category: 'rizado', icon: '🌀', description: 'Rizos definidos' },
  { id: 'afro',       name: 'Afro',              category: 'rizado', icon: '☁️', description: 'Volumen esférico' },
  { id: 'ponytail',   name: 'Cola Alta',         category: 'largo',  icon: '🎀', description: 'Recogido en lo alto' },
];

interface FaceData {
  scaleX: number;
  scaleY: number;
  faceX: number;
  faceY: number;
  faceW: number;
  faceH: number;
  landmarks: Landmark[];
  // derived
  foreheadY: number;
  headTopY: number;
  leftTempleX: number;
  rightTempleX: number;
  centerX: number;
}

function parseLandmarks(pts: { x: number; y: number }[], sx: number, sy: number): Landmark[] {
  return pts.map(p => ({ x: p.x * sx, y: p.y * sy }));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (v: number) => Math.min(255, Math.round(v + (255 - v) * amount));
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

// ─── Hair drawing functions ─────────────────────────────────────────────────

function drawHair(ctx: CanvasRenderingContext2D, face: FaceData, styleId: string, color: string): void {
  ctx.save();
  switch (styleId) {
    case 'pixie':      drawPixie(ctx, face, color); break;
    case 'undercut':   drawUndercut(ctx, face, color); break;
    case 'classic':    drawClassic(ctx, face, color); break;
    case 'bob':        drawBob(ctx, face, color); break;
    case 'waves':      drawWaves(ctx, face, color); break;
    case 'long':       drawLongStraight(ctx, face, color); break;
    case 'curly':      drawCurly(ctx, face, color); break;
    case 'afro':       drawAfro(ctx, face, color); break;
    case 'ponytail':   drawPonytail(ctx, face, color); break;
  }
  ctx.restore();
}

function hairGrad(ctx: CanvasRenderingContext2D, x: number, yTop: number, yBot: number, color: string): CanvasGradient {
  const g = ctx.createLinearGradient(x, yTop, x, yBot);
  g.addColorStop(0,   lighten(color, 0.35));
  g.addColorStop(0.3, color);
  g.addColorStop(0.7, color);
  g.addColorStop(1,   darken(color, 0.35));
  return g;
}

function addStrands(ctx: CanvasRenderingContext2D, face: FaceData, color: string,
                    count: number, startY: number, endY: number, spreadX: number, curve = 0): void {
  ctx.lineWidth = 1.2;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = face.centerX - spreadX / 2 + spreadX * t;
    const jitter = (Math.random() - 0.5) * face.faceW * 0.04;
    ctx.strokeStyle = t < 0.5 ? lighten(color, 0.15) : darken(color, 0.1);
    ctx.beginPath();
    ctx.moveTo(x + jitter, startY);
    ctx.bezierCurveTo(
      x + jitter + curve * (t - 0.5) * 2,
      startY + (endY - startY) * 0.4,
      x + jitter + curve * (t - 0.5) * 1.5,
      startY + (endY - startY) * 0.75,
      x + jitter + curve * (t - 0.5),
      endY
    );
    ctx.stroke();
  }
}

function drawPixie(ctx: CanvasRenderingContext2D, f: FaceData, color: string): void {
  const { centerX, headTopY, foreheadY, faceW, leftTempleX, rightTempleX } = f;
  const pad = faceW * 0.12;

  // Filled skull cap
  const grad = ctx.createRadialGradient(centerX, headTopY + faceW * 0.1, faceW * 0.05, centerX, headTopY + faceW * 0.1, faceW * 0.65);
  grad.addColorStop(0, lighten(color, 0.3));
  grad.addColorStop(1, darken(color, 0.2));

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(leftTempleX - pad, foreheadY + f.faceH * 0.02);
  ctx.bezierCurveTo(
    leftTempleX - pad, headTopY + faceW * 0.12,
    centerX - faceW * 0.5, headTopY,
    centerX, headTopY - faceW * 0.05
  );
  ctx.bezierCurveTo(
    centerX + faceW * 0.5, headTopY,
    rightTempleX + pad, headTopY + faceW * 0.12,
    rightTempleX + pad, foreheadY + f.faceH * 0.02
  );
  ctx.closePath();
  ctx.fill();

  // Side wisps
  addStrands(ctx, f, color, 20, headTopY, foreheadY + f.faceH * 0.05,
    rightTempleX - leftTempleX + pad * 2, faceW * 0.08);
}

function drawUndercut(ctx: CanvasRenderingContext2D, f: FaceData, color: string): void {
  const { centerX, headTopY, foreheadY, faceW, faceH, leftTempleX, rightTempleX } = f;
  const sideTop = foreheadY + faceH * 0.25;

  // Volume on top
  const topW = faceW * 0.65;
  const grad = hairGrad(ctx, centerX, headTopY - faceW * 0.15, foreheadY, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(centerX, headTopY + faceW * 0.02, topW / 2, faceW * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Swept volume
  ctx.fillStyle = darken(color, 0.12);
  ctx.beginPath();
  ctx.moveTo(centerX - topW / 2, foreheadY + faceH * 0.02);
  ctx.bezierCurveTo(
    centerX - topW * 0.6, headTopY, centerX + topW * 0.1, headTopY - faceW * 0.25, centerX + topW / 2, foreheadY - faceH * 0.05
  );
  ctx.bezierCurveTo(centerX + topW * 0.3, foreheadY + faceH * 0.05, centerX, foreheadY + faceH * 0.07, centerX - topW / 2, foreheadY + faceH * 0.02);
  ctx.fill();

  // Side fade - very short stubble bands
  for (let i = 0; i < 4; i++) {
    const yy = sideTop + i * faceH * 0.06;
    const alpha = 0.2 - i * 0.04;
    ctx.fillStyle = `rgba(${hexToRgb(color).r},${hexToRgb(color).g},${hexToRgb(color).b},${alpha})`;
    ctx.fillRect(leftTempleX - faceW * 0.14, yy, faceW * 0.14, faceH * 0.055);
    ctx.fillRect(rightTempleX, yy, faceW * 0.14, faceH * 0.055);
  }

  addStrands(ctx, f, color, 30, headTopY - faceW * 0.05, foreheadY, topW, -faceW * 0.25);
}

function drawClassic(ctx: CanvasRenderingContext2D, f: FaceData, color: string): void {
  const { centerX, headTopY, foreheadY, faceW, faceH, leftTempleX, rightTempleX } = f;
  const parting = centerX - faceW * 0.1;

  const grad = hairGrad(ctx, centerX, headTopY, foreheadY, color);
  ctx.fillStyle = grad;

  // Main cap
  ctx.beginPath();
  ctx.moveTo(leftTempleX - faceW * 0.1, foreheadY + faceH * 0.02);
  ctx.bezierCurveTo(leftTempleX - faceW * 0.1, headTopY, centerX - faceW * 0.5, headTopY - faceW * 0.05, centerX, headTopY - faceW * 0.08);
  ctx.bezierCurveTo(centerX + faceW * 0.5, headTopY - faceW * 0.05, rightTempleX + faceW * 0.1, headTopY, rightTempleX + faceW * 0.1, foreheadY + faceH * 0.02);
  ctx.closePath();
  ctx.fill();

  // Parting highlight
  const pGrad = ctx.createLinearGradient(parting - 6, foreheadY, parting + 6, foreheadY);
  pGrad.addColorStop(0, 'rgba(255,255,255,0)');
  pGrad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
  pGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = pGrad;
  ctx.fillRect(parting - 6, headTopY, 12, foreheadY - headTopY + faceH * 0.05);

  // Swept strands left side
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    const sx = parting - t * faceW * 0.55;
    const sy = headTopY + (foreheadY - headTopY) * 0.2;
    const ex = leftTempleX - faceW * 0.12 + t * faceW * 0.3;
    const ey = foreheadY + faceH * 0.02;
    ctx.strokeStyle = darken(color, 0.05 + t * 0.1);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo((sx + ex) / 2, (sy + ey) / 2 - faceH * 0.02, ex, ey);
    ctx.stroke();
  }

  // Swept strands right side
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    const sx = parting + t * faceW * 0.55;
    const sy = headTopY + (foreheadY - headTopY) * 0.2;
    const ex = rightTempleX + faceW * 0.12 - t * faceW * 0.3;
    const ey = foreheadY + faceH * 0.02;
    ctx.strokeStyle = darken(color, 0.05 + t * 0.1);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo((sx + ex) / 2, (sy + ey) / 2 - faceH * 0.02, ex, ey);
    ctx.stroke();
  }
}

function drawBob(ctx: CanvasRenderingContext2D, f: FaceData, color: string): void {
  const { centerX, headTopY, foreheadY, faceW, faceH, faceX, faceY, leftTempleX, rightTempleX } = f;
  const bobBottom = faceY + faceH * 1.1;
  const padX = faceW * 0.22;

  // Side curtain left
  const gLeft = ctx.createLinearGradient(leftTempleX - padX, foreheadY, leftTempleX, bobBottom);
  gLeft.addColorStop(0, lighten(color, 0.2));
  gLeft.addColorStop(1, darken(color, 0.3));
  ctx.fillStyle = gLeft;
  ctx.beginPath();
  ctx.moveTo(leftTempleX - padX, foreheadY + faceH * 0.05);
  ctx.bezierCurveTo(leftTempleX - padX - faceW * 0.08, faceY + faceH * 0.5, leftTempleX - padX - faceW * 0.05, faceY + faceH * 0.85, leftTempleX - padX + faceW * 0.08, bobBottom);
  ctx.lineTo(leftTempleX + faceW * 0.06, bobBottom - faceH * 0.12);
  ctx.lineTo(leftTempleX, foreheadY + faceH * 0.12);
  ctx.closePath();
  ctx.fill();

  // Side curtain right
  const gRight = ctx.createLinearGradient(rightTempleX + padX, foreheadY, rightTempleX, bobBottom);
  gRight.addColorStop(0, lighten(color, 0.2));
  gRight.addColorStop(1, darken(color, 0.3));
  ctx.fillStyle = gRight;
  ctx.beginPath();
  ctx.moveTo(rightTempleX + padX, foreheadY + faceH * 0.05);
  ctx.bezierCurveTo(rightTempleX + padX + faceW * 0.08, faceY + faceH * 0.5, rightTempleX + padX + faceW * 0.05, faceY + faceH * 0.85, rightTempleX + padX - faceW * 0.08, bobBottom);
  ctx.lineTo(rightTempleX - faceW * 0.06, bobBottom - faceH * 0.12);
  ctx.lineTo(rightTempleX, foreheadY + faceH * 0.12);
  ctx.closePath();
  ctx.fill();

  // Top cap
  const capGrad = hairGrad(ctx, centerX, headTopY, foreheadY, color);
  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.moveTo(leftTempleX - padX, foreheadY + faceH * 0.05);
  ctx.bezierCurveTo(leftTempleX - padX, headTopY + faceW * 0.05, centerX - faceW * 0.55, headTopY - faceW * 0.05, centerX, headTopY - faceW * 0.06);
  ctx.bezierCurveTo(centerX + faceW * 0.55, headTopY - faceW * 0.05, rightTempleX + padX, headTopY + faceW * 0.05, rightTempleX + padX, foreheadY + faceH * 0.05);
  ctx.lineTo(rightTempleX, foreheadY + faceH * 0.12);
  ctx.lineTo(leftTempleX, foreheadY + faceH * 0.12);
  ctx.closePath();
  ctx.fill();

  // Strands
  addStrands(ctx, f, color, 28, headTopY, bobBottom, rightTempleX - leftTempleX + padX * 2, faceW * 0.05);

  // Bottom straight edge with slight inward curve
  ctx.strokeStyle = darken(color, 0.2);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(leftTempleX - padX + faceW * 0.08, bobBottom);
  ctx.quadraticCurveTo(centerX, bobBottom + faceH * 0.02, rightTempleX + padX - faceW * 0.08, bobBottom);
  ctx.stroke();
}

function drawWaves(ctx: CanvasRenderingContext2D, f: FaceData, color: string): void {
  const { centerX, headTopY, faceW, faceH, faceX, faceY, foreheadY, leftTempleX, rightTempleX } = f;
  const waveBottom = faceY + faceH * 1.35;
  const padX = faceW * 0.28;

  // Top cap
  const capGrad = hairGrad(ctx, centerX, headTopY, foreheadY, color);
  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.moveTo(leftTempleX - padX, foreheadY + faceH * 0.05);
  ctx.bezierCurveTo(leftTempleX - padX, headTopY, centerX - faceW * 0.6, headTopY - faceW * 0.08, centerX, headTopY - faceW * 0.1);
  ctx.bezierCurveTo(centerX + faceW * 0.6, headTopY - faceW * 0.08, rightTempleX + padX, headTopY, rightTempleX + padX, foreheadY + faceH * 0.05);
  ctx.closePath();
  ctx.fill();

  // Wavy side panels
  for (let side = -1; side <= 1; side += 2) {
    const baseX = side < 0 ? leftTempleX - padX : rightTempleX + padX;
    const innerX = side < 0 ? leftTempleX + faceW * 0.06 : rightTempleX - faceW * 0.06;
    const wGrad = ctx.createLinearGradient(baseX, foreheadY, innerX, waveBottom);
    wGrad.addColorStop(0, lighten(color, 0.18));
    wGrad.addColorStop(0.5, color);
    wGrad.addColorStop(1, darken(color, 0.28));
    ctx.fillStyle = wGrad;

    ctx.beginPath();
    ctx.moveTo(innerX, foreheadY + faceH * 0.12);
    let y = foreheadY + faceH * 0.2;
    const step = faceH * 0.22;
    const amp = faceW * 0.07;
    while (y < waveBottom) {
      const dir = side;
      ctx.bezierCurveTo(innerX + dir * amp, y, baseX, y + step * 0.4, baseX, y + step * 0.5);
      ctx.bezierCurveTo(baseX, y + step * 0.6, innerX + dir * amp, y + step * 0.85, innerX, y + step);
      y += step;
    }
    ctx.lineTo(baseX + side * faceW * 0.08, waveBottom);
    ctx.lineTo(baseX, foreheadY + faceH * 0.08);
    ctx.closePath();
    ctx.fill();
  }
}

function drawLongStraight(ctx: CanvasRenderingContext2D, f: FaceData, color: string): void {
  const { centerX, headTopY, faceW, faceH, faceY, foreheadY, leftTempleX, rightTempleX } = f;
  const longBottom = faceY + faceH * 2.0;
  const padX = faceW * 0.3;

  // Side panels
  for (let side = -1; side <= 1; side += 2) {
    const baseX = side < 0 ? leftTempleX - padX : rightTempleX + padX;
    const innerX = side < 0 ? leftTempleX + faceW * 0.04 : rightTempleX - faceW * 0.04;
    const sGrad = ctx.createLinearGradient(0, foreheadY, 0, longBottom);
    sGrad.addColorStop(0, lighten(color, 0.15));
    sGrad.addColorStop(0.6, color);
    sGrad.addColorStop(1, darken(color, 0.4));
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.moveTo(innerX, foreheadY + faceH * 0.12);
    ctx.bezierCurveTo(innerX - side * faceW * 0.04, faceY + faceH * 0.8, baseX + side * faceW * 0.04, faceY + faceH * 1.2, baseX, longBottom);
    ctx.lineTo(baseX - side * faceW * 0.12, longBottom);
    ctx.bezierCurveTo(baseX - side * faceW * 0.12, faceY + faceH * 1.1, innerX + side * faceW * 0.08, faceY + faceH * 0.6, innerX + side * faceW * 0.06, foreheadY + faceH * 0.12);
    ctx.closePath();
    ctx.fill();
  }

  // Top cap
  const capGrad = hairGrad(ctx, centerX, headTopY, foreheadY, color);
  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.moveTo(leftTempleX - padX, foreheadY + faceH * 0.05);
  ctx.bezierCurveTo(leftTempleX - padX, headTopY, centerX - faceW * 0.55, headTopY - faceW * 0.1, centerX, headTopY - faceW * 0.1);
  ctx.bezierCurveTo(centerX + faceW * 0.55, headTopY - faceW * 0.1, rightTempleX + padX, headTopY, rightTempleX + padX, foreheadY + faceH * 0.05);
  ctx.closePath();
  ctx.fill();

  // Straight strands
  addStrands(ctx, f, color, 40, headTopY, longBottom, rightTempleX - leftTempleX + padX * 2, 0);

  // Highlight center part
  const hGrad = ctx.createLinearGradient(centerX - 4, headTopY, centerX + 4, headTopY);
  hGrad.addColorStop(0, 'rgba(255,255,255,0)');
  hGrad.addColorStop(0.5, 'rgba(255,255,255,0.25)');
  hGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hGrad;
  ctx.fillRect(centerX - 4, headTopY, 8, foreheadY - headTopY);
}

function drawCurly(ctx: CanvasRenderingContext2D, f: FaceData, color: string): void {
  const { centerX, headTopY, faceW, faceH, faceY, foreheadY, leftTempleX, rightTempleX } = f;
  const curlyH = faceH * 1.2;
  const padX = faceW * 0.3;
  const rnds = 80;

  ctx.save();
  // Clip to curly region
  ctx.beginPath();
  ctx.ellipse(centerX, headTopY + curlyH * 0.2, faceW * 0.85, curlyH * 0.7, 0, 0, Math.PI * 2);
  ctx.clip();

  // Base fill
  const bGrad = ctx.createRadialGradient(centerX, headTopY, faceW * 0.1, centerX, headTopY + curlyH * 0.25, faceW * 0.85);
  bGrad.addColorStop(0, lighten(color, 0.25));
  bGrad.addColorStop(0.6, color);
  bGrad.addColorStop(1, darken(color, 0.35));
  ctx.fillStyle = bGrad;
  ctx.fillRect(centerX - faceW * 0.9, headTopY - faceW * 0.2, faceW * 1.8, curlyH + faceW * 0.2);

  // Random curls
  for (let i = 0; i < rnds; i++) {
    const cx2 = centerX + (Math.random() - 0.5) * faceW * 1.5;
    const cy2 = headTopY + Math.random() * curlyH * 0.85;
    const r = faceW * (0.04 + Math.random() * 0.07);
    const bright = Math.random() > 0.5;
    ctx.strokeStyle = bright ? lighten(color, 0.3) : darken(color, 0.2);
    ctx.lineWidth = 1.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(cx2, cy2, r, 0, Math.PI * 1.7);
    ctx.stroke();
  }
  ctx.restore();

  // Top fringe highlight
  const fGrad = ctx.createRadialGradient(centerX, headTopY, 0, centerX, headTopY, faceW * 0.55);
  fGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
  fGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fGrad;
  ctx.beginPath();
  ctx.ellipse(centerX, headTopY + faceW * 0.15, faceW * 0.55, faceW * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAfro(ctx: CanvasRenderingContext2D, f: FaceData, color: string): void {
  const { centerX, headTopY, faceW, faceH, foreheadY } = f;
  const rX = faceW * 0.75;
  const rY = faceW * 0.72;
  const cY = headTopY + faceW * 0.08;

  // Base sphere
  const bGrad = ctx.createRadialGradient(centerX - faceW * 0.2, cY - faceW * 0.2, faceW * 0.05, centerX, cY, rX);
  bGrad.addColorStop(0, lighten(color, 0.45));
  bGrad.addColorStop(0.4, lighten(color, 0.1));
  bGrad.addColorStop(0.8, color);
  bGrad.addColorStop(1, darken(color, 0.45));
  ctx.fillStyle = bGrad;
  ctx.beginPath();
  ctx.ellipse(centerX, cY, rX, rY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fluffy outer edge bumps
  const bumps = 28;
  for (let i = 0; i < bumps; i++) {
    const angle = (i / bumps) * Math.PI * 2;
    const bx = centerX + Math.cos(angle) * (rX * 0.92);
    const by = cY + Math.sin(angle) * (rY * 0.92);
    if (by > foreheadY + faceH * 0.08) continue; // don't go below forehead
    const bumpR = faceW * (0.06 + Math.random() * 0.07);
    ctx.fillStyle = lighten(color, 0.12 + Math.random() * 0.18);
    ctx.beginPath();
    ctx.arc(bx, by, bumpR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Texture dots
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(centerX, cY, rX * 0.95, rY * 0.95, 0, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 180; i++) {
    const tx = centerX + (Math.random() - 0.5) * rX * 1.8;
    const ty = cY + (Math.random() - 0.5) * rY * 1.8;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(tx, ty, faceW * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPonytail(ctx: CanvasRenderingContext2D, f: FaceData, color: string): void {
  const { centerX, headTopY, faceW, faceH, faceY, foreheadY, leftTempleX, rightTempleX } = f;

  // Flat top cap
  const capGrad = hairGrad(ctx, centerX, headTopY, foreheadY, color);
  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.moveTo(leftTempleX - faceW * 0.06, foreheadY + faceH * 0.04);
  ctx.bezierCurveTo(leftTempleX - faceW * 0.06, headTopY, centerX - faceW * 0.5, headTopY - faceW * 0.06, centerX, headTopY - faceW * 0.08);
  ctx.bezierCurveTo(centerX + faceW * 0.5, headTopY - faceW * 0.06, rightTempleX + faceW * 0.06, headTopY, rightTempleX + faceW * 0.06, foreheadY + faceH * 0.04);
  ctx.lineTo(rightTempleX, foreheadY + faceH * 0.1);
  ctx.lineTo(leftTempleX, foreheadY + faceH * 0.1);
  ctx.closePath();
  ctx.fill();

  // Hair tie position
  const tieX = centerX;
  const tieY = headTopY - faceW * 0.01;

  // Ponytail bundle going down the back
  const tailLength = faceH * 1.4;
  const tailW = faceW * 0.22;
  const pGrad = ctx.createLinearGradient(tieX, tieY, tieX + faceW * 0.15, tieY + tailLength);
  pGrad.addColorStop(0, color);
  pGrad.addColorStop(0.4, lighten(color, 0.08));
  pGrad.addColorStop(1, darken(color, 0.45));
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.moveTo(tieX - tailW / 2, tieY);
  ctx.bezierCurveTo(tieX - tailW / 2 - faceW * 0.05, tieY + tailLength * 0.4, tieX + faceW * 0.1, tieY + tailLength * 0.7, tieX + faceW * 0.05, tieY + tailLength);
  ctx.lineTo(tieX + tailW / 2 + faceW * 0.05, tieY + tailLength);
  ctx.bezierCurveTo(tieX + tailW / 2 + faceW * 0.1, tieY + tailLength * 0.7, tieX + tailW / 2 + faceW * 0.05, tieY + tailLength * 0.4, tieX + tailW / 2, tieY);
  ctx.closePath();
  ctx.fill();

  // Strands in ponytail
  addStrands(ctx, f, color, 20, tieY, tieY + tailLength, tailW, faceW * 0.08);

  // Hair tie band
  ctx.fillStyle = darken(color, 0.5);
  ctx.fillRect(tieX - tailW / 2 - 2, tieY - 5, tailW + 4, 12);
  ctx.fillStyle = lighten(color, 0.3);
  ctx.fillRect(tieX - tailW / 2 + 2, tieY - 4, tailW - 4, 3);
}

// ─── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-hairstyle-tryon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hairstyle-container">
      @if (processing()) {
        <div class="processing-overlay">
          <div class="scanner-anim">
            <div class="scanner-bar"></div>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="#c9a96e" stroke-width="2" stroke-dasharray="6 4" opacity="0.6"/>
              <circle cx="40" cy="40" r="20" stroke="#c9a96e" stroke-width="1.5" opacity="0.4"/>
              <path d="M28 30 Q40 22 52 30 Q40 18 28 30Z" fill="#c9a96e" opacity="0.7"/>
            </svg>
            <p class="scan-text">{{ statusMsg() }}</p>
          </div>
        </div>
      }

      <div class="layout">
        <!-- Canvas Panel -->
        <div class="canvas-panel">
          <div class="canvas-wrapper" (click)="!imageLoaded() && fileInputRef.nativeElement.click()">
            @if (!imageLoaded()) {
              <div class="upload-placeholder">
                <div class="upload-icon-ring">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#c9a96e" stroke-width="1.5"/>
                    <polyline points="17 8 12 3 7 8" stroke="#c9a96e" stroke-width="1.5"/>
                    <line x1="12" y1="3" x2="12" y2="15" stroke="#c9a96e" stroke-width="1.5"/>
                  </svg>
                </div>
                <p class="upload-title">Sube tu foto de frente</p>
                <p class="upload-hint">La IA detectará tu rostro y aplicará el nuevo peinado</p>
                <span class="upload-sub">JPG, PNG hasta 10MB</span>
              </div>
            }
            <canvas #photoCanvas [style.display]="imageLoaded() ? 'block' : 'none'"></canvas>
          </div>

          @if (faceDetected() && imageLoaded()) {
            <div class="face-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"/></svg>
              Rostro detectado — identidad facial preservada
            </div>
          }
          @if (imageLoaded() && !faceDetected()) {
            <div class="face-badge warn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#facc15" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="#facc15" stroke-width="1.5"/></svg>
              No se detectó rostro — el efecto puede no ser preciso
            </div>
          }

          <div class="canvas-actions">
            <button class="btn-secondary" (click)="fileInputRef.nativeElement.click()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="1.5"/></svg>
              Subir foto
            </button>
            @if (imageLoaded()) {
              <button class="btn-primary" (click)="download()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="1.5"/></svg>
                Descargar resultado
              </button>
            }
          </div>
          <input #fileInput type="file" accept="image/*" style="display:none" (change)="loadFile($event)">
        </div>

        <!-- Controls -->
        <div class="controls-panel">
          <div class="section">
            <h3 class="section-title">Tipo de corte</h3>
            <div class="cat-tabs">
              @for (cat of categories; track cat.value) {
                <button class="cat-tab" [class.active]="activeCategory() === cat.value" (click)="activeCategory.set(cat.value)">
                  {{ cat.label }}
                </button>
              }
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Estilo</h3>
            <div class="styles-list">
              @for (style of filteredStyles(); track style.id) {
                <button class="style-row" [class.selected]="selectedStyle()?.id === style.id" (click)="applyStyle(style)">
                  <span class="style-icon">{{ style.icon }}</span>
                  <div class="style-info">
                    <span class="style-name">{{ style.name }}</span>
                    <span class="style-desc">{{ style.description }}</span>
                  </div>
                  @if (selectedStyle()?.id === style.id) {
                    <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#c9a96e" stroke-width="2"/></svg>
                  }
                </button>
              }
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Color del cabello</h3>
            <div class="color-grid">
              @for (c of colors; track c.value) {
                <button class="color-swatch" [style.background]="c.value" [class.selected]="selectedColor() === c.value" [title]="c.label" (click)="changeColor(c.value)">
                  @if (selectedColor() === c.value) {
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5"/></svg>
                  }
                </button>
              }
            </div>
            <p class="color-label">{{ selectedColorLabel() }}</p>
          </div>

          <div class="tip-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#c9a96e" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="#c9a96e" stroke-width="1.5"/></svg>
            <p>Los ojos, nariz, boca y estructura facial se mantienen intactos. Solo se modifica el cabello.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hairstyle-container { position: relative; padding: 0 24px 40px; }
    .processing-overlay {
      position: fixed; inset: 0;
      background: rgba(8,8,16,0.88); z-index: 200;
      display: flex; align-items: center; justify-content: center;
    }
    .scanner-anim { display: flex; flex-direction: column; align-items: center; gap: 16px; position: relative; }
    .scanner-bar {
      position: absolute; top: 0; left: -10px; right: -10px; height: 2px;
      background: linear-gradient(90deg, transparent, #c9a96e, transparent);
      animation: scan 1.8s ease-in-out infinite;
    }
    @keyframes scan { 0%,100% { top:0; opacity:1; } 50% { top:80px; opacity:0.6; } }
    .scan-text { color: #c9a96e; font-size: 14px; margin: 0; }

    .layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; max-width: 1100px; margin: 0 auto; }
    .canvas-panel { display: flex; flex-direction: column; gap: 10px; }
    .canvas-wrapper {
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px; overflow: hidden; min-height: 420px;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
    }
    .canvas-wrapper:has(canvas[style*="block"]) { cursor: default; }
    canvas { max-width: 100%; display: block; }
    .upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 40px; }
    .upload-icon-ring {
      width: 72px; height: 72px; border-radius: 50%;
      border: 1.5px solid rgba(201,169,110,0.3);
      display: flex; align-items: center; justify-content: center;
      background: rgba(201,169,110,0.06);
    }
    .upload-title { margin: 0; font-size: 16px; color: #f0eff4; font-weight: 500; }
    .upload-hint { margin: 0; font-size: 13px; color: #9997b0; text-align: center; max-width: 260px; }
    .upload-sub { font-size: 11px; color: #5a5870; }
    .face-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 8px;
      background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2);
      font-size: 12px; color: #4ade80;
    }
    .face-badge.warn { background: rgba(250,204,21,0.08); border-color: rgba(250,204,21,0.2); color: #facc15; }
    .canvas-actions { display: flex; gap: 10px; }
    .btn-secondary {
      display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
      color: #9997b0; font-size: 13px; cursor: pointer; transition: all 0.2s;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.08); color: #f0eff4; }
    .btn-primary {
      display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px;
      border: none; background: linear-gradient(135deg, #c9a96e, #a07840);
      color: #080810; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .controls-panel { display: flex; flex-direction: column; gap: 20px; }
    .section { display: flex; flex-direction: column; gap: 10px; }
    .section-title { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #5a5870; margin: 0; }
    .cat-tabs { display: flex; flex-wrap: wrap; gap: 5px; }
    .cat-tab {
      padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);
      background: transparent; color: #9997b0; font-size: 12px; cursor: pointer; transition: all 0.2s;
    }
    .cat-tab:hover { border-color: rgba(201,169,110,0.3); color: #c9a96e; }
    .cat-tab.active { background: rgba(201,169,110,0.12); border-color: rgba(201,169,110,0.4); color: #c9a96e; }
    .styles-list { display: flex; flex-direction: column; gap: 4px; }
    .style-row {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02);
      cursor: pointer; transition: all 0.2s; text-align: left;
    }
    .style-row:hover { border-color: rgba(201,169,110,0.25); background: rgba(201,169,110,0.04); }
    .style-row.selected { border-color: rgba(201,169,110,0.5); background: rgba(201,169,110,0.07); }
    .style-icon { font-size: 20px; flex-shrink: 0; }
    .style-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .style-name { font-size: 13px; color: #f0eff4; font-weight: 500; }
    .style-row.selected .style-name { color: #c9a96e; }
    .style-desc { font-size: 11px; color: #5a5870; }
    .check-icon { flex-shrink: 0; }
    .color-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .color-swatch {
      width: 32px; height: 32px; border-radius: 8px; border: 2px solid transparent;
      cursor: pointer; transition: all 0.2s; padding: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .color-swatch:hover { transform: scale(1.1); }
    .color-swatch.selected { border-color: #c9a96e; box-shadow: 0 0 0 2px rgba(201,169,110,0.3); }
    .color-label { font-size: 11px; color: #5a5870; margin: 2px 0 0; }
    .tip-box {
      display: flex; align-items: flex-start; gap: 8px; padding: 12px;
      border-radius: 10px; background: rgba(201,169,110,0.05); border: 1px solid rgba(201,169,110,0.15);
    }
    .tip-box p { margin: 0; font-size: 12px; color: #9997b0; line-height: 1.5; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
  `],
})
export class HairstyleTryonComponent {
  @ViewChild('photoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);

  imageLoaded  = signal(false);
  processing   = signal(false);
  faceDetected = signal(false);
  statusMsg    = signal('Cargando modelos IA...');
  selectedStyle = signal<HairstyleOption | null>(null);
  selectedColor = signal('#3d2b1f');
  activeCategory = signal<string>('all');

  private modelsLoaded = false;
  private originalImage: HTMLImageElement | null = null;
  private faceData: FaceData | null = null;

  readonly categories = [
    { label: 'Todos',  value: 'all'    },
    { label: 'Corto',  value: 'corto'  },
    { label: 'Medio',  value: 'medio'  },
    { label: 'Largo',  value: 'largo'  },
    { label: 'Rizado', value: 'rizado' },
    { label: 'Fade',   value: 'fade'   },
  ];

  readonly colors = [
    { label: 'Negro',        value: '#0a0604' },
    { label: 'Castaño oscuro', value: '#3d2b1f' },
    { label: 'Castaño',      value: '#6b3d1e' },
    { label: 'Rubio oscuro', value: '#8b6532' },
    { label: 'Rubio dorado', value: '#c8a04a' },
    { label: 'Rubio platino', value: '#e8d8a8' },
    { label: 'Rojo intenso', value: '#8b2500' },
    { label: 'Rojo cobre',   value: '#b04020' },
    { label: 'Gris plata',   value: '#8a8a9a' },
    { label: 'Blanco',       value: '#ddd8cc' },
    { label: 'Azul oscuro',  value: '#1a2050' },
    { label: 'Verde oscuro', value: '#1a3020' },
  ];

  selectedColorLabel = computed(() =>
    this.colors.find(c => c.value === this.selectedColor())?.label ?? ''
  );

  filteredStyles(): HairstyleOption[] {
    const cat = this.activeCategory();
    if (cat === 'all') return HAIRSTYLES;
    return HAIRSTYLES.filter(s => s.category === cat);
  }

  async loadFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.processing.set(true);
    this.statusMsg.set('Cargando modelos IA...');
    this.cdr.markForCheck();

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        this.originalImage = img;
        this.statusMsg.set('Detectando rostro...');
        this.cdr.markForCheck();
        await this.detectFace(img);
        this.drawBase();
        this.imageLoaded.set(true);
        this.processing.set(false);
        this.cdr.markForCheck();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    // reset input so same file can be reloaded
    (event.target as HTMLInputElement).value = '';
  }

  private async detectFace(img: HTMLImageElement): Promise<void> {
    if (!this.modelsLoaded) {
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      this.modelsLoaded = true;
    }

    const det = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
      .withFaceLandmarks();

    if (!det) {
      this.faceData = null;
      this.faceDetected.set(false);
      return;
    }

    this.faceDetected.set(true);
    const canvas = this.canvasRef.nativeElement;
    const scaleX = canvas.width / img.naturalWidth;
    const scaleY = canvas.height / img.naturalHeight;

    const box = det.detection.box;
    const faceX = box.x * scaleX;
    const faceY = box.y * scaleY;
    const faceW = box.width * scaleX;
    const faceH = box.height * scaleY;

    const lms = parseLandmarks(det.landmarks.positions, scaleX, scaleY);

    // forehead = average of eyebrow top points, projected up
    const leftBrowTop  = lms[19]; // top of left brow
    const rightBrowTop = lms[24];
    const foreheadY = Math.min(leftBrowTop.y, rightBrowTop.y) - faceH * 0.04;
    const headTopY  = foreheadY - faceH * 0.38;
    const leftTempleX  = lms[0].x;
    const rightTempleX = lms[16].x;
    const centerX = (leftTempleX + rightTempleX) / 2;

    this.faceData = { scaleX, scaleY, faceX, faceY, faceW, faceH, landmarks: lms,
      foreheadY, headTopY, leftTempleX, rightTempleX, centerX };
  }

  private drawBase(): void {
    if (!this.originalImage || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    const maxW = Math.min(container.clientWidth || 700, 700);
    const scale = Math.min(1, maxW / this.originalImage.naturalWidth);
    canvas.width  = this.originalImage.naturalWidth  * scale;
    canvas.height = this.originalImage.naturalHeight * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);
  }

  applyStyle(style: HairstyleOption): void {
    this.selectedStyle.set(style);
    this.redraw();
  }

  changeColor(color: string): void {
    this.selectedColor.set(color);
    if (this.selectedStyle()) this.redraw();
  }

  private redraw(): void {
    if (!this.originalImage || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    // Redraw original image cleanly
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);

    const style = this.selectedStyle();
    if (!style) return;

    // Build face data if not available (no face detected — use image center estimate)
    let face = this.faceData;
    if (!face) {
      const cx = canvas.width / 2;
      const fw = canvas.width * 0.45;
      const fh = canvas.height * 0.55;
      const fy = canvas.height * 0.12;
      face = {
        scaleX: 1, scaleY: 1, faceX: cx - fw / 2, faceY: fy, faceW: fw, faceH: fh, landmarks: [],
        foreheadY: fy + fh * 0.12, headTopY: fy - fh * 0.28,
        leftTempleX: cx - fw * 0.48, rightTempleX: cx + fw * 0.48, centerX: cx,
      };
    }

    ctx.globalAlpha = 0.93;
    drawHair(ctx, face, style.id, this.selectedColor());
    ctx.globalAlpha = 1;
  }

  download(): void {
    const canvas = this.canvasRef.nativeElement;
    const link = document.createElement('a');
    link.download = 'barber-ai-hairstyle.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
