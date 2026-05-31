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

interface ClothingOption {
  id: string;
  name: string;
  category: 'casual' | 'formal' | 'sport' | 'elegante';
  icon: string;
  description: string;
}

const CLOTHING: ClothingOption[] = [
  { id: 'tshirt',   name: 'Camiseta',        category: 'casual',   icon: '👕', description: 'Casual y cómoda' },
  { id: 'polo',     name: 'Polo',            category: 'casual',   icon: '🎽', description: 'Semi-formal con cuello' },
  { id: 'hoodie',   name: 'Hoodie',          category: 'casual',   icon: '🧥', description: 'Con capucha y bolsillo' },
  { id: 'blazer',   name: 'Blazer',          category: 'formal',   icon: '🤵', description: 'Elegante con solapas' },
  { id: 'suit',     name: 'Traje',           category: 'formal',   icon: '👔', description: 'Traje completo con corbata' },
  { id: 'jersey',   name: 'Jersey deportivo',category: 'sport',    icon: '⚽', description: 'Con número y escudo' },
  { id: 'jacket',   name: 'Chaqueta',        category: 'sport',    icon: '🏋️', description: 'Deportiva con cremallera' },
  { id: 'vest',     name: 'Chaleco',         category: 'elegante', icon: '✨', description: 'Chaleco sin mangas' },
];

interface BodyZone {
  shoulderY: number;
  chestY: number;
  waistY: number;
  leftShoulderX: number;
  rightShoulderX: number;
  centerX: number;
  bodyW: number;
  bodyH: number;
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}
function lighten(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  const m = (v: number) => Math.min(255, Math.round(v + (255 - v) * a));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function darken(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  const m = (v: number) => Math.max(0, Math.round(v * (1 - a)));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Garment drawing ────────────────────────────────────────────────────────

function drawGarment(ctx: CanvasRenderingContext2D, zone: BodyZone, styleId: string, color: string): void {
  ctx.save();
  switch (styleId) {
    case 'tshirt':  drawTshirt(ctx, zone, color); break;
    case 'polo':    drawPolo(ctx, zone, color); break;
    case 'hoodie':  drawHoodie(ctx, zone, color); break;
    case 'blazer':  drawBlazer(ctx, zone, color); break;
    case 'suit':    drawSuit(ctx, zone, color); break;
    case 'jersey':  drawJersey(ctx, zone, color); break;
    case 'jacket':  drawJacket(ctx, zone, color); break;
    case 'vest':    drawVest(ctx, zone, color); break;
  }
  ctx.restore();
}

function clothGrad(ctx: CanvasRenderingContext2D, cx: number, y1: number, y2: number, color: string): CanvasGradient {
  const g = ctx.createLinearGradient(cx, y1, cx, y2);
  g.addColorStop(0,   lighten(color, 0.22));
  g.addColorStop(0.35, color);
  g.addColorStop(0.7, color);
  g.addColorStop(1,   darken(color, 0.3));
  return g;
}

function drawTshirt(ctx: CanvasRenderingContext2D, z: BodyZone, color: string): void {
  const { centerX: cx, shoulderY: sy, waistY: wy, leftShoulderX: lx, rightShoulderX: rx, bodyW: bw, bodyH: bh } = z;
  const sleeveLen = bw * 0.38;
  const neckW = bw * 0.26;
  const neckD = bh * 0.1;
  const armW = bw * 0.2;

  const grad = clothGrad(ctx, cx, sy, wy, color);
  ctx.fillStyle = grad;

  // Body
  ctx.beginPath();
  // neck
  ctx.moveTo(cx - neckW / 2, sy);
  ctx.quadraticCurveTo(cx, sy + neckD, cx + neckW / 2, sy);
  // right shoulder
  ctx.lineTo(rx, sy);
  // right sleeve
  ctx.lineTo(rx + sleeveLen, sy + bh * 0.12);
  ctx.lineTo(rx + sleeveLen - armW * 0.3, sy + bh * 0.28);
  ctx.lineTo(rx, sy + bh * 0.3);
  // right side down
  ctx.lineTo(rx + bw * 0.06, wy);
  ctx.lineTo(cx + bw * 0.04, wy + bh * 0.08);
  ctx.lineTo(cx - bw * 0.04, wy + bh * 0.08);
  ctx.lineTo(lx - bw * 0.06, wy);
  // left side up
  ctx.lineTo(lx, sy + bh * 0.3);
  // left sleeve
  ctx.lineTo(lx - sleeveLen + armW * 0.3, sy + bh * 0.28);
  ctx.lineTo(lx - sleeveLen, sy + bh * 0.12);
  ctx.lineTo(lx, sy);
  ctx.closePath();
  ctx.fill();

  // Collar highlight
  ctx.strokeStyle = lighten(color, 0.35);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2, sy);
  ctx.quadraticCurveTo(cx, sy + neckD, cx + neckW / 2, sy);
  ctx.stroke();

  // Fabric fold shadows
  for (let i = 0; i < 3; i++) {
    const yy = sy + bh * (0.35 + i * 0.18);
    ctx.strokeStyle = rgba(color, 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx + bw * 0.08, yy);
    ctx.quadraticCurveTo(cx, yy + bh * 0.04, rx - bw * 0.08, yy);
    ctx.stroke();
  }

  // Side seam
  ctx.strokeStyle = darken(color, 0.18);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lx, sy + bh * 0.3); ctx.lineTo(lx - bw * 0.06, wy); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rx, sy + bh * 0.3); ctx.lineTo(rx + bw * 0.06, wy); ctx.stroke();
}

