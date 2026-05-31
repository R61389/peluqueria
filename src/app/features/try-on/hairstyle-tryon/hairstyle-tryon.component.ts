import {
  Component,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as faceapi from 'face-api.js';

// ─── Types ──────────────────────────────────────────────────────────────────

type Gender = 'hombre' | 'mujer' | 'unisex';
type Category = 'todos' | 'corto' | 'medio' | 'largo' | 'especial';

interface HairstyleOption {
  id: string;
  name: string;
  gender: Gender[];
  category: Category;
  tags: string[];
  draw: (ctx: CanvasRenderingContext2D, f: FaceMetrics, color: string) => void;
}

interface FaceMetrics {
  cx: number;       // face center X
  foreheadY: number;// top of forehead (where hair begins on face)
  headTopY: number; // estimated top of skull
  leftX: number;    // left temple
  rightX: number;   // right temple
  chinY: number;    // bottom of face
  faceW: number;    // face width
  faceH: number;    // face height
}

interface ColorOption { label: string; value: string; }

// ─── Color utilities ─────────────────────────────────────────────────────────

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
function lt(hex: string, a: number): string {
  const [r, g, b] = hexRgb(hex);
  return `rgb(${Math.min(255, r + (255 - r) * a | 0)},${Math.min(255, g + (255 - g) * a | 0)},${Math.min(255, b + (255 - b) * a | 0)})`;
}
function dk(hex: string, a: number): string {
  const [r, g, b] = hexRgb(hex);
  return `rgb(${r * (1 - a) | 0},${g * (1 - a) | 0},${b * (1 - a) | 0})`;
}
function vGrad(ctx: CanvasRenderingContext2D, x: number, y1: number, y2: number, col: string): CanvasGradient {
  const g = ctx.createLinearGradient(x, y1, x, y2);
  g.addColorStop(0, lt(col, 0.28)); g.addColorStop(0.4, col);
  g.addColorStop(0.75, col); g.addColorStop(1, dk(col, 0.35));
  return g;
}

// ─── Hairstyle drawing functions ─────────────────────────────────────────────

function cap(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string, pad = 0.12): void {
  const { cx, headTopY: ht, foreheadY: fy, leftX, rightX, faceW: fw, faceH: fh } = f;
  ctx.fillStyle = vGrad(ctx, cx, ht, fy, col);
  ctx.beginPath();
  ctx.moveTo(leftX - fw * pad, fy + fh * 0.02);
  ctx.bezierCurveTo(leftX - fw * pad, ht + fw * 0.1, cx - fw * 0.55, ht - fw * 0.05, cx, ht - fw * 0.06);
  ctx.bezierCurveTo(cx + fw * 0.55, ht - fw * 0.05, rightX + fw * pad, ht + fw * 0.1, rightX + fw * pad, fy + fh * 0.02);
  ctx.closePath(); ctx.fill();
}

function strands(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string,
    n: number, fromY: number, toY: number, spreadW: number, curve = 0): void {
  ctx.lineWidth = 1.1;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = f.cx - spreadW / 2 + spreadW * t;
    const jt = (Math.random() - 0.5) * f.faceW * 0.03;
    ctx.strokeStyle = t < 0.5 ? lt(col, 0.12) : dk(col, 0.08);
    ctx.beginPath();
    ctx.moveTo(x + jt, fromY);
    ctx.bezierCurveTo(
      x + jt + curve * (t - 0.5) * 2, fromY + (toY - fromY) * 0.38,
      x + jt + curve * (t - 0.5) * 1.4, fromY + (toY - fromY) * 0.72,
      x + jt + curve * (t - 0.5), toY);
    ctx.stroke();
  }
}

// ─── Individual style draw functions ─────────────────────────────────────────

function drawBuzzCut(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  cap(ctx, f, col, 0.04);
  // Stubble fade on sides
  for (let i = 0; i < 3; i++) {
    const [r, g, b] = hexRgb(col);
    ctx.fillStyle = `rgba(${r},${g},${b},${0.18 - i * 0.04})`;
    const yy = f.foreheadY + f.faceH * (0.12 + i * 0.08);
    ctx.fillRect(f.leftX - f.faceW * 0.1, yy, f.faceW * 0.1, f.faceH * 0.07);
    ctx.fillRect(f.rightX, yy, f.faceW * 0.1, f.faceH * 0.07);
  }
}

function drawFadeUndercut(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, leftX: lx, rightX: rx, faceW: fw, faceH: fh } = f;
  const topW = fw * 0.62;
  // Top volume
  const gRad = ctx.createRadialGradient(cx - fw * 0.15, ht, fw * 0.04, cx, ht + fw * 0.06, fw * 0.55);
  gRad.addColorStop(0, lt(col, 0.38)); gRad.addColorStop(0.5, col); gRad.addColorStop(1, dk(col, 0.28));
  ctx.fillStyle = gRad;
  ctx.beginPath();
  ctx.ellipse(cx, ht + fw * 0.04, topW / 2, fw * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  // Swept top
  ctx.fillStyle = dk(col, 0.1);
  ctx.beginPath();
  ctx.moveTo(cx - topW / 2, fy + fh * 0.02);
  ctx.bezierCurveTo(cx - topW * 0.55, ht, cx + topW * 0.05, ht - fw * 0.22, cx + topW / 2, fy - fh * 0.04);
  ctx.bezierCurveTo(cx + topW * 0.28, fy + fh * 0.06, cx, fy + fh * 0.08, cx - topW / 2, fy + fh * 0.02);
  ctx.fill();
  // Fade bands
  for (let i = 0; i < 4; i++) {
    const [r, g, b] = hexRgb(col);
    const yy = fy + fh * (0.2 + i * 0.06);
    ctx.fillStyle = `rgba(${r},${g},${b},${0.22 - i * 0.05})`;
    ctx.fillRect(lx - fw * 0.14, yy, fw * 0.14, fh * 0.055);
    ctx.fillRect(rx, yy, fw * 0.14, fh * 0.055);
  }
  strands(ctx, f, col, 28, ht - fw * 0.02, fy, topW, -fw * 0.22);
}