function drawPolo(ctx: CanvasRenderingContext2D, z: BodyZone, color: string): void {
  drawTshirt(ctx, z, color);
  const { centerX: cx, shoulderY: sy, bodyW: bw, bodyH: bh } = z;
  const neckW = bw * 0.26;
  const neckD = bh * 0.1;
  const collarH = bh * 0.12;

  // Polo collar
  const cGrad = clothGrad(ctx, cx, sy - collarH * 0.3, sy + collarH, darken(color, 0.15));
  ctx.fillStyle = cGrad;
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2 - bw * 0.04, sy - collarH * 0.2);
  ctx.lineTo(cx - neckW / 2, sy + collarH * 0.6);
  ctx.quadraticCurveTo(cx, sy + neckD + collarH * 0.6, cx + neckW / 2, sy + collarH * 0.6);
  ctx.lineTo(cx + neckW / 2 + bw * 0.04, sy - collarH * 0.2);
  ctx.closePath();
  ctx.fill();

  // Button placket
  ctx.strokeStyle = rgba(color, 0.6);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, sy + collarH * 0.4);
  ctx.lineTo(cx, sy + bh * 0.45);
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    const by = sy + collarH * 0.7 + i * bh * 0.1;
    ctx.fillStyle = darken(color, 0.3);
    ctx.beginPath();
    ctx.arc(cx, by, bw * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHoodie(ctx: CanvasRenderingContext2D, z: BodyZone, color: string): void {
  const { centerX: cx, shoulderY: sy, waistY: wy, leftShoulderX: lx, rightShoulderX: rx, bodyW: bw, bodyH: bh } = z;
  const hoodW = bw * 0.52;
  const hoodH = bh * 0.55;
  const sleeveLen = bw * 0.45;

  // Hood
  const hGrad = ctx.createRadialGradient(cx, sy - hoodH * 0.2, bw * 0.1, cx, sy, hoodW * 0.55);
  hGrad.addColorStop(0, lighten(color, 0.28));
  hGrad.addColorStop(0.6, color);
  hGrad.addColorStop(1, darken(color, 0.25));
  ctx.fillStyle = hGrad;
  ctx.beginPath();
  ctx.ellipse(cx, sy - hoodH * 0.15, hoodW / 2, hoodH / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hood inner (dark)
  ctx.fillStyle = darken(color, 0.55);
  ctx.beginPath();
  ctx.ellipse(cx, sy - hoodH * 0.1, hoodW * 0.32, hoodH * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  const grad = clothGrad(ctx, cx, sy, wy, color);
  ctx.fillStyle = grad;

  // Body
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.22, sy);
  ctx.lineTo(lx, sy);
  ctx.lineTo(lx - sleeveLen, sy + bh * 0.15);
  ctx.lineTo(lx - sleeveLen, sy + bh * 0.35);
  ctx.lineTo(lx - sleeveLen + bw * 0.14, sy + bh * 0.38);
  ctx.lineTo(lx, sy + bh * 0.35);
  ctx.lineTo(lx - bw * 0.04, wy);
  ctx.lineTo(cx - bw * 0.02, wy + bh * 0.06);
  ctx.lineTo(cx + bw * 0.02, wy + bh * 0.06);
  ctx.lineTo(rx + bw * 0.04, wy);
  ctx.lineTo(rx, sy + bh * 0.35);
  ctx.lineTo(rx + sleeveLen - bw * 0.14, sy + bh * 0.38);
  ctx.lineTo(rx + sleeveLen, sy + bh * 0.35);
  ctx.lineTo(rx + sleeveLen, sy + bh * 0.15);
  ctx.lineTo(rx, sy);
  ctx.lineTo(cx + bw * 0.22, sy);
  ctx.closePath();
  ctx.fill();

  // Kangaroo pocket
  ctx.fillStyle = darken(color, 0.14);
  ctx.beginPath();
  ctx.roundRect(cx - bw * 0.25, wy - bh * 0.22, bw * 0.5, bh * 0.2, 6);
  ctx.fill();

  // Zipper
  ctx.strokeStyle = darken(color, 0.35);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, sy + bh * 0.05);
  ctx.lineTo(cx, wy);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBlazer(ctx: CanvasRenderingContext2D, z: BodyZone, color: string): void {
  const { centerX: cx, shoulderY: sy, waistY: wy, leftShoulderX: lx, rightShoulderX: rx, bodyW: bw, bodyH: bh } = z;
  const sleeveLen = bw * 0.42;
  const lapelW = bw * 0.14;

  // Left panel
  let g = clothGrad(ctx, cx - bw * 0.2, sy, wy, color);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(lx, sy);
  ctx.lineTo(lx - sleeveLen, sy + bh * 0.12);
  ctx.lineTo(lx - sleeveLen + bw * 0.1, sy + bh * 0.38);
  ctx.lineTo(lx, sy + bh * 0.36);
  ctx.lineTo(lx - bw * 0.02, wy + bh * 0.06);
  ctx.lineTo(cx - bw * 0.01, wy + bh * 0.1);
  ctx.lineTo(cx + lapelW * 0.3, sy + bh * 0.32);
  ctx.lineTo(cx - lapelW * 0.3, sy + bh * 0.1);
  ctx.lineTo(cx - lapelW, sy);
  ctx.closePath();
  ctx.fill();

  // Right panel
  g = clothGrad(ctx, cx + bw * 0.2, sy, wy, darken(color, 0.06));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(rx, sy);
  ctx.lineTo(rx + sleeveLen, sy + bh * 0.12);
  ctx.lineTo(rx + sleeveLen - bw * 0.1, sy + bh * 0.38);
  ctx.lineTo(rx, sy + bh * 0.36);
  ctx.lineTo(rx + bw * 0.02, wy + bh * 0.06);
  ctx.lineTo(cx + bw * 0.01, wy + bh * 0.1);
  ctx.lineTo(cx - lapelW * 0.3, sy + bh * 0.32);
  ctx.lineTo(cx + lapelW * 0.3, sy + bh * 0.1);
  ctx.lineTo(cx + lapelW, sy);
  ctx.closePath();
  ctx.fill();

  // Lapels (lighter)
  ctx.fillStyle = lighten(color, 0.18);
  // left lapel
  ctx.beginPath();
  ctx.moveTo(lx, sy); ctx.lineTo(cx - lapelW, sy);
  ctx.lineTo(cx - lapelW * 0.3, sy + bh * 0.1);
  ctx.lineTo(cx + lapelW * 0.3, sy + bh * 0.32);
  ctx.lineTo(cx, sy + bh * 0.35);
  ctx.lineTo(lx - bw * 0.01, sy + bh * 0.22);
  ctx.closePath();
  ctx.fill();
  // right lapel
  ctx.beginPath();
  ctx.moveTo(rx, sy); ctx.lineTo(cx + lapelW, sy);
  ctx.lineTo(cx + lapelW * 0.3, sy + bh * 0.1);
  ctx.lineTo(cx - lapelW * 0.3, sy + bh * 0.32);
  ctx.lineTo(cx, sy + bh * 0.35);
  ctx.lineTo(rx + bw * 0.01, sy + bh * 0.22);
  ctx.closePath();
  ctx.fill();

  // Buttons
  for (let i = 0; i < 2; i++) {
    const by = sy + bh * (0.38 + i * 0.12);
    ctx.fillStyle = darken(color, 0.5);
    ctx.beginPath();
    ctx.arc(cx - bw * 0.015, by, bw * 0.022, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = lighten(color, 0.2);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx - bw * 0.015, by, bw * 0.022, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Pocket square
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(lx + bw * 0.08, sy + bh * 0.25);
  ctx.lineTo(lx + bw * 0.2, sy + bh * 0.25);
  ctx.lineTo(lx + bw * 0.2, sy + bh * 0.32);
  ctx.lineTo(lx + bw * 0.08, sy + bh * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(lx + bw * 0.1, sy + bh * 0.25);
  ctx.lineTo(lx + bw * 0.14, sy + bh * 0.2);
  ctx.lineTo(lx + bw * 0.18, sy + bh * 0.25);
  ctx.fill();
}

function drawSuit(ctx: CanvasRenderingContext2D, z: BodyZone, color: string): void {
  drawBlazer(ctx, z, color);
  const { centerX: cx, shoulderY: sy, bodyW: bw, bodyH: bh } = z;

  // White shirt collar + tie
  ctx.fillStyle = 'rgba(240,239,244,0.92)';
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.14, sy);
  ctx.lineTo(cx - bw * 0.04, sy + bh * 0.28);
  ctx.lineTo(cx + bw * 0.04, sy + bh * 0.28);
  ctx.lineTo(cx + bw * 0.14, sy);
  ctx.closePath();
  ctx.fill();

  // Tie
  const tColor = '#8b2500';
  ctx.fillStyle = tColor;
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.04, sy + bh * 0.08);
  ctx.lineTo(cx - bw * 0.055, sy + bh * 0.18);
  ctx.lineTo(cx, sy + bh * 0.3);
  ctx.lineTo(cx + bw * 0.055, sy + bh * 0.18);
  ctx.lineTo(cx + bw * 0.04, sy + bh * 0.08);
  ctx.lineTo(cx, sy + bh * 0.12);
  ctx.closePath();
  ctx.fill();

  // Tie knot
  ctx.fillStyle = darken(tColor, 0.2);
  ctx.beginPath();
  ctx.ellipse(cx, sy + bh * 0.1, bw * 0.04, bh * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawJersey(ctx: CanvasRenderingContext2D, z: BodyZone, color: string): void {
  drawTshirt(ctx, z, color);
  const { centerX: cx, shoulderY: sy, bodyW: bw, bodyH: bh, leftShoulderX: lx, rightShoulderX: rx, waistY: wy } = z;

  // Side stripes
  ctx.fillStyle = rgba(color, 0);
  const stripeColor = lighten(color, 0.4);
  for (let side = -1; side <= 1; side += 2) {
    const sx2 = side < 0 ? lx - bw * 0.04 : rx + bw * 0.04 - bw * 0.08;
    ctx.fillStyle = lighten(color, 0.35);
    ctx.fillRect(sx2, sy + bh * 0.22, bw * 0.08, wy - (sy + bh * 0.22));
  }

  // Number on chest
  ctx.fillStyle = lighten(color, 0.8);
  ctx.font = `bold ${bw * 0.3}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('10', cx, sy + bh * 0.45);

  // Collar
  ctx.strokeStyle = lighten(color, 0.45);
  ctx.lineWidth = bw * 0.028;
  ctx.beginPath();
  ctx.arc(cx, sy + bh * 0.05, bw * 0.14, Math.PI * 0.05, Math.PI * 0.95);
  ctx.stroke();
}

function drawJacket(ctx: CanvasRenderingContext2D, z: BodyZone, color: string): void {
  drawHoodie(ctx, z, color);
  const { centerX: cx, shoulderY: sy, waistY: wy, bodyW: bw, bodyH: bh } = z;

  // Zipper track
  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(cx, sy + bh * 0.04);
  ctx.lineTo(cx, wy + bh * 0.06);
  ctx.stroke();

  // Zip pull
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.rect(cx - 6, sy + bh * 0.25, 12, 7);
  ctx.fill();

  // Arm stripes
  ctx.strokeStyle = lighten(color, 0.4);
  ctx.lineWidth = bw * 0.025;
  ctx.beginPath();
  ctx.moveTo(z.leftShoulderX - bw * 0.28, sy + bh * 0.14);
  ctx.lineTo(z.leftShoulderX - bw * 0.28, sy + bh * 0.36);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(z.rightShoulderX + bw * 0.28, sy + bh * 0.14);
  ctx.lineTo(z.rightShoulderX + bw * 0.28, sy + bh * 0.36);
  ctx.stroke();
}

function drawVest(ctx: CanvasRenderingContext2D, z: BodyZone, color: string): void {
  const { centerX: cx, shoulderY: sy, waistY: wy, leftShoulderX: lx, rightShoulderX: rx, bodyW: bw, bodyH: bh } = z;
  const armholeW = bw * 0.2;

  // Left panel
  const gL = clothGrad(ctx, cx - bw * 0.2, sy, wy, color);
  ctx.fillStyle = gL;
  ctx.beginPath();
  ctx.moveTo(lx + armholeW, sy);
  ctx.lineTo(lx, sy + bh * 0.08);
  ctx.quadraticCurveTo(lx - bw * 0.02, sy + bh * 0.28, lx, sy + bh * 0.34);
  ctx.lineTo(lx - bw * 0.02, wy + bh * 0.06);
  ctx.lineTo(cx - bw * 0.01, wy + bh * 0.1);
  ctx.lineTo(cx, sy + bh * 0.38);
  ctx.lineTo(cx - bw * 0.12, sy + bh * 0.04);
  ctx.closePath();
  ctx.fill();

  // Right panel
  const gR = clothGrad(ctx, cx + bw * 0.2, sy, wy, darken(color, 0.05));
  ctx.fillStyle = gR;
  ctx.beginPath();
  ctx.moveTo(rx - armholeW, sy);
  ctx.lineTo(rx, sy + bh * 0.08);
  ctx.quadraticCurveTo(rx + bw * 0.02, sy + bh * 0.28, rx, sy + bh * 0.34);
  ctx.lineTo(rx + bw * 0.02, wy + bh * 0.06);
  ctx.lineTo(cx + bw * 0.01, wy + bh * 0.1);
  ctx.lineTo(cx, sy + bh * 0.38);
  ctx.lineTo(cx + bw * 0.12, sy + bh * 0.04);
  ctx.closePath();
  ctx.fill();

  // V-neck outline
  ctx.strokeStyle = darken(color, 0.25);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.12, sy + bh * 0.04);
  ctx.lineTo(cx, sy + bh * 0.38);
  ctx.lineTo(cx + bw * 0.12, sy + bh * 0.04);
  ctx.stroke();

  // Buttons
  for (let i = 0; i < 4; i++) {
    const by = sy + bh * (0.32 + i * 0.1);
    ctx.fillStyle = darken(color, 0.45);
    ctx.beginPath();
    ctx.arc(cx, by, bw * 0.02, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-clothes-tryon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="clothes-container">
      @if (processing()) {
        <div class="processing-overlay">
          <div class="scanner-anim">
            <div class="scanner-bar"></div>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="#c9a96e" stroke-width="2" stroke-dasharray="6 4" opacity="0.6"/>
              <rect x="28" y="22" width="24" height="36" rx="4" stroke="#c9a96e" stroke-width="1.5" opacity="0.6"/>
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
                <p class="upload-title">Sube una foto de torso</p>
                <p class="upload-hint">Foto de frente con torso visible para mejores resultados</p>
                <span class="upload-sub">JPG, PNG hasta 10MB</span>
              </div>
            }
            <canvas #photoCanvas [style.display]="imageLoaded() ? 'block' : 'none'"></canvas>
          </div>

          @if (imageLoaded()) {
            <div class="face-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"/></svg>
              Rostro detectado — prenda posicionada bajo el cuello
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
            <h3 class="section-title">Categoría</h3>
            <div class="cat-tabs">
              @for (cat of categories; track cat.value) {
                <button class="cat-tab" [class.active]="activeCategory() === cat.value" (click)="activeCategory.set(cat.value)">
                  {{ cat.label }}
                </button>
              }
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Prenda</h3>
            <div class="styles-list">
              @for (item of filteredItems(); track item.id) {
                <button class="style-row" [class.selected]="selectedItem()?.id === item.id" (click)="applyItem(item)">
                  <span class="style-icon">{{ item.icon }}</span>
                  <div class="style-info">
                    <span class="style-name">{{ item.name }}</span>
                    <span class="style-desc">{{ item.description }}</span>
                  </div>
                  @if (selectedItem()?.id === item.id) {
                    <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#c9a96e" stroke-width="2"/></svg>
                  }
                </button>
              }
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Color de la prenda</h3>
            <div class="color-grid">
              @for (c of colors; track c.value) {
                <button class="color-swatch" [style.background]="c.value" [class.selected]="selectedColor() === c.value" [title]="c.label" (click)="changeColor(c.value)">
                  @if (selectedColor() === c.value) {
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" [attr.stroke]="isLight(c.value) ? '#000' : '#fff'" stroke-width="2.5"/></svg>
                  }
                </button>
              }
            </div>
            <p class="color-label">{{ selectedColorLabel() }}</p>
          </div>

          <div class="tip-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#c9a96e" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="#c9a96e" stroke-width="1.5"/></svg>
            <p>La prenda se posiciona automáticamente bajo el cuello detectado por IA.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clothes-container { position: relative; padding: 0 24px 40px; }
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
      display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px;
      background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2);
      font-size: 12px; color: #4ade80;
    }
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
export class ClothesTryonComponent {
  @ViewChild('photoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);

  imageLoaded   = signal(false);
  processing    = signal(false);
  statusMsg     = signal('Cargando modelos IA...');
  selectedItem  = signal<ClothingOption | null>(null);
  selectedColor = signal('#1a1a1a');
  activeCategory = signal<string>('all');

  private modelsLoaded = false;
  private originalImage: HTMLImageElement | null = null;
  private bodyZone: BodyZone | null = null;

  readonly categories = [
    { label: 'Todos',    value: 'all'      },
    { label: 'Casual',   value: 'casual'   },
    { label: 'Formal',   value: 'formal'   },
    { label: 'Sport',    value: 'sport'    },
    { label: 'Elegante', value: 'elegante' },
  ];

  readonly colors = [
    { label: 'Negro',       value: '#1a1a1a' },
    { label: 'Gris oscuro', value: '#3a3a3a' },
    { label: 'Blanco',      value: '#f0eff4' },
    { label: 'Azul marino', value: '#1e2d4a' },
    { label: 'Azul rey',    value: '#2d4a9a' },
    { label: 'Rojo',        value: '#9a1520' },
    { label: 'Verde',       value: '#1a5a2a' },
    { label: 'Marrón',      value: '#5a3520' },
    { label: 'Beige',       value: '#c8a87a' },
    { label: 'Gris claro',  value: '#9a9aaa' },
    { label: 'Morado',      value: '#4a1a6a' },
    { label: 'Naranja',     value: '#c85a20' },
  ];

  selectedColorLabel = computed(() =>
    this.colors.find(c => c.value === this.selectedColor())?.label ?? ''
  );

  isLight(hex: string): boolean {
    const { r, g, b } = hexToRgb(hex);
    return (r + g + b) / 3 > 160;
  }

  filteredItems(): ClothingOption[] {
    const cat = this.activeCategory();
    if (cat === 'all') return CLOTHING;
    return CLOTHING.filter(c => c.category === cat);
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
        this.statusMsg.set('Detectando cuerpo...');
        this.cdr.markForCheck();
        await this.detectBody(img);
        this.drawBase();
        this.imageLoaded.set(true);
        this.processing.set(false);
        this.cdr.markForCheck();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  private async detectBody(img: HTMLImageElement): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    if (!this.modelsLoaded) {
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      this.modelsLoaded = true;
    }
    const det = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
      .withFaceLandmarks();

    const scaleX = canvas.width / img.naturalWidth;
    const scaleY = canvas.height / img.naturalHeight;

    if (det) {
      const box = det.detection.box;
      const faceW  = box.width  * scaleX;
      const faceH  = box.height * scaleY;
      const faceCX = (box.x + box.width / 2)  * scaleX;
      const faceBotY = (box.y + box.height)   * scaleY;

      // Chin point
      const lms = det.landmarks.positions;
      const chinY = lms[8].y * scaleY;

      const shoulderY = chinY + faceH * 0.25;
      const bodyW = faceW * 1.6;
      this.bodyZone = {
        shoulderY,
        chestY:   shoulderY + faceH * 0.35,
        waistY:   shoulderY + faceH * 1.0,
        leftShoulderX:  faceCX - bodyW / 2,
        rightShoulderX: faceCX + bodyW / 2,
        centerX: faceCX,
        bodyW,
        bodyH: faceH * 1.0,
      };
    } else {
      // Fallback: estimate from image dimensions
      const cx = canvas.width / 2;
      const bw = canvas.width * 0.55;
      const bh = canvas.height * 0.45;
      this.bodyZone = {
        shoulderY: canvas.height * 0.38,
        chestY:    canvas.height * 0.48,
        waistY:    canvas.height * 0.72,
        leftShoulderX:  cx - bw / 2,
        rightShoulderX: cx + bw / 2,
        centerX: cx, bodyW: bw, bodyH: bh,
      };
    }
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

  applyItem(item: ClothingOption): void {
    this.selectedItem.set(item);
    this.redraw();
  }

  changeColor(color: string): void {
    this.selectedColor.set(color);
    if (this.selectedItem()) this.redraw();
  }

  private redraw(): void {
    if (!this.originalImage || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);

    const item = this.selectedItem();
    if (!item) return;

    // Re-scale body zone if needed
    if (!this.bodyZone) return;

    ctx.globalAlpha = 0.92;
    drawGarment(ctx, this.bodyZone, item.id, this.selectedColor());
    ctx.globalAlpha = 1;
  }

  download(): void {
    const canvas = this.canvasRef.nativeElement;
    const link = document.createElement('a');
    link.download = 'barber-ai-outfit.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