function drawPompadour(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, leftX: lx, rightX: rx, faceW: fw, faceH: fh } = f;
  cap(ctx, f, col, 0.08);
  // Pompadour volume — swept forward
  const pGrad = ctx.createLinearGradient(cx, ht - fw * 0.3, cx, fy);
  pGrad.addColorStop(0, lt(col, 0.35)); pGrad.addColorStop(1, dk(col, 0.12));
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.moveTo(lx - fw * 0.06, fy + fh * 0.02);
  ctx.bezierCurveTo(lx - fw * 0.08, ht, cx - fw * 0.35, ht - fw * 0.32, cx, ht - fw * 0.35);
  ctx.bezierCurveTo(cx + fw * 0.35, ht - fw * 0.32, rx + fw * 0.08, ht, rx + fw * 0.06, fy + fh * 0.02);
  ctx.bezierCurveTo(rx - fw * 0.1, fy - fh * 0.06, lx + fw * 0.1, fy - fh * 0.06, lx - fw * 0.06, fy + fh * 0.02);
  ctx.fill();
  strands(ctx, f, col, 22, ht - fw * 0.32, fy, fw * 1.05, fw * 0.18);
}

function drawTexturedCrop(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx } = f;
  cap(ctx, f, col, 0.1);
  // Textured fringe
  const fringeW = fw * 0.85;
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const x = cx - fringeW / 2 + fringeW * t;
    const tipLen = fh * (0.08 + Math.sin(t * Math.PI * 3) * 0.04);
    ctx.fillStyle = i % 2 === 0 ? col : dk(col, 0.15);
    ctx.beginPath();
    ctx.moveTo(x - fw * 0.035, fy + fh * 0.01);
    ctx.bezierCurveTo(x - fw * 0.02, fy - tipLen * 0.3, x + fw * 0.02, fy - tipLen * 0.3, x + fw * 0.035, fy + fh * 0.01);
    ctx.lineTo(x + fw * 0.02, fy + tipLen);
    ctx.quadraticCurveTo(x, fy + tipLen * 1.1, x - fw * 0.02, fy + tipLen);
    ctx.closePath(); ctx.fill();
  }
  // Side fade
  for (let i = 0; i < 3; i++) {
    const [r, g, b] = hexRgb(col);
    ctx.fillStyle = `rgba(${r},${g},${b},${0.2 - i * 0.05})`;
    ctx.fillRect(lx - fw * 0.12, fy + fh * (0.18 + i * 0.07), fw * 0.12, fh * 0.055);
    ctx.fillRect(rx, fy + fh * (0.18 + i * 0.07), fw * 0.12, fh * 0.055);
  }
}

function drawQuiff(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, leftX: lx, rightX: rx, faceW: fw, faceH: fh } = f;
  cap(ctx, f, col, 0.08);
  // Quiff: raised section at front center
  const qGrad = vGrad(ctx, cx, ht - fw * 0.25, fy, col);
  ctx.fillStyle = qGrad;
  ctx.beginPath();
  ctx.moveTo(cx - fw * 0.28, fy + fh * 0.02);
  ctx.bezierCurveTo(cx - fw * 0.3, ht - fw * 0.18, cx - fw * 0.15, ht - fw * 0.3, cx, ht - fw * 0.28);
  ctx.bezierCurveTo(cx + fw * 0.15, ht - fw * 0.3, cx + fw * 0.3, ht - fw * 0.18, cx + fw * 0.28, fy + fh * 0.02);
  ctx.closePath(); ctx.fill();
  // Highlight on quiff peak
  const hg = ctx.createRadialGradient(cx, ht - fw * 0.22, 0, cx, ht - fw * 0.2, fw * 0.22);
  hg.addColorStop(0, 'rgba(255,255,255,0.22)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hg; ctx.fill();
}

function drawCaesarCut(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, foreheadY: fy, faceW: fw, faceH: fh } = f;
  cap(ctx, f, col, 0.08);
  // Horizontal fringe across forehead
  ctx.fillStyle = dk(col, 0.08);
  ctx.beginPath();
  ctx.moveTo(cx - fw * 0.52, fy + fh * 0.01);
  ctx.bezierCurveTo(cx - fw * 0.52, fy + fh * 0.12, cx + fw * 0.52, fy + fh * 0.12, cx + fw * 0.52, fy + fh * 0.01);
  ctx.closePath(); ctx.fill();
  strands(ctx, f, col, 16, fy - fh * 0.05, fy + fh * 0.1, fw * 1.0, 0);
}

function drawDreadlocks(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx } = f;
  const dreadLen = fh * 0.55;
  const count = 14;
  cap(ctx, f, col, 0.1);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = lx - fw * 0.08 + (rx - lx + fw * 0.16) * t;
    const dW = fw * 0.048;
    const len = dreadLen * (0.7 + Math.sin(t * Math.PI) * 0.45);
    const sY = fy + fh * 0.04;
    const eY = sY + len;
    const g = ctx.createLinearGradient(x, sY, x, eY);
    g.addColorStop(0, lt(col, 0.15)); g.addColorStop(0.5, col); g.addColorStop(1, dk(col, 0.42));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - dW / 2, sY);
    // zigzag dread shape
    for (let j = 0; j < 5; j++) {
      const yy = sY + (eY - sY) * (j + 1) / 5;
      const xOff = (j % 2 === 0 ? 1 : -1) * dW * 0.35;
      ctx.lineTo(x + xOff + dW / 2, yy);
      ctx.lineTo(x + xOff - dW / 2, yy);
    }
    ctx.lineTo(x - dW / 2, sY);
    ctx.fill();
    // Band rings
    for (let j = 1; j < 5; j++) {
      const yy = sY + (eY - sY) * j / 5;
      ctx.fillStyle = dk(col, 0.5);
      ctx.fillRect(x - dW / 2, yy - 1.5, dW, 3);
    }
  }
}

function drawPixie(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  cap(ctx, f, col, 0.06);
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh } = f;
  // Short wispy side strands
  strands(ctx, f, col, 16, ht + fw * 0.05, fy + fh * 0.06, fw * 1.12, fw * 0.06);
  // Side-swept fringe
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    ctx.strokeStyle = t > 0.4 ? dk(col, 0.12) : lt(col, 0.1);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - fw * 0.28 + fw * 0.52 * t, fy - fh * 0.02);
    ctx.quadraticCurveTo(cx - fw * 0.15 + fw * 0.3 * t, fy + fh * 0.06, cx + fw * 0.35 - fw * 0.4 * t, fy + fh * 0.04);
    ctx.stroke();
  }
}

function drawBob(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx, chinY: cy } = f;
  const bobBot = cy - fh * 0.1;
  const padX = fw * 0.22;
  cap(ctx, f, col, 0.28);
  // Side curtains
  for (let side = -1; side <= 1; side += 2) {
    const bx = side < 0 ? lx - padX : rx + padX;
    const ix = side < 0 ? lx + fw * 0.05 : rx - fw * 0.05;
    const sg = ctx.createLinearGradient(bx, fy, ix, bobBot);
    sg.addColorStop(0, lt(col, 0.18)); sg.addColorStop(0.6, col); sg.addColorStop(1, dk(col, 0.32));
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(ix, fy + fh * 0.1);
    ctx.bezierCurveTo(ix + side * fw * 0.02, cy - fh * 0.5, bx, cy - fh * 0.3, bx, bobBot);
    ctx.lineTo(bx - side * fw * 0.1, bobBot);
    ctx.bezierCurveTo(bx - side * fw * 0.1, cy - fh * 0.25, ix + side * fw * 0.06, cy - fh * 0.55, ix + side * fw * 0.04, fy + fh * 0.1);
    ctx.closePath(); ctx.fill();
  }
  // Bottom edge line
  ctx.strokeStyle = dk(col, 0.25); ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lx - padX + fw * 0.06, bobBot);
  ctx.quadraticCurveTo(cx, bobBot + fh * 0.02, rx + padX - fw * 0.06, bobBot);
  ctx.stroke();
  strands(ctx, f, col, 26, ht, bobBot, rx - lx + padX * 2, fw * 0.04);
}

function drawLob(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx, chinY: cy } = f;
  const lobBot = cy + fh * 0.22;
  const padX = fw * 0.25;
  cap(ctx, f, col, 0.28);
  for (let side = -1; side <= 1; side += 2) {
    const bx = side < 0 ? lx - padX : rx + padX;
    const ix = side < 0 ? lx + fw * 0.04 : rx - fw * 0.04;
    const sg = vGrad(ctx, cx, fy, lobBot, col);
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(ix, fy + fh * 0.1);
    ctx.bezierCurveTo(ix - side * fw * 0.03, cy - fh * 0.3, bx + side * fw * 0.03, cy, bx, lobBot);
    ctx.lineTo(bx - side * fw * 0.12, lobBot);
    ctx.bezierCurveTo(bx - side * fw * 0.1, cy - fh * 0.05, ix + side * fw * 0.06, cy - fh * 0.4, ix + side * fw * 0.04, fy + fh * 0.1);
    ctx.closePath(); ctx.fill();
  }
  strands(ctx, f, col, 30, ht, lobBot, rx - lx + padX * 2, fw * 0.03);
}

function drawWavyMedium(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx, chinY: cy } = f;
  const wBot = cy + fh * 0.35;
  const padX = fw * 0.28;
  cap(ctx, f, col, 0.3);
  for (let side = -1; side <= 1; side += 2) {
    const bx = side < 0 ? lx - padX : rx + padX;
    const ix = side < 0 ? lx + fw * 0.05 : rx - fw * 0.05;
    ctx.fillStyle = vGrad(ctx, cx, fy, wBot, col);
    ctx.beginPath();
    ctx.moveTo(ix, fy + fh * 0.1);
    let y = fy + fh * 0.18;
    const step = fh * 0.2;
    const amp = fw * 0.06;
    while (y < wBot) {
      ctx.bezierCurveTo(ix + side * amp, y, bx, y + step * 0.4, bx, y + step * 0.5);
      ctx.bezierCurveTo(bx, y + step * 0.6, ix + side * amp, y + step * 0.85, ix, y + step);
      y += step;
    }
    ctx.lineTo(bx + side * fw * 0.06, wBot);
    ctx.lineTo(bx, fy + fh * 0.06);
    ctx.closePath(); ctx.fill();
  }
}

function drawLongStraight(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx, chinY: cy } = f;
  const longBot = cy + fh * 1.2;
  const padX = fw * 0.3;
  cap(ctx, f, col, 0.32);
  for (let side = -1; side <= 1; side += 2) {
    const bx = side < 0 ? lx - padX : rx + padX;
    const ix = side < 0 ? lx + fw * 0.04 : rx - fw * 0.04;
    const sg = vGrad(ctx, cx, fy, longBot, col);
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(ix, fy + fh * 0.1);
    ctx.bezierCurveTo(ix - side * fw * 0.04, cy, bx + side * fw * 0.04, cy + fh * 0.6, bx, longBot);
    ctx.lineTo(bx - side * fw * 0.1, longBot);
    ctx.bezierCurveTo(bx - side * fw * 0.1, cy + fh * 0.5, ix + side * fw * 0.06, cy - fh * 0.05, ix + side * fw * 0.04, fy + fh * 0.1);
    ctx.closePath(); ctx.fill();
  }
  strands(ctx, f, col, 38, ht, longBot, rx - lx + padX * 2, 0);
  // Center part highlight
  const hg = ctx.createLinearGradient(cx - 4, ht, cx + 4, ht);
  hg.addColorStop(0, 'rgba(255,255,255,0)'); hg.addColorStop(0.5, 'rgba(255,255,255,0.2)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hg; ctx.fillRect(cx - 4, ht, 8, fy - ht);
}

function drawCurlyNatural(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx, chinY: cy } = f;
  const curlBot = cy + fh * 0.3;
  const padX = fw * 0.32;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, ht + fh * 0.18, (rx - lx) / 2 + padX, fh * 0.68, 0, 0, Math.PI * 2);
  ctx.clip();
  const bGrad = ctx.createRadialGradient(cx - fw * 0.15, ht, fw * 0.08, cx, ht + fh * 0.2, (rx - lx) / 2 + padX);
  bGrad.addColorStop(0, lt(col, 0.3)); bGrad.addColorStop(0.55, col); bGrad.addColorStop(1, dk(col, 0.38));
  ctx.fillStyle = bGrad;
  ctx.fillRect(cx - fw, ht - fw * 0.1, fw * 2, curlBot - ht + fw * 0.15);
  // Curl rings
  for (let i = 0; i < 70; i++) {
    const cx2 = cx + (Math.random() - 0.5) * (rx - lx + padX * 1.6);
    const cy2 = ht + Math.random() * (curlBot - ht) * 0.9;
    const r = fw * (0.038 + Math.random() * 0.065);
    ctx.strokeStyle = Math.random() > 0.5 ? lt(col, 0.28) : dk(col, 0.22);
    ctx.lineWidth = 1.4 + Math.random() * 1.4;
    ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 1.6); ctx.stroke();
  }
  ctx.restore();
}

function drawAfro(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw } = f;
  const rX = fw * 0.78; const rY = fw * 0.74; const cY = ht + fw * 0.06;
  const bGrad = ctx.createRadialGradient(cx - fw * 0.2, cY - fw * 0.18, fw * 0.04, cx, cY, rX);
  bGrad.addColorStop(0, lt(col, 0.48)); bGrad.addColorStop(0.45, lt(col, 0.1)); bGrad.addColorStop(0.8, col); bGrad.addColorStop(1, dk(col, 0.48));
  ctx.fillStyle = bGrad;
  ctx.beginPath(); ctx.ellipse(cx, cY, rX, rY, 0, 0, Math.PI * 2); ctx.fill();
  // Edge bumps
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const bx = cx + Math.cos(angle) * rX * 0.9; const by = cY + Math.sin(angle) * rY * 0.9;
    if (by > fy + 10) continue;
    ctx.fillStyle = lt(col, 0.15 + Math.random() * 0.2);
    ctx.beginPath(); ctx.arc(bx, by, fw * (0.055 + Math.random() * 0.07), 0, Math.PI * 2); ctx.fill();
  }
  // Texture
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cY, rX * 0.93, rY * 0.93, 0, 0, Math.PI * 2); ctx.clip();
  for (let i = 0; i < 160; i++) {
    const tx = cx + (Math.random() - 0.5) * rX * 1.8; const ty = cY + (Math.random() - 0.5) * rY * 1.8;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.arc(tx, ty, fw * 0.011, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawBraids(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx, chinY: cy } = f;
  cap(ctx, f, col, 0.12);
  const count = 10;
  const braidBot = cy + fh * 1.1;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = lx - fw * 0.04 + (rx - lx + fw * 0.08) * t;
    const bW = fw * 0.046;
    const len = fh * (0.9 + Math.sin(t * Math.PI) * 0.4);
    const sY = fy + fh * 0.06; const eY = sY + len;
    const bg = ctx.createLinearGradient(x, sY, x, eY);
    bg.addColorStop(0, col); bg.addColorStop(0.5, lt(col, 0.08)); bg.addColorStop(1, dk(col, 0.45));
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(x - bW / 2, sY);
    for (let j = 0; j < 6; j++) {
      const yy = sY + (eY - sY) * (j + 1) / 6;
      const xo = (j % 2 === 0 ? 1 : -1) * bW * 0.3;
      ctx.lineTo(x + xo + bW / 2, yy); ctx.lineTo(x + xo - bW / 2, yy);
    }
    ctx.lineTo(x - bW / 2, sY); ctx.fill();
    for (let j = 1; j < 6; j++) {
      ctx.fillStyle = dk(col, 0.55);
      ctx.fillRect(x - bW / 2, sY + (eY - sY) * j / 6 - 1.5, bW, 3);
    }
  }
}

function drawPonytailHigh(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx } = f;
  cap(ctx, f, col, 0.08);
  const tieY = ht - fw * 0.02;
  const tailLen = fh * 1.5; const tailW = fw * 0.24;
  const pg = ctx.createLinearGradient(cx, tieY, cx + fw * 0.12, tieY + tailLen);
  pg.addColorStop(0, col); pg.addColorStop(0.4, lt(col, 0.06)); pg.addColorStop(1, dk(col, 0.5));
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.moveTo(cx - tailW / 2, tieY);
  ctx.bezierCurveTo(cx - tailW / 2 - fw * 0.04, tieY + tailLen * 0.38, cx + fw * 0.08, tieY + tailLen * 0.68, cx + fw * 0.04, tieY + tailLen);
  ctx.lineTo(cx + tailW / 2 + fw * 0.04, tieY + tailLen);
  ctx.bezierCurveTo(cx + tailW / 2 + fw * 0.08, tieY + tailLen * 0.68, cx + tailW / 2 + fw * 0.04, tieY + tailLen * 0.38, cx + tailW / 2, tieY);
  ctx.closePath(); ctx.fill();
  strands(ctx, f, col, 18, tieY, tieY + tailLen, tailW, fw * 0.07);
  // Tie band
  ctx.fillStyle = dk(col, 0.55);
  ctx.beginPath(); ctx.roundRect(cx - tailW / 2 - 2, tieY - 5, tailW + 4, 12, 3); ctx.fill();
}

function drawLongLayers(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx, chinY: cy } = f;
  const longBot = cy + fh * 1.3;
  const padX = fw * 0.3;
  cap(ctx, f, col, 0.3);
  // Multiple layer curtains
  for (let layer = 0; layer < 3; layer++) {
    const alpha = 0.85 - layer * 0.15;
    const layerBot = cy + fh * (0.6 + layer * 0.35);
    for (let side = -1; side <= 1; side += 2) {
      const bx = side < 0 ? lx - padX + fw * 0.04 * layer : rx + padX - fw * 0.04 * layer;
      const ix = side < 0 ? lx + fw * 0.04 : rx - fw * 0.04;
      const sg = vGrad(ctx, cx, fy, layerBot, col);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(ix, fy + fh * 0.1);
      ctx.bezierCurveTo(ix - side * fw * 0.03, cy - fh * 0.2, bx + side * fw * 0.03, cy + fh * 0.3, bx, layerBot);
      ctx.lineTo(bx - side * fw * 0.12, layerBot);
      ctx.bezierCurveTo(bx - side * fw * 0.12, cy + fh * 0.2, ix + side * fw * 0.05, cy - fh * 0.3, ix + side * fw * 0.04, fy + fh * 0.1);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  strands(ctx, f, col, 34, ht, longBot, rx - lx + padX * 2, 0);
}

function drawBun(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx } = f;
  // Flat top
  cap(ctx, f, col, 0.1);
  // Bun on top
  const bunCX = cx; const bunCY = ht - fw * 0.22;
  const bunRX = fw * 0.2; const bunRY = fw * 0.18;
  const bunGrad = ctx.createRadialGradient(bunCX - bunRX * 0.3, bunCY - bunRY * 0.3, bunRX * 0.05, bunCX, bunCY, bunRX);
  bunGrad.addColorStop(0, lt(col, 0.4)); bunGrad.addColorStop(0.5, col); bunGrad.addColorStop(1, dk(col, 0.4));
  ctx.fillStyle = bunGrad;
  ctx.beginPath(); ctx.ellipse(bunCX, bunCY, bunRX, bunRY, 0, 0, Math.PI * 2); ctx.fill();
  // Texture wrap
  ctx.strokeStyle = dk(col, 0.25); ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(bunCX, bunCY);
    ctx.arc(bunCX, bunCY, bunRX * 0.85, a, a + Math.PI * 0.28);
    ctx.stroke();
  }
  // Hair tie
  ctx.fillStyle = dk(col, 0.6);
  ctx.beginPath(); ctx.ellipse(bunCX, bunCY + bunRY - 3, bunRX * 0.35, 5, 0, 0, Math.PI * 2); ctx.fill();
}

function drawFringe(ctx: CanvasRenderingContext2D, f: FaceMetrics, col: string): void {
  const { cx, headTopY: ht, foreheadY: fy, faceW: fw, faceH: fh, leftX: lx, rightX: rx, chinY: cy } = f;
  const longBot = cy + fh * 1.0;
  const padX = fw * 0.28;
  cap(ctx, f, col, 0.28);
  for (let side = -1; side <= 1; side += 2) {
    const bx = side < 0 ? lx - padX : rx + padX;
    const ix = side < 0 ? lx + fw * 0.04 : rx - fw * 0.04;
    ctx.fillStyle = vGrad(ctx, cx, fy, longBot, col);
    ctx.beginPath();
    ctx.moveTo(ix, fy + fh * 0.1);
    ctx.bezierCurveTo(ix - side * fw * 0.02, cy - fh * 0.2, bx + side * fw * 0.02, cy + fh * 0.4, bx, longBot);
    ctx.lineTo(bx - side * fw * 0.1, longBot);
    ctx.bezierCurveTo(bx - side * fw * 0.1, cy + fh * 0.3, ix + side * fw * 0.05, cy - fh * 0.3, ix + side * fw * 0.04, fy + fh * 0.1);
    ctx.closePath(); ctx.fill();
  }
  // Blunt fringe across forehead
  ctx.fillStyle = dk(col, 0.06);
  ctx.beginPath();
  ctx.moveTo(lx - padX, fy + fh * 0.05);
  ctx.bezierCurveTo(lx - padX, fy + fh * 0.16, rx + padX, fy + fh * 0.16, rx + padX, fy + fh * 0.05);
  ctx.closePath(); ctx.fill();
  strands(ctx, f, col, 24, ht, longBot, rx - lx + padX * 2, 0);
}

// ─── Hairstyle catalog ──────────────────────────────────────────────────────

const HAIRSTYLES: HairstyleOption[] = [
  // Hombre
  { id: 'buzz',       name: 'Buzz Cut',         gender: ['hombre'],          category: 'corto',   tags: ['rapado','clásico'],    draw: drawBuzzCut },
  { id: 'fade',       name: 'Fade / Undercut',  gender: ['hombre'],          category: 'corto',   tags: ['moderno','volumen'],   draw: drawFadeUndercut },
  { id: 'pompadour',  name: 'Pompadour',         gender: ['hombre'],          category: 'corto',   tags: ['retro','volumen'],     draw: drawPompadour },
  { id: 'textured',   name: 'Corte Texturizado', gender: ['hombre'],          category: 'corto',   tags: ['moderno','casual'],    draw: drawTexturedCrop },
  { id: 'quiff',      name: 'Quiff',             gender: ['hombre'],          category: 'corto',   tags: ['elegante','volumen'],  draw: drawQuiff },
  { id: 'caesar',     name: 'Caesar Cut',        gender: ['hombre'],          category: 'corto',   tags: ['clásico','flequillo'], draw: drawCaesarCut },
  { id: 'dreadlocks', name: 'Dreadlocks',        gender: ['hombre','mujer'],  category: 'especial',tags: ['étnico','largo'],      draw: drawDreadlocks },
  // Mujer
  { id: 'pixie',      name: 'Pixie Cut',         gender: ['mujer'],           category: 'corto',   tags: ['moderno','atrevido'],  draw: drawPixie },
  { id: 'bob',        name: 'Bob Liso',          gender: ['mujer'],           category: 'corto',   tags: ['elegante','clásico'],  draw: drawBob },
  { id: 'lob',        name: 'Lob (Long Bob)',    gender: ['mujer'],           category: 'medio',   tags: ['tendencia','versátil'],draw: drawLob },
  { id: 'wavy',       name: 'Ondas Medias',      gender: ['mujer'],           category: 'medio',   tags: ['romántico','natural'], draw: drawWavyMedium },
  { id: 'bun',        name: 'Bun Alto',          gender: ['mujer'],           category: 'especial',tags: ['recogido','elegante'], draw: drawBun },
  { id: 'fringe',     name: 'Flequillo + Largo', gender: ['mujer'],           category: 'largo',   tags: ['suave','romántico'],   draw: drawFringe },
  { id: 'braids',     name: 'Trenzas Largas',    gender: ['mujer','hombre'],  category: 'especial',tags: ['étnico','largo'],      draw: drawBraids },
  { id: 'ponytail',   name: 'Cola Alta',         gender: ['mujer'],           category: 'especial',tags: ['sport','recogido'],    draw: drawPonytailHigh },
  { id: 'longlayers', name: 'Capas Largas',      gender: ['mujer'],           category: 'largo',   tags: ['volumen','natural'],   draw: drawLongLayers },
  // Unisex
  { id: 'long',       name: 'Liso Largo',        gender: ['hombre','mujer'],  category: 'largo',   tags: ['clásico','suave'],     draw: drawLongStraight },
  { id: 'curly',      name: 'Rizado Natural',    gender: ['hombre','mujer'],  category: 'medio',   tags: ['natural','étnico'],    draw: drawCurlyNatural },
  { id: 'afro',       name: 'Afro',              gender: ['hombre','mujer'],  category: 'especial',tags: ['étnico','volumen'],    draw: drawAfro },
];

const COLORS: ColorOption[] = [
  { label: 'Negro azabache', value: '#0a0604' },
  { label: 'Castaño oscuro', value: '#2d1a0e' },
  { label: 'Castaño natural', value: '#5a3018' },
  { label: 'Castaño claro',  value: '#7d4a20' },
  { label: 'Rubio oscuro',   value: '#8b6030' },
  { label: 'Rubio dorado',   value: '#c09040' },
  { label: 'Rubio miel',     value: '#d4a855' },
  { label: 'Rubio platino',  value: '#dfd0a0' },
  { label: 'Ceniza claro',   value: '#c8c0b0' },
  { label: 'Gris plateado',  value: '#8a8a9a' },
  { label: 'Rojo cobre',     value: '#a03818' },
  { label: 'Rojo intenso',   value: '#780e0e' },
  { label: 'Borgoña',        value: '#5a0a1e' },
  { label: 'Azul oscuro',    value: '#0e1840' },
  { label: 'Verde oscuro',   value: '#0a2818' },
  { label: 'Morado',         value: '#380840' },
];

// ─── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-hairstyle-tryon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="ht-root">

  @if (processing()) {
    <div class="overlay">
      <div class="overlay-inner">
        <div class="scan-ring">
          <svg class="spin" width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="24" stroke="rgba(201,169,110,0.2)" stroke-width="2.5"/>
            <path d="M28 4 A24 24 0 0 1 52 28" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <svg class="face-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#c9a96e" stroke-width="1.5"/>
            <circle cx="9" cy="10" r="1.5" fill="#c9a96e"/><circle cx="15" cy="10" r="1.5" fill="#c9a96e"/>
            <path d="M9 15c.83 1 2 1.5 3 1.5s2.17-.5 3-1.5" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="overlay-msg">{{ statusMsg() }}</p>
      </div>
    </div>
  }

  <div class="layout">

    <!-- ── Canvas zone ── -->
    <div class="canvas-zone">
      <div class="canvas-card" (click)="!imageLoaded() && triggerUpload()">
        @if (!imageLoaded()) {
          <div class="empty-state">
            <div class="upload-ring">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
                <polyline points="17 8 12 3 7 8" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="empty-title">Sube una foto de frente</p>
            <p class="empty-sub">La IA detecta tu rostro y aplica el peinado preservando tu identidad facial</p>
            <span class="file-hint">JPG, PNG · máx 10 MB</span>
          </div>
        }
        <canvas #photoCanvas [class.visible]="imageLoaded()"></canvas>
      </div>

      <!-- Status badge -->
      @if (imageLoaded()) {
        <div class="status-badge" [class.warn]="!faceDetected()">
          @if (faceDetected()) {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Rostro detectado — identidad facial preservada</span>
          } @else {
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#facc15" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="#facc15" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span>Sin rostro detectado — posición estimada</span>
          }
        </div>
      }

      <!-- Action buttons -->
      <div class="action-row">
        <button class="btn-ghost" (click)="triggerUpload()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Subir foto
        </button>
        @if (imageLoaded()) {
          <button class="btn-gold" (click)="download()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Descargar
          </button>
          <button class="btn-ghost" (click)="resetToOriginal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 3v5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Original
          </button>
        }
      </div>

      <input #fileInput type="file" accept="image/*" style="display:none" (change)="loadFile($event)">
    </div>

    <!-- ── Controls ── -->
    <div class="controls">

      <!-- Gender selector -->
      <div class="ctrl-section">
        <p class="ctrl-label">Género</p>
        <div class="gender-row">
          @for (g of genders; track g.value) {
            <button class="gender-btn" [class.active]="selectedGender() === g.value" (click)="selectedGender.set(g.value); activeCategory.set('todos')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                @if (g.value === 'hombre') {
                  <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M15 12l5-5M16 7h4v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                } @else if (g.value === 'mujer') {
                  <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M12 12v6M9 16h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                } @else {
                  <path d="M12 2C8 2 5 5 5 9c0 4 7 13 7 13s7-9 7-13c0-4-3-7-7-7z" stroke="currentColor" stroke-width="1.5"/>
                }
              </svg>
              {{ g.label }}
            </button>
          }
        </div>
      </div>

      <!-- Category filter -->
      <div class="ctrl-section">
        <p class="ctrl-label">Tipo de corte</p>
        <div class="chip-row">
          @for (c of categories; track c.value) {
            <button class="chip" [class.active]="activeCategory() === c.value" (click)="activeCategory.set(c.value)">
              {{ c.label }}
            </button>
          }
        </div>
      </div>

      <!-- Styles grid -->
      <div class="ctrl-section">
        <p class="ctrl-label">Peinado ({{ filteredStyles().length }})</p>
        <div class="styles-grid">
          @for (s of filteredStyles(); track s.id) {
            <button class="style-card" [class.active]="selectedStyle()?.id === s.id" (click)="applyStyle(s)">
              <!-- Mini preview canvas -->
              <div class="preview-area">
                <canvas [attr.id]="'prev-' + s.id" width="72" height="72"></canvas>
              </div>
              <span class="style-name">{{ s.name }}</span>
              @if (selectedStyle()?.id === s.id) {
                <div class="active-dot"></div>
              }
            </button>
          }
        </div>
      </div>

      <!-- Color picker -->
      <div class="ctrl-section">
        <p class="ctrl-label">Color del cabello
          <span class="color-name-inline">— {{ selectedColorLabel() }}</span>
        </p>
        <div class="color-grid">
          @for (c of colors; track c.value) {
            <button
              class="color-swatch"
              [style.background]="c.value"
              [title]="c.label"
              [class.active]="selectedColor() === c.value"
              (click)="changeColor(c.value)">
              @if (selectedColor() === c.value) {
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>
              }
            </button>
          }
        </div>
      </div>

      <!-- Info note -->
      <div class="info-card">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-top:1px">
          <circle cx="12" cy="12" r="10" stroke="#c9a96e" stroke-width="1.5"/>
          <path d="M12 8v4M12 16h.01" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>Ojos, nariz, boca y estructura facial se mantienen intactos. Solo se modifica la zona del cabello.</p>
      </div>

    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    .ht-root { position: relative; padding: 0 24px 48px; color: #f0eff4; font-family: Inter, sans-serif; }

    /* Overlay */
    .overlay {
      position: fixed; inset: 0; background: rgba(8,8,16,0.9); z-index: 300;
      display: flex; align-items: center; justify-content: center;
    }
    .overlay-inner { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .scan-ring { position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; }
    .face-icon { position: absolute; }
    .spin { animation: spin 1.2s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .overlay-msg { color: #c9a96e; font-size: 14px; font-weight: 500; }

    /* Layout */
    .layout { display: grid; grid-template-columns: 1fr 350px; gap: 24px; max-width: 1100px; margin: 0 auto; }

    /* Canvas zone */
    .canvas-zone { display: flex; flex-direction: column; gap: 10px; }
    .canvas-card {
      background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
      border-radius: 18px; overflow: hidden; min-height: 440px;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: border-color 0.2s;
    }
    .canvas-card:hover { border-color: rgba(201,169,110,0.2); }
    canvas { display: none; max-width: 100%; }
    canvas.visible { display: block; cursor: default; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 40px; }
    .upload-ring {
      width: 76px; height: 76px; border-radius: 50%;
      border: 1.5px solid rgba(201,169,110,0.3);
      background: rgba(201,169,110,0.06);
      display: flex; align-items: center; justify-content: center;
    }
    .empty-title { margin: 0; font-size: 16px; font-weight: 500; color: #f0eff4; }
    .empty-sub { margin: 0; font-size: 13px; color: #9997b0; text-align: center; max-width: 260px; line-height: 1.5; }
    .file-hint { font-size: 11px; color: #5a5870; }

    .status-badge {
      display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px;
      background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2);
      font-size: 12px; color: #4ade80;
    }
    .status-badge.warn { background: rgba(250,204,21,0.08); border-color: rgba(250,204,21,0.2); color: #facc15; }

    .action-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-ghost {
      display: flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
      color: #9997b0; font-size: 13px; cursor: pointer; transition: all 0.2s;
    }
    .btn-ghost:hover { background: rgba(255,255,255,0.08); color: #f0eff4; }
    .btn-gold {
      display: flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 10px;
      border: none; background: linear-gradient(135deg, #c9a96e, #a07840);
      color: #080810; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-gold:hover { opacity: 0.88; transform: translateY(-1px); }

    /* Controls */
    .controls { display: flex; flex-direction: column; gap: 22px; overflow-y: auto; max-height: calc(100vh - 200px); padding-right: 2px; }
    .ctrl-section { display: flex; flex-direction: column; gap: 10px; }
    .ctrl-label { margin: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #5a5870; }
    .color-name-inline { font-weight: 400; letter-spacing: 0; text-transform: none; color: #9997b0; }

    /* Gender */
    .gender-row { display: flex; gap: 6px; }
    .gender-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 9px 0; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03); color: #9997b0; font-size: 13px;
      cursor: pointer; transition: all 0.2s;
    }
    .gender-btn:hover { border-color: rgba(201,169,110,0.3); color: #c9a96e; }
    .gender-btn.active { background: rgba(201,169,110,0.12); border-color: rgba(201,169,110,0.45); color: #c9a96e; font-weight: 600; }

    /* Chips */
    .chip-row { display: flex; flex-wrap: wrap; gap: 5px; }
    .chip {
      padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);
      background: transparent; color: #9997b0; font-size: 12px; cursor: pointer; transition: all 0.2s;
    }
    .chip:hover { border-color: rgba(201,169,110,0.3); color: #c9a96e; }
    .chip.active { background: rgba(201,169,110,0.12); border-color: rgba(201,169,110,0.4); color: #c9a96e; }

    /* Styles grid */
    .styles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .style-card {
      position: relative; display: flex; flex-direction: column; align-items: center; gap: 5px;
      padding: 8px 4px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.2s;
    }
    .style-card:hover { border-color: rgba(201,169,110,0.28); background: rgba(201,169,110,0.04); }
    .style-card.active { border-color: rgba(201,169,110,0.55); background: rgba(201,169,110,0.08); }
    .preview-area { width: 72px; height: 72px; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.03); }
    .preview-area canvas { display: block; }
    .style-name { font-size: 10px; color: #9997b0; text-align: center; line-height: 1.3; }
    .style-card.active .style-name { color: #c9a96e; }
    .active-dot { position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; border-radius: 50%; background: #c9a96e; }

    /* Colors */
    .color-grid { display: flex; flex-wrap: wrap; gap: 7px; }
    .color-swatch {
      width: 30px; height: 30px; border-radius: 7px; border: 2px solid transparent;
      cursor: pointer; transition: all 0.2s; padding: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .color-swatch:hover { transform: scale(1.12); }
    .color-swatch.active { border-color: #c9a96e; box-shadow: 0 0 0 2px rgba(201,169,110,0.3); transform: scale(1.12); }

    /* Info */
    .info-card {
      display: flex; align-items: flex-start; gap: 8px; padding: 12px 14px;
      border-radius: 10px; background: rgba(201,169,110,0.05); border: 1px solid rgba(201,169,110,0.15);
    }
    .info-card p { margin: 0; font-size: 12px; color: #9997b0; line-height: 1.55; }

    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .controls { max-height: none; overflow-y: visible; }
    }
  `],
})
export class HairstyleTryonComponent implements AfterViewInit {
  @ViewChild('photoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput')   fileInputRef!: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);

  // State
  imageLoaded   = signal(false);
  processing    = signal(false);
  faceDetected  = signal(false);
  statusMsg     = signal('Cargando modelos IA...');
  selectedStyle = signal<HairstyleOption | null>(null);
  selectedColor = signal('#2d1a0e');
  selectedGender = signal<'hombre' | 'mujer' | 'todos'>('hombre');
  activeCategory = signal<string>('todos');

  private modelsLoaded = false;
  private originalImage: HTMLImageElement | null = null;
  private faceMetrics: FaceMetrics | null = null;

  readonly genders = [
    { label: 'Hombre', value: 'hombre' as const },
    { label: 'Mujer',  value: 'mujer'  as const },
    { label: 'Todos',  value: 'todos'  as const },
  ];

  readonly categories = [
    { label: 'Todos',    value: 'todos'    },
    { label: 'Corto',    value: 'corto'    },
    { label: 'Medio',    value: 'medio'    },
    { label: 'Largo',    value: 'largo'    },
    { label: 'Especial', value: 'especial' },
  ];

  readonly colors = COLORS;

  selectedColorLabel = computed(() =>
    COLORS.find(c => c.value === this.selectedColor())?.label ?? ''
  );

  filteredStyles = computed(() => {
    const g = this.selectedGender();
    const c = this.activeCategory();
    return HAIRSTYLES.filter(s => {
      const gOk = g === 'todos' || s.gender.includes(g as Gender);
      const cOk = c === 'todos' || s.category === c;
      return gOk && cOk;
    });
  });

  ngAfterViewInit(): void {
    // Render mini previews when view is ready
    setTimeout(() => this.renderPreviews(), 100);
  }

  private renderPreviews(): void {
    HAIRSTYLES.forEach(style => {
      const el = document.getElementById('prev-' + style.id) as HTMLCanvasElement | null;
      if (!el) return;
      const ctx = el.getContext('2d');
      if (!ctx) return;
      // Draw a simple dark background
      ctx.fillStyle = '#12121e';
      ctx.fillRect(0, 0, 72, 72);
      // Draw a basic face silhouette
      ctx.fillStyle = '#1e1e2e';
      ctx.beginPath(); ctx.ellipse(36, 44, 18, 22, 0, 0, Math.PI * 2); ctx.fill();
      // Draw hair preview in selected color
      const previewColor = this.selectedColor();
      const fm: FaceMetrics = {
        cx: 36, foreheadY: 30, headTopY: 10, leftX: 20, rightX: 52,
        chinY: 66, faceW: 32, faceH: 36,
      };
      try { style.draw(ctx, fm, previewColor); } catch { /* ignore */ }
    });
  }

  triggerUpload(): void { this.fileInputRef.nativeElement.click(); }

  async loadFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    (event.target as HTMLInputElement).value = '';

    this.processing.set(true);
    this.statusMsg.set('Procesando imagen...');
    this.cdr.markForCheck();

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        this.originalImage = img;

        // Draw image to canvas FIRST (fixes canvas size)
        this.drawBase(img);

        // Then detect face
        this.statusMsg.set('Detectando rostro con IA...');
        this.cdr.markForCheck();
        await this.detectFace(img);

        this.imageLoaded.set(true);
        this.processing.set(false);

        // Re-apply current style if one is selected
        if (this.selectedStyle()) this.redraw();

        // Refresh previews with current color
        setTimeout(() => this.renderPreviews(), 50);
        this.cdr.markForCheck();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  private drawBase(img: HTMLImageElement): void {
    const canvas = this.canvasRef.nativeElement;
    // Fixed max width — never rely on parentElement.clientWidth during async
    const maxW = 720;
    const scale = Math.min(1, maxW / img.naturalWidth);
    canvas.width  = Math.round(img.naturalWidth  * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  private async detectFace(img: HTMLImageElement): Promise<void> {
    try {
      if (!this.modelsLoaded) {
        const URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        await faceapi.nets.tinyFaceDetector.loadFromUri(URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(URL);
        this.modelsLoaded = true;
      }

      const canvas = this.canvasRef.nativeElement;
      const sx = canvas.width  / img.naturalWidth;
      const sy = canvas.height / img.naturalHeight;

      const det = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.38 }))
        .withFaceLandmarks();

      if (!det) { this.buildFallbackMetrics(); return; }

      this.faceDetected.set(true);
      const lms = det.landmarks.positions;
      const box = det.detection.box;

      const faceW = box.width  * sx;
      const faceH = box.height * sy;
      const cx    = (box.x + box.width / 2) * sx;

      // Forehead = slightly above eyebrow level
      const leftBrowY  = Math.min(...[17,18,19,20,21].map(i => lms[i].y)) * sy;
      const rightBrowY = Math.min(...[22,23,24,25,26].map(i => lms[i].y)) * sy;
      const foreheadY  = Math.min(leftBrowY, rightBrowY) - faceH * 0.04;
      const headTopY   = foreheadY - faceH * 0.36;

      this.faceMetrics = {
        cx,
        foreheadY,
        headTopY,
        leftX:  lms[0].x  * sx,
        rightX: lms[16].x * sx,
        chinY:  lms[8].y  * sy,
        faceW,
        faceH,
      };
    } catch {
      this.buildFallbackMetrics();
    }
  }

  private buildFallbackMetrics(): void {
    this.faceDetected.set(false);
    const canvas = this.canvasRef.nativeElement;
    const cx = canvas.width / 2;
    const fw = canvas.width  * 0.42;
    const fh = canvas.height * 0.52;
    const fy = canvas.height * 0.14;
    this.faceMetrics = {
      cx, foreheadY: fy + fh * 0.12, headTopY: fy - fh * 0.25,
      leftX: cx - fw / 2, rightX: cx + fw / 2,
      chinY: fy + fh, faceW: fw, faceH: fh,
    };
  }

  applyStyle(style: HairstyleOption): void {
    this.selectedStyle.set(style);
    this.redraw();
  }

  changeColor(color: string): void {
    this.selectedColor.set(color);
    setTimeout(() => this.renderPreviews(), 10);
    if (this.selectedStyle()) this.redraw();
  }

  private redraw(): void {
    if (!this.originalImage) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    // Redraw clean photo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);

    const style = this.selectedStyle();
    if (!style || !this.faceMetrics) return;

    const fm = this.faceMetrics;

    // ── 1. Pixel-level hair recoloring in the hair zone ────────────────────
    const hairZone = {
      top:    Math.max(0, fm.headTopY - fm.faceH * 0.1),
      bottom: fm.foreheadY + fm.faceH * 0.04,
      left:   Math.max(0, fm.leftX  - fm.faceW * 0.35),
      right:  Math.min(canvas.width, fm.rightX + fm.faceW * 0.35),
    };
    this.recolorHairZone(ctx, canvas, this.selectedColor(), hairZone);

    // ── 2. Overlay canvas-drawn style on top ──────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.91;
    style.draw(ctx, fm, this.selectedColor());
    ctx.restore();
  }

  private recolorHairZone(
    ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
    newColor: string,
    zone: { top: number; bottom: number; left: number; right: number }
  ): void {
    const [nr, ng, nb] = hexRgb(newColor);
    const t  = Math.round(zone.top);
    const b  = Math.round(zone.bottom);
    const l  = Math.round(zone.left);
    const r  = Math.round(zone.right);
    const w  = r - l;
    const h  = b - t;
    if (w <= 0 || h <= 0) return;

    const imageData = ctx.getImageData(l, t, w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const pr = data[i], pg = data[i + 1], pb = data[i + 2];
      const brightness = (pr + pg + pb) / 3;

      // Skip very bright (background) and near-black (deep shadow keeps texture)
      if (brightness > 200 || brightness < 12) continue;

      // Strength: darker pixel = stronger recolor (hair typically darker than skin)
      const strength = Math.max(0, Math.min(0.75, (200 - brightness) / 200 * 0.85));

      data[i]     = Math.round(pr * (1 - strength) + nr * strength);
      data[i + 1] = Math.round(pg * (1 - strength) + ng * strength);
      data[i + 2] = Math.round(pb * (1 - strength) + nb * strength);
    }
    ctx.putImageData(imageData, l, t);
  }

  resetToOriginal(): void {
    if (!this.originalImage) return;
    this.drawBase(this.originalImage);
    this.selectedStyle.set(null);
  }

  download(): void {
    const link = document.createElement('a');
    link.download = 'barber-ai-hairstyle.png';
    link.href = this.canvasRef.nativeElement.toDataURL('image/png');
    link.click();
  }
}
