import {
  Component, signal, computed, ViewChild, ElementRef,
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as faceapi from 'face-api.js';

// ─── Core types ──────────────────────────────────────────────────────────────

type Gender   = 'hombre' | 'mujer' | 'unisex';
type Category = 'todos' | 'corto' | 'medio' | 'largo' | 'especial';

interface FM {          // Face metrics (canvas-scaled)
  cx: number;          // center X
  fy: number;          // forehead Y (hair starts here on face)
  ht: number;          // head top Y (estimated skull top)
  lx: number;          // left temple X
  rx: number;          // right temple X
  ch: number;          // chin Y
  fw: number;          // face width
  fh: number;          // face height
}

interface Style {
  id: string; name: string;
  gender: Gender[]; category: Category; tags: string;
  render: (ctx: CanvasRenderingContext2D, f: FM, col: string) => void;
}

// ─── Color helpers ────────────────────────────────────────────────────────────

const hexRgb = (h: string): [number,number,number] => {
  const n = parseInt(h.replace('#',''), 16);
  return [(n>>16)&0xff, (n>>8)&0xff, n&0xff];
};
const lt = (h: string, a: number) => {
  const [r,g,b] = hexRgb(h);
  return `rgb(${Math.min(255,r+(255-r)*a|0)},${Math.min(255,g+(255-g)*a|0)},${Math.min(255,b+(255-b)*a|0)})`;
};
const dk = (h: string, a: number) => {
  const [r,g,b] = hexRgb(h);
  return `rgb(${r*(1-a)|0},${g*(1-a)|0},${b*(1-a)|0})`;
};
const vg = (ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, col: string) => {
  const g = ctx.createLinearGradient(x,y0,x,y1);
  g.addColorStop(0, lt(col,.32)); g.addColorStop(.35,col); g.addColorStop(.8,col); g.addColorStop(1,dk(col,.42));
  return g;
};

// ─── Core rendering primitives ────────────────────────────────────────────────

/**
 * Draw N hair strands from a source band into a destination band.
 * This is the core primitive that makes hair look like hair.
 */
function strands(
  ctx: CanvasRenderingContext2D,
  col: string,
  x0: number, x1: number,   // horizontal spread
  fromY: number, toY: number, // vertical extent
  count: number,
  curve  = 0,   // lateral curve (+ = sweep right, - = sweep left)
  wave   = 0,   // horizontal waviness
  width  = 1.1,
  alpha  = 0.9,
): void {
  for (let i = 0; i < count; i++) {
    const t   = i / (count - 1 || 1);
    const sx  = x0 + (x1 - x0) * t + (Math.random() - .5) * wave;
    const ex  = sx + curve * (t - .5) * 2.8 + (Math.random() - .5) * wave * .6;
    const mid = (fromY + toY) / 2;
    // color variation for realism
    const v = Math.random();
    ctx.strokeStyle = v > .72 ? lt(col,.42) : v > .45 ? lt(col,.14) : v > .22 ? col : dk(col,.2);
    ctx.lineWidth   = width * (.7 + Math.random() * .65);
    ctx.globalAlpha = alpha * (.7 + Math.random() * .3);
    ctx.beginPath();
    ctx.moveTo(sx, fromY);
    ctx.bezierCurveTo(
      sx + (ex-sx)*.3 + (Math.random()-.5)*wave*.4, fromY + (toY-fromY)*.35,
      sx + (ex-sx)*.7 + (Math.random()-.5)*wave*.4, fromY + (toY-fromY)*.7,
      ex, toY);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/**
 * Draw filled hair region with gradient + strand texture clipped to a path.
 * This is the main building block for all hairstyles.
 */
function hairBlock(
  ctx: CanvasRenderingContext2D,
  col: string,
  pathFn: () => void,       // draws the clip path
  fromY: number, toY: number,
  cx: number, spreadX: number,
  strandCount: number,
  curve = 0, wave = 0,
): void {
  ctx.save();
  ctx.beginPath(); pathFn(); ctx.clip();

  // Gradient base fill
  const fillX0 = cx - spreadX / 2 - 20;
  const fillW  = spreadX + 40;
  ctx.fillStyle = vg(ctx, cx, fromY - 10, toY + 10, col);
  ctx.fillRect(fillX0, fromY - 10, fillW, toY - fromY + 20);

  // Strand texture
  strands(ctx, col, cx - spreadX/2, cx + spreadX/2, fromY, toY, strandCount, curve, wave);

  // Glossy center highlight
  const hg = ctx.createLinearGradient(cx - 18, fromY, cx + 18, fromY);
  hg.addColorStop(0,'rgba(255,255,255,0)');
  hg.addColorStop(.5,'rgba(255,255,255,0.16)');
  hg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(cx - 18, fromY, 36, toY - fromY);

  ctx.restore();
}

/** Standard skull cap (used by almost every style as the top hair base). */
function cap(ctx: CanvasRenderingContext2D, f: FM, col: string, padFactor = .12): void {
  const { cx, ht, fy, lx, rx, fw, fh } = f;
  const px = fw * padFactor;
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(lx - px, fy + fh * .02);
      ctx.bezierCurveTo(lx - px, ht + fw * .08, cx - fw * .56, ht - fw * .06, cx, ht - fw * .08);
      ctx.bezierCurveTo(cx + fw * .56, ht - fw * .06, rx + px, ht + fw * .08, rx + px, fy + fh * .02);
      ctx.closePath();
    },
    ht - fw * .08, fy + fh * .04,
    cx, rx - lx + px * 2,
    60, 0, fw * .04,
  );
}

/** Side hair panel (left or right), used for medium/long styles. */
function sidePanelPath(
  ctx: CanvasRenderingContext2D, f: FM, col: string,
  side: -1 | 1, botY: number, padX: number,
): void {
  const { cx, fy, lx, rx, fw, fh } = f;
  const bx = side < 0 ? lx - padX : rx + padX;
  const ix = side < 0 ? lx + fw * .04 : rx - fw * .04;
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(ix, fy + fh * .1);
      ctx.bezierCurveTo(ix - side * fw*.03, f.ch - fh*.3, bx + side * fw*.02, f.ch + fh*.2, bx, botY);
      ctx.lineTo(bx - side * fw*.12, botY);
      ctx.bezierCurveTo(bx - side * fw*.1, f.ch + fh*.1, ix + side * fw*.05, f.ch - fh*.4, ix + side * fw*.04, fy + fh*.1);
      ctx.closePath();
    },
    fy + fh * .08, botY,
    (ix + bx) / 2, Math.abs(bx - ix) + fw * .12,
    38, side * fw * .03, fw * .02,
  );
}

// ─── 32 Hairstyle render functions ────────────────────────────────────────────

function rBuzzCut(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .03);
  // Very short fade on sides
  const [r,g,b] = hexRgb(col);
  for (let i=0;i<4;i++){
    const yy = f.fy + f.fh * (.1 + i*.07);
    ctx.fillStyle = `rgba(${r},${g},${b},${.2-i*.04})`;
    ctx.fillRect(f.lx - f.fw*.12, yy, f.fw*.12, f.fh*.055);
    ctx.fillRect(f.rx,             yy, f.fw*.12, f.fh*.055);
  }
}

function rCrewCut(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .05);
  strands(ctx, col, f.lx - f.fw*.06, f.rx + f.fw*.06, f.ht - f.fw*.04, f.fy + f.fh*.06, 50, 0, f.fw*.03, 1.2, .85);
}

function rLineUp(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .04);
  // Crisp geometric edge at forehead
  ctx.strokeStyle = dk(col,.6); ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(f.lx - f.fw*.04, f.fy + f.fh*.02);
  ctx.lineTo(f.rx + f.fw*.04, f.fy + f.fh*.02);
  ctx.stroke();
  // Temple line-up marks
  ctx.beginPath();
  ctx.moveTo(f.lx - f.fw*.04, f.fy + f.fh*.02);
  ctx.lineTo(f.lx - f.fw*.04, f.fy + f.fh*.14);
  ctx.moveTo(f.rx + f.fw*.04, f.fy + f.fh*.02);
  ctx.lineTo(f.rx + f.fw*.04, f.fy + f.fh*.14);
  ctx.stroke();
}

function rFadeUndercut(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  const { cx, ht, fy, lx, rx, fw, fh } = f;
  const topW = fw * .62;
  // Volume blob on top
  hairBlock(ctx, col,
    () => { ctx.ellipse(cx, ht + fw*.04, topW/2, fw*.38, 0, 0, Math.PI*2); },
    ht - fw*.04, fy + fh*.04,
    cx, topW, 80, -fw*.2, fw*.04,
  );
  // Swept volume detail
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - topW/2, fy + fh*.02);
  ctx.bezierCurveTo(cx - topW*.55, ht, cx + topW*.08, ht - fw*.26, cx + topW/2, fy - fh*.04);
  ctx.bezierCurveTo(cx + topW*.3,  fy + fh*.06, cx, fy + fh*.08, cx - topW/2, fy + fh*.02);
  ctx.clip();
  ctx.fillStyle = dk(col,.08);
  ctx.fillRect(cx - topW/2, fy - fh*.04, topW, fh*.12);
  ctx.restore();
  // Fade bands
  const [r,g,b] = hexRgb(col);
  for (let i=0;i<4;i++){
    const yy = fy + fh*(.18 + i*.07);
    ctx.fillStyle = `rgba(${r},${g},${b},${.22-i*.05})`;
    ctx.fillRect(lx - fw*.14, yy, fw*.14, fh*.055);
    ctx.fillRect(rx,           yy, fw*.14, fh*.055);
  }
}

function rPompadour(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  const { cx, ht, fy, fw, fh } = f;
  cap(ctx, f, col, .08);
  // Raised pompadour ridge
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(cx - fw*.42, fy + fh*.03);
      ctx.bezierCurveTo(cx - fw*.44, ht, cx - fw*.28, ht - fw*.35, cx, ht - fw*.38);
      ctx.bezierCurveTo(cx + fw*.28, ht - fw*.35, cx + fw*.44, ht, cx + fw*.42, fy + fh*.03);
      ctx.bezierCurveTo(cx + fw*.28, fy - fh*.04, cx, fy - fh*.06, cx - fw*.28, fy - fh*.04);
      ctx.closePath();
    },
    ht - fw*.38, fy + fh*.04,
    cx, fw*.85, 90, fw*.16, fw*.03,
  );
}

function rQuiff(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  const { cx, ht, fy, fw, fh } = f;
  cap(ctx, f, col, .08);
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(cx - fw*.3, fy + fh*.02);
      ctx.bezierCurveTo(cx - fw*.32, ht - fw*.16, cx - fw*.14, ht - fw*.3, cx, ht - fw*.3);
      ctx.bezierCurveTo(cx + fw*.14, ht - fw*.3, cx + fw*.32, ht - fw*.16, cx + fw*.3, fy + fh*.02);
      ctx.closePath();
    },
    ht - fw*.3, fy + fh*.04,
    cx, fw*.6, 70, 0, fw*.02,
  );
}

function rCaesar(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .08);
  // Horizontal fringe
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(f.lx - f.fw*.12, f.fy + f.fh*.02);
      ctx.lineTo(f.rx + f.fw*.12, f.fy + f.fh*.02);
      ctx.lineTo(f.rx + f.fw*.12, f.fy + f.fh*.15);
      ctx.lineTo(f.lx - f.fw*.12, f.fy + f.fh*.15);
      ctx.closePath();
    },
    f.fy + f.fh*.02, f.fy + f.fh*.15,
    f.cx, (f.rx - f.lx) + f.fw*.24, 40, 0, f.fw*.02,
  );
}

function rTaperFade(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  const { cx, ht, fy, lx, rx, fw, fh } = f;
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(lx - fw*.04, fy + fh*.02);
      ctx.bezierCurveTo(lx - fw*.04, ht, cx - fw*.52, ht - fw*.06, cx, ht - fw*.08);
      ctx.bezierCurveTo(cx + fw*.52, ht - fw*.06, rx + fw*.04, ht, rx + fw*.04, fy + fh*.02);
      ctx.closePath();
    },
    ht - fw*.08, fy + fh*.04,
    cx, (rx-lx) + fw*.08, 55, 0, fw*.04,
  );
  const [r,g,b] = hexRgb(col);
  for (let i=0;i<5;i++){
    ctx.fillStyle = `rgba(${r},${g},${b},${.18-i*.035})`;
    ctx.fillRect(lx - fw*.12, fy + fh*(.12+i*.07), fw*.12, fh*.06);
    ctx.fillRect(rx,           fy + fh*(.12+i*.07), fw*.12, fh*.06);
  }
}

function rFauxHawk(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  const { cx, ht, fy, fw, fh } = f;
  cap(ctx, f, col, .06);
  // Center mohawk strip with extra height
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(cx - fw*.18, fy + fh*.02);
      ctx.bezierCurveTo(cx - fw*.2, ht - fw*.1, cx - fw*.12, ht - fw*.38, cx, ht - fw*.4);
      ctx.bezierCurveTo(cx + fw*.12, ht - fw*.38, cx + fw*.2, ht - fw*.1, cx + fw*.18, fy + fh*.02);
      ctx.closePath();
    },
    ht - fw*.4, fy + fh*.04,
    cx, fw*.36, 55, 0, fw*.01,
  );
}

function rSlickBack(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  const { cx, ht, fy, lx, rx, fw, fh } = f;
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(lx - fw*.1, fy + fh*.02);
      ctx.bezierCurveTo(lx - fw*.1, ht, cx - fw*.55, ht - fw*.05, cx, ht - fw*.06);
      ctx.bezierCurveTo(cx + fw*.55, ht - fw*.05, rx + fw*.1, ht, rx + fw*.1, fy + fh*.02);
      ctx.closePath();
    },
    ht - fw*.06, fy + fh*.04,
    cx, (rx-lx) + fw*.2, 70, fw*.22, fw*.02,
  );
  // Slick highlight strip
  const sg = ctx.createLinearGradient(cx, ht, cx, fy);
  sg.addColorStop(0,'rgba(255,255,255,.2)'); sg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(cx - 12, ht, 24, fy - ht);
}

function rManBun(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .06);
  const bcx = f.cx, bcy = f.ht - f.fw*.24;
  // Bun
  hairBlock(ctx, col,
    () => { ctx.ellipse(bcx, bcy, f.fw*.22, f.fw*.2, 0, 0, Math.PI*2); },
    bcy - f.fw*.2, bcy + f.fw*.2, bcx, f.fw*.44, 50, 0, f.fw*.03,
  );
  // Bun wrap lines
  ctx.strokeStyle = dk(col,.35); ctx.lineWidth = 1;
  for (let i=0;i<6;i++){
    const a = (i/6)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(bcx, bcy);
    ctx.arc(bcx, bcy, f.fw*.19, a, a + Math.PI*.25); ctx.stroke();
  }
  ctx.fillStyle = dk(col,.6);
  ctx.beginPath(); ctx.ellipse(bcx, bcy + f.fw*.16, f.fw*.08, 5, 0, 0, Math.PI*2); ctx.fill();
}

function rDreadlocks(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .1);
  const count = 12;
  for (let i=0;i<count;i++){
    const t = i/(count-1);
    const x = f.lx - f.fw*.06 + (f.rx - f.lx + f.fw*.12)*t;
    const dW = f.fw*.044;
    const len = f.fh*(0.8 + Math.sin(t*Math.PI)*.42);
    const sY = f.fy + f.fh*.05; const eY = sY + len;
    const dg = ctx.createLinearGradient(x, sY, x, eY);
    dg.addColorStop(0, lt(col,.12)); dg.addColorStop(.5, col); dg.addColorStop(1, dk(col,.5));
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.moveTo(x - dW/2, sY);
    for (let j=0;j<6;j++){
      const yy = sY + (eY-sY)*(j+1)/6;
      const xo = (j%2===0?1:-1)*dW*.32;
      ctx.lineTo(x+xo+dW/2, yy); ctx.lineTo(x+xo-dW/2, yy);
    }
    ctx.lineTo(x - dW/2, sY); ctx.fill();
    for (let j=1;j<6;j++){
      ctx.fillStyle = dk(col,.55);
      ctx.fillRect(x - dW/2, sY + (eY-sY)*j/6 - 1.5, dW, 3);
    }
  }
}

function rPixie(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .05);
  strands(ctx, col, f.lx - f.fw*.06, f.rx + f.fw*.06, f.ht + f.fw*.04, f.fy + f.fh*.08, 45, 0, f.fw*.04);
  // Side swept fringe
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(f.cx - f.fw*.42, f.fy + f.fh*.01);
      ctx.lineTo(f.cx + f.fw*.25, f.fy + f.fh*.01);
      ctx.lineTo(f.cx + f.fw*.32, f.fy + f.fh*.14);
      ctx.lineTo(f.cx - f.fw*.5,  f.fy + f.fh*.1);
      ctx.closePath();
    },
    f.fy, f.fy + f.fh*.14,
    f.cx - f.fw*.1, f.fw*.74, 30, -f.fw*.14, f.fw*.02,
  );
}

function rBob(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .24);
  const botY = f.ch - f.fh*.12;
  sidePanelPath(ctx, f, col, -1, botY, f.fw*.22);
  sidePanelPath(ctx, f, col,  1, botY, f.fw*.22);
  // Bottom blunt edge
  ctx.strokeStyle = dk(col,.28); ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(f.lx - f.fw*.22 + f.fw*.06, botY);
  ctx.quadraticCurveTo(f.cx, botY + f.fh*.02, f.rx + f.fw*.22 - f.fw*.06, botY);
  ctx.stroke();
}

function rLob(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .26);
  const botY = f.ch + f.fh*.22;
  sidePanelPath(ctx, f, col, -1, botY, f.fw*.25);
  sidePanelPath(ctx, f, col,  1, botY, f.fw*.25);
}

function rWavyMedium(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .28);
  const botY = f.ch + f.fh*.35;
  const padX = f.fw*.28;
  for (const side of [-1,1] as const) {
    const bx = side < 0 ? f.lx - padX : f.rx + padX;
    const ix = side < 0 ? f.lx + f.fw*.05 : f.rx - f.fw*.05;
    hairBlock(ctx, col,
      () => {
        ctx.moveTo(ix, f.fy + f.fh*.1);
        let y = f.fy + f.fh*.18;
        const step = f.fh*.22;
        while (y < botY) {
          const amp = f.fw*.07;
          ctx.bezierCurveTo(ix + side*amp, y, bx, y+step*.4, bx, y+step*.5);
          ctx.bezierCurveTo(bx, y+step*.6, ix + side*amp, y+step*.85, ix, y+step);
          y += step;
        }
        ctx.lineTo(bx + side*f.fw*.05, botY);
        ctx.lineTo(bx, f.fy + f.fh*.06);
        ctx.closePath();
      },
      f.fy + f.fh*.1, botY,
      (ix + bx)/2, Math.abs(bx-ix)+f.fw*.12,
      40, side*f.fw*.04, f.fw*.025,
    );
  }
}

function rLongStraight(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .3);
  const botY = f.ch + f.fh*1.25;
  sidePanelPath(ctx, f, col, -1, botY, f.fw*.3);
  sidePanelPath(ctx, f, col,  1, botY, f.fw*.3);
  // Center part
  const hg = ctx.createLinearGradient(f.cx-5,f.ht,f.cx+5,f.ht);
  hg.addColorStop(0,'rgba(255,255,255,0)'); hg.addColorStop(.5,'rgba(255,255,255,.22)'); hg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = hg; ctx.fillRect(f.cx-5, f.ht, 10, f.fy - f.ht);
}

function rLongLayers(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .3);
  const botY = f.ch + f.fh*1.4;
  for (let l=0;l<3;l++){
    ctx.globalAlpha = .9 - l*.12;
    const layBotY = f.ch + f.fh*(.55 + l*.42);
    sidePanelPath(ctx, f, col, -1, layBotY, f.fw*(.28 - l*.02));
    sidePanelPath(ctx, f, col,  1, layBotY, f.fw*(.28 - l*.02));
  }
  ctx.globalAlpha = 1;
}

function rCurlyNatural(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  const { cx, ht, fy, ch, fw, fh, lx, rx } = f;
  const botY = ch + fh*.32;
  const padX = fw*.32;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, ht + fh*.18, (rx-lx)/2 + padX, fh*.7, 0, 0, Math.PI*2);
  ctx.clip();
  const bg = ctx.createRadialGradient(cx-fw*.14, ht, fw*.06, cx, ht+fh*.2, (rx-lx)/2+padX);
  bg.addColorStop(0, lt(col,.3)); bg.addColorStop(.55, col); bg.addColorStop(1, dk(col,.4));
  ctx.fillStyle = bg;
  ctx.fillRect(cx-fw, ht-fw*.1, fw*2, botY-ht+fw*.15);
  // Curl rings
  for (let i=0;i<80;i++){
    const cx2 = cx + (Math.random()-.5)*(rx-lx+padX*1.6);
    const cy2 = ht + Math.random()*(botY-ht)*.9;
    const r   = fw*(.035 + Math.random()*.065);
    ctx.strokeStyle = Math.random()>.5 ? lt(col,.3) : dk(col,.2);
    ctx.lineWidth = 1.3 + Math.random()*1.4;
    ctx.globalAlpha = .6 + Math.random()*.35;
    ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI*1.6); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.restore();
}

function rAfro(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  const { cx, ht, fy, fw } = f;
  const rX = fw*.8; const rY = fw*.76; const cY = ht + fw*.05;
  const bg = ctx.createRadialGradient(cx-fw*.2, cY-fw*.18, fw*.04, cx, cY, rX);
  bg.addColorStop(0,lt(col,.5)); bg.addColorStop(.45,lt(col,.1)); bg.addColorStop(.82,col); bg.addColorStop(1,dk(col,.5));
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.ellipse(cx, cY, rX, rY, 0, 0, Math.PI*2); ctx.fill();
  for (let i=0;i<32;i++){
    const angle = (i/32)*Math.PI*2;
    const bx = cx + Math.cos(angle)*rX*.9; const by = cY + Math.sin(angle)*rY*.9;
    if (by > fy+8) continue;
    ctx.fillStyle = lt(col,.15 + Math.random()*.2);
    ctx.beginPath(); ctx.arc(bx, by, fw*(.055+Math.random()*.065), 0, Math.PI*2); ctx.fill();
  }
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cY, rX*.94, rY*.94, 0, 0, Math.PI*2); ctx.clip();
  for (let i=0;i<180;i++){
    const tx = cx+(Math.random()-.5)*rX*1.8; const ty = cY+(Math.random()-.5)*rY*1.8;
    ctx.fillStyle = Math.random()>.5?'rgba(0,0,0,.1)':'rgba(255,255,255,.07)';
    ctx.beginPath(); ctx.arc(tx, ty, fw*.011, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function rBraids(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .1);
  const count = 11;
  for (let i=0;i<count;i++){
    const t = i/(count-1);
    const x = f.lx - f.fw*.05 + (f.rx - f.lx + f.fw*.1)*t;
    const dW = f.fw*.042;
    const len = f.fh*(.85 + Math.sin(t*Math.PI)*.44);
    const sY = f.fy + f.fh*.05; const eY = sY + len;
    const dg = ctx.createLinearGradient(x,sY,x,eY);
    dg.addColorStop(0,lt(col,.12)); dg.addColorStop(.5,col); dg.addColorStop(1,dk(col,.48));
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.moveTo(x-dW/2, sY);
    for (let j=0;j<6;j++){
      const yy = sY + (eY-sY)*(j+1)/6;
      const xo = (j%2===0?1:-1)*dW*.3;
      ctx.lineTo(x+xo+dW/2, yy); ctx.lineTo(x+xo-dW/2, yy);
    }
    ctx.lineTo(x-dW/2, sY); ctx.fill();
    for (let j=1;j<6;j++){
      ctx.fillStyle = dk(col,.55); ctx.fillRect(x-dW/2, sY+(eY-sY)*j/6-1.5, dW, 3);
    }
  }
}

function rPonytailHigh(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .08);
  const tY = f.ht - f.fw*.02;
  const tW = f.fw*.25; const len = f.fh*1.5;
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(f.cx - tW/2, tY);
      ctx.bezierCurveTo(f.cx - tW/2 - f.fw*.04, tY+len*.38, f.cx+f.fw*.08, tY+len*.68, f.cx+f.fw*.04, tY+len);
      ctx.lineTo(f.cx + tW/2 + f.fw*.04, tY+len);
      ctx.bezierCurveTo(f.cx+tW/2+f.fw*.08, tY+len*.68, f.cx+tW/2+f.fw*.04, tY+len*.38, f.cx+tW/2, tY);
      ctx.closePath();
    },
    tY, tY+len, f.cx, tW+f.fw*.08, 30, f.fw*.06, f.fw*.02,
  );
  ctx.fillStyle = dk(col,.55);
  ctx.beginPath(); ctx.roundRect(f.cx-tW/2-2, tY-5, tW+4, 12, 3); ctx.fill();
}

function rBunHigh(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .09);
  const bcy = f.ht - f.fw*.26;
  hairBlock(ctx, col,
    () => { ctx.ellipse(f.cx, bcy, f.fw*.24, f.fw*.22, 0, 0, Math.PI*2); },
    bcy - f.fw*.22, bcy + f.fw*.22, f.cx, f.fw*.48, 55, 0, f.fw*.03,
  );
  ctx.strokeStyle = dk(col,.3); ctx.lineWidth=1;
  for (let i=0;i<6;i++){
    const a = (i/6)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(f.cx,bcy); ctx.arc(f.cx, bcy, f.fw*.2, a, a+Math.PI*.22); ctx.stroke();
  }
  ctx.fillStyle = dk(col,.65);
  ctx.beginPath(); ctx.ellipse(f.cx, bcy+f.fw*.18, f.fw*.09, 5, 0, 0, Math.PI*2); ctx.fill();
}

function rFringe(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .28);
  const botY = f.ch + f.fh*1.0;
  sidePanelPath(ctx, f, col, -1, botY, f.fw*.26);
  sidePanelPath(ctx, f, col,  1, botY, f.fw*.26);
  // Blunt fringe band
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(f.lx-f.fw*.26, f.fy+f.fh*.04);
      ctx.lineTo(f.rx+f.fw*.26, f.fy+f.fh*.04);
      ctx.lineTo(f.rx+f.fw*.26, f.fy+f.fh*.17);
      ctx.lineTo(f.lx-f.fw*.26, f.fy+f.fh*.17);
      ctx.closePath();
    },
    f.fy+f.fh*.04, f.fy+f.fh*.17,
    f.cx, (f.rx-f.lx)+f.fw*.52, 38, 0, f.fw*.02,
  );
}

function rCurtainBangs(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .28);
  const botY = f.ch + f.fh*.8;
  sidePanelPath(ctx, f, col, -1, botY, f.fw*.25);
  sidePanelPath(ctx, f, col,  1, botY, f.fw*.25);
  // Split curtain bangs
  for (const side of [-1,1] as const){
    hairBlock(ctx, col,
      () => {
        const sx = side < 0 ? f.cx - f.fw*.06 : f.cx + f.fw*.06;
        const ex = side < 0 ? f.lx - f.fw*.12 : f.rx + f.fw*.12;
        ctx.moveTo(sx, f.fy + f.fh*.02);
        ctx.bezierCurveTo(sx + side*f.fw*.1, f.fy + f.fh*.12, ex + side*f.fw*.05, f.fy + f.fh*.22, ex, f.fy + f.fh*.26);
        ctx.lineTo(ex - side*f.fw*.1, f.fy + f.fh*.28);
        ctx.bezierCurveTo(ex - side*f.fw*.12, f.fy + f.fh*.2, sx - side*f.fw*.02, f.fy + f.fh*.08, sx - side*f.fw*.04, f.fy + f.fh*.02);
        ctx.closePath();
      },
      f.fy + f.fh*.02, f.fy + f.fh*.28,
      f.cx + side * f.fw*.18, f.fw*.34, 28, side*f.fw*.12, f.fw*.02,
    );
  }
}

function rSpaceBuns(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .08);
  for (const side of [-1,1] as const){
    const bcx = f.cx + side * f.fw*.42;
    const bcy = f.ht + f.fw*.06;
    hairBlock(ctx, col,
      () => { ctx.ellipse(bcx, bcy, f.fw*.2, f.fw*.19, 0, 0, Math.PI*2); },
      bcy - f.fw*.19, bcy + f.fw*.19, bcx, f.fw*.4, 45, 0, f.fw*.03,
    );
    ctx.strokeStyle = dk(col,.3); ctx.lineWidth=1;
    for (let i=0;i<5;i++){
      const a = (i/5)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(bcx,bcy); ctx.arc(bcx,bcy,f.fw*.17,a,a+Math.PI*.2); ctx.stroke();
    }
    ctx.fillStyle = dk(col,.65);
    ctx.beginPath(); ctx.ellipse(bcx, bcy+f.fw*.15, f.fw*.07, 4, 0, 0, Math.PI*2); ctx.fill();
  }
}

function rHalfUp(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .28);
  const botY = f.ch + f.fh*1.1;
  sidePanelPath(ctx, f, col, -1, botY, f.fw*.28);
  sidePanelPath(ctx, f, col,  1, botY, f.fw*.28);
  // Small top bun/clip
  const bcy = f.ht + f.fw*.08;
  hairBlock(ctx, col,
    () => { ctx.ellipse(f.cx, bcy, f.fw*.18, f.fw*.14, 0, 0, Math.PI*2); },
    bcy - f.fw*.14, bcy + f.fw*.14, f.cx, f.fw*.36, 35, 0, f.fw*.02,
  );
  ctx.fillStyle = 'rgba(200,180,150,.7)';
  ctx.beginPath(); ctx.ellipse(f.cx, bcy + f.fw*.12, f.fw*.06, 4, 0, 0, Math.PI*2); ctx.fill();
}

function rBarrelCurls(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .28);
  const curlTop = f.fy + f.fh*.2;
  const curlBot = f.ch + f.fh*.4;
  // Large barrel curls on sides
  for (const side of [-1,1] as const){
    const cols = 3;
    for (let c=0;c<cols;c++){
      const t = c/(cols-1);
      const cx2 = side < 0 ? f.lx - f.fw*(.24 - t*.1) : f.rx + f.fw*(.24 - t*.1);
      const cy2 = curlTop + (curlBot - curlTop) * t;
      const r   = f.fw * (.1 + t*.04);
      ctx.strokeStyle = t > .5 ? dk(col,.15) : col;
      ctx.lineWidth = r * .9;
      ctx.globalAlpha = .88;
      ctx.beginPath(); ctx.arc(cx2, cy2, r * .5, 0, Math.PI*1.8); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

function rWolfCut(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  rLongLayers(ctx, f, col);
  // Add extra textured fringe
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(f.lx - f.fw*.15, f.fy + f.fh*.01);
      ctx.lineTo(f.rx + f.fw*.15, f.fy + f.fh*.01);
      ctx.lineTo(f.rx + f.fw*.08, f.fy + f.fh*.22);
      ctx.lineTo(f.lx - f.fw*.08, f.fy + f.fh*.22);
      ctx.closePath();
    },
    f.fy, f.fy + f.fh*.22,
    f.cx, (f.rx-f.lx) + f.fw*.3, 50, 0, f.fw*.04,
  );
}

function rMullet(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .08);
  // Short sides
  const [r,g,b] = hexRgb(col);
  for (let i=0;i<3;i++){
    ctx.fillStyle = `rgba(${r},${g},${b},${.2-i*.05})`;
    ctx.fillRect(f.lx-f.fw*.12, f.fy+f.fh*(.15+i*.07), f.fw*.12, f.fh*.06);
    ctx.fillRect(f.rx,           f.fy+f.fh*(.15+i*.07), f.fw*.12, f.fh*.06);
  }
  // Long back
  hairBlock(ctx, col,
    () => {
      ctx.moveTo(f.cx - f.fw*.4, f.fy + f.fh*.04);
      ctx.lineTo(f.cx + f.fw*.4, f.fy + f.fh*.04);
      ctx.lineTo(f.cx + f.fw*.38, f.ch + f.fh*.8);
      ctx.lineTo(f.cx - f.fw*.38, f.ch + f.fh*.8);
      ctx.closePath();
    },
    f.fy + f.fh*.04, f.ch + f.fh*.8,
    f.cx, f.fw*.76, 70, 0, f.fw*.02,
  );
}

function rShagCut(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  cap(ctx, f, col, .28);
  const botY = f.ch + f.fh*.6;
  sidePanelPath(ctx, f, col, -1, botY, f.fw*.26);
  sidePanelPath(ctx, f, col,  1, botY, f.fw*.26);
  // Choppy fringe layers
  for (let l=0;l<3;l++){
    const ly = f.fy + f.fh*(.04 + l*.1);
    hairBlock(ctx, col,
      () => {
        ctx.moveTo(f.lx - f.fw*(.16-l*.04), ly);
        ctx.lineTo(f.rx + f.fw*(.16-l*.04), ly);
        ctx.lineTo(f.rx + f.fw*(.12-l*.04), ly + f.fh*.09);
        ctx.lineTo(f.lx - f.fw*(.12-l*.04), ly + f.fh*.09);
        ctx.closePath();
      },
      ly, ly + f.fh*.09,
      f.cx, (f.rx-f.lx) + f.fw*.32, 28, 0, f.fw*.04,
    );
  }
}

function rCurlyFade(ctx: CanvasRenderingContext2D, f: FM, col: string): void {
  const { cx, ht, fy, lx, rx, fw, fh } = f;
  const topW = fw * .6;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, ht + fw*.06, topW/2, fw*.4, 0, 0, Math.PI*2);
  ctx.clip();
  const bg = ctx.createRadialGradient(cx-fw*.12, ht, fw*.04, cx, ht+fw*.08, topW/2);
  bg.addColorStop(0,lt(col,.35)); bg.addColorStop(.6,col); bg.addColorStop(1,dk(col,.35));
  ctx.fillStyle = bg;
  ctx.fillRect(cx-topW/2-4, ht-fw*.04, topW+8, fw*.44+fh*.04);
  for (let i=0;i<60;i++){
    const cx2 = cx + (Math.random()-.5)*topW*.9;
    const cy2 = ht + Math.random()*fw*.38;
    const r   = fw*(.03 + Math.random()*.05);
    ctx.strokeStyle = Math.random()>.5 ? lt(col,.3) : dk(col,.2);
    ctx.lineWidth = 1.2 + Math.random()*1.2;
    ctx.globalAlpha = .6+Math.random()*.35;
    ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI*1.6); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.restore();
  const [r,g,b] = hexRgb(col);
  for (let i=0;i<5;i++){
    ctx.fillStyle = `rgba(${r},${g},${b},${.2-i*.038})`;
    ctx.fillRect(lx-fw*.14, fy+fh*(.15+i*.07), fw*.14, fh*.055);
    ctx.fillRect(rx,         fy+fh*(.15+i*.07), fw*.14, fh*.055);
  }
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

const STYLES: Style[] = [
  // Hombre
  { id:'buzz',      name:'Buzz Cut',          gender:['hombre'],         category:'corto',   tags:'rapado clásico',          render:rBuzzCut },
  { id:'crew',      name:'Crew Cut',           gender:['hombre'],         category:'corto',   tags:'clásico americano',       render:rCrewCut },
  { id:'lineup',    name:'Line Up',            gender:['hombre'],         category:'corto',   tags:'geométrico nítido',       render:rLineUp },
  { id:'fade',      name:'Fade Undercut',      gender:['hombre'],         category:'corto',   tags:'moderno volumen',         render:rFadeUndercut },
  { id:'taper',     name:'Taper Fade',         gender:['hombre'],         category:'corto',   tags:'degradado suave',         render:rTaperFade },
  { id:'pompadour', name:'Pompadour',          gender:['hombre'],         category:'corto',   tags:'retro volumen',           render:rPompadour },
  { id:'quiff',     name:'Quiff',              gender:['hombre'],         category:'corto',   tags:'elegante volumen',        render:rQuiff },
  { id:'caesar',    name:'Caesar Cut',         gender:['hombre'],         category:'corto',   tags:'flequillo horizontal',    render:rCaesar },
  { id:'fauxhawk',  name:'Faux Hawk',          gender:['hombre'],         category:'corto',   tags:'cresta suave',            render:rFauxHawk },
  { id:'slick',     name:'Slick Back',         gender:['hombre'],         category:'corto',   tags:'engominado elegante',     render:rSlickBack },
  { id:'manbun',    name:'Man Bun',            gender:['hombre'],         category:'especial',tags:'recogido',                render:rManBun },
  { id:'mullet',    name:'Mullet Moderno',     gender:['hombre'],         category:'medio',   tags:'retro años 80',           render:rMullet },
  { id:'curlyfade', name:'Curly Fade',         gender:['hombre'],         category:'especial',tags:'rizado degradado',        render:rCurlyFade },
  // Mujer
  { id:'pixie',     name:'Pixie Cut',          gender:['mujer'],          category:'corto',   tags:'moderno atrevido',        render:rPixie },
  { id:'bob',       name:'Bob Liso',           gender:['mujer'],          category:'corto',   tags:'elegante clásico',        render:rBob },
  { id:'lob',       name:'Lob (Long Bob)',     gender:['mujer'],          category:'medio',   tags:'tendencia versátil',      render:rLob },
  { id:'wavy',      name:'Ondas Medias',       gender:['mujer'],          category:'medio',   tags:'romántico natural',       render:rWavyMedium },
  { id:'fringe',    name:'Flequillo Largo',    gender:['mujer'],          category:'largo',   tags:'suave romántico',         render:rFringe },
  { id:'curtain',   name:'Flequillo Cortina',  gender:['mujer'],          category:'medio',   tags:'tendencia 90s',           render:rCurtainBangs },
  { id:'wolfcut',   name:'Wolf Cut',           gender:['mujer'],          category:'medio',   tags:'volumen textura',         render:rWolfCut },
  { id:'shag',      name:'Shag Cut',           gender:['mujer'],          category:'medio',   tags:'capas despeinadas',       render:rShagCut },
  { id:'longlayers',name:'Capas Largas',       gender:['mujer'],          category:'largo',   tags:'volumen natural',         render:rLongLayers },
  { id:'barrelcurls',name:'Rizos Barril',      gender:['mujer'],          category:'especial',tags:'voluminoso glamour',      render:rBarrelCurls },
  { id:'spacbuns',  name:'Space Buns',         gender:['mujer'],          category:'especial',tags:'doble moño',              render:rSpaceBuns },
  { id:'halfup',    name:'Half Up Half Down',  gender:['mujer'],          category:'especial',tags:'semirecogido',            render:rHalfUp },
  { id:'ponytail',  name:'Cola Alta',          gender:['mujer'],          category:'especial',tags:'sport recogido',          render:rPonytailHigh },
  { id:'bun',       name:'Moño Alto',          gender:['mujer'],          category:'especial',tags:'recogido elegante',       render:rBunHigh },
  // Unisex
  { id:'long',      name:'Liso Largo',         gender:['hombre','mujer'], category:'largo',   tags:'clásico suave',           render:rLongStraight },
  { id:'curly',     name:'Rizado Natural',     gender:['hombre','mujer'], category:'medio',   tags:'natural étnico',          render:rCurlyNatural },
  { id:'afro',      name:'Afro',               gender:['hombre','mujer'], category:'especial',tags:'étnico volumen',          render:rAfro },
  { id:'braids',    name:'Trenzas Largas',     gender:['hombre','mujer'], category:'especial',tags:'étnico largo',            render:rBraids },
  { id:'dreadlocks',name:'Dreadlocks',         gender:['hombre','mujer'], category:'especial',tags:'étnico',                  render:rDreadlocks },
];

// ─── Color palette ────────────────────────────────────────────────────────────

const COLORS = [
  { label:'Negro',        value:'#0a0604' },
  { label:'Castaño oscuro',value:'#2d1a0e' },
  { label:'Castaño',      value:'#5a3018' },
  { label:'Castaño claro',value:'#7d4a22' },
  { label:'Rubio oscuro', value:'#8b6030' },
  { label:'Rubio dorado', value:'#c09040' },
  { label:'Rubio miel',   value:'#d4a855' },
  { label:'Rubio platino',value:'#e0d0a0' },
  { label:'Ceniza',       value:'#c0b8a8' },
  { label:'Gris plata',   value:'#8a8a9a' },
  { label:'Blanco nieve', value:'#dddacc' },
  { label:'Rojo cobre',   value:'#a03818' },
  { label:'Rojo intenso', value:'#780e0e' },
  { label:'Borgoña',      value:'#5a0a1e' },
  { label:'Azul marino',  value:'#0e1840' },
  { label:'Verde oscuro', value:'#0a2818' },
  { label:'Morado',       value:'#380840' },
  { label:'Rosa pastel',  value:'#d080a0' },
];

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-hairstyle-tryon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="root">

  <!-- Loading overlay -->
  @if (processing()) {
    <div class="overlay">
      <div class="ov-inner">
        <div class="spin-ring">
          <svg class="spinning" width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="22" stroke="rgba(201,169,110,0.2)" stroke-width="2.5"/>
            <path d="M26 4 A22 22 0 0 1 48 26" stroke="#c9a96e" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <svg style="position:absolute" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#c9a96e" stroke-width="1.4"/>
            <path d="M12 12v3M9 18c0-2 6-2 6 0" stroke="#c9a96e" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="ov-msg">{{ statusMsg() }}</p>
      </div>
    </div>
  }

  <div class="layout">

    <!-- Canvas panel -->
    <div class="canvas-panel">
      <div class="canvas-card" (click)="!imageLoaded() && triggerUpload()">
        @if (!imageLoaded()) {
          <div class="empty">
            <div class="empty-ring">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
                <polyline points="17 8 12 3 7 8" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <p class="empty-title">Sube una foto de frente</p>
            <p class="empty-body">La IA detecta tu rostro y visualiza el peinado sobre tu foto preservando tu identidad facial</p>
            <span class="empty-hint">JPG · PNG · máx 10 MB</span>
          </div>
        }
        <canvas #photoCanvas [class.show]="imageLoaded()"></canvas>
      </div>

      @if (imageLoaded()) {
        <div class="badge" [class.warn]="!faceDetected()">
          @if (faceDetected()) {
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"/></svg>
            Rostro detectado — solo el cabello cambia
          } @else {
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#facc15" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="#facc15" stroke-width="1.5" stroke-linecap="round"/></svg>
            Posición estimada — centra tu cara en la foto
          }
        </div>
      }

      <div class="btn-row">
        <button class="btn-ghost" (click)="triggerUpload()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Subir foto
        </button>
        @if (imageLoaded()) {
          <button class="btn-ghost" (click)="resetToOriginal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 3v5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Original
          </button>
          <button class="btn-gold" (click)="download()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Descargar
          </button>
        }
      </div>
      <input #fileInput type="file" accept="image/*" style="display:none" (change)="loadFile($event)">
    </div>

    <!-- Controls -->
    <div class="controls">

      <!-- Gender -->
      <div class="section">
        <p class="label">Género</p>
        <div class="gender-tabs">
          @for (g of genders; track g.v) {
            <button class="gtab" [class.active]="selGender() === g.v" (click)="setGender(g.v)">
              {{ g.l }}
            </button>
          }
        </div>
      </div>

      <!-- Category -->
      <div class="section">
        <p class="label">Tipo</p>
        <div class="chips">
          @for (c of cats; track c.v) {
            <button class="chip" [class.active]="selCat() === c.v" (click)="selCat.set(c.v)">
              {{ c.l }}
            </button>
          }
        </div>
      </div>

      <!-- Styles grid with mini canvas previews -->
      <div class="section">
        <p class="label">Peinado — <span class="count">{{ filteredStyles().length }} estilos</span></p>
        <div class="styles-grid">
          @for (s of filteredStyles(); track s.id) {
            <button class="scard" [class.active]="selStyle()?.id === s.id" (click)="applyStyle(s)">
              <div class="prev-wrap">
                <canvas [id]="'pv-' + s.id" width="68" height="68"></canvas>
              </div>
              <span class="sname">{{ s.name }}</span>
              @if (selStyle()?.id === s.id) {
                <span class="sdot"></span>
              }
            </button>
          }
        </div>
      </div>

      <!-- Hair color -->
      <div class="section">
        <p class="label">Color del cabello
          <span class="color-lbl"> — {{ selColorLabel() }}</span>
        </p>
        <div class="color-row">
          @for (c of colors; track c.value) {
            <button
              class="cswatch"
              [style.background]="c.value"
              [title]="c.label"
              [class.active]="selColor() === c.value"
              (click)="setColor(c.value)">
              @if (selColor() === c.value) {
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>
              }
            </button>
          }
        </div>
      </div>

      <div class="tip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10" stroke="#c9a96e" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>Los ojos, nariz, boca y estructura facial se mantienen intactos. Solo cambia la zona del cabello.</span>
      </div>

    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    .root { position: relative; padding: 0 24px 48px; }

    /* Overlay */
    .overlay { position:fixed;inset:0;background:rgba(8,8,16,.92);z-index:400;display:flex;align-items:center;justify-content:center; }
    .ov-inner { display:flex;flex-direction:column;align-items:center;gap:14px; }
    .spin-ring { position:relative;width:52px;height:52px;display:flex;align-items:center;justify-content:center; }
    .spinning { animation: spin 1.1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ov-msg { color:#c9a96e;font-size:14px;font-weight:500;margin:0; }

    /* Layout */
    .layout { display:grid;grid-template-columns:1fr 360px;gap:24px;max-width:1120px;margin:0 auto; }

    /* Canvas panel */
    .canvas-panel { display:flex;flex-direction:column;gap:10px; }
    .canvas-card {
      background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);
      border-radius:18px;overflow:hidden;min-height:450px;
      display:flex;align-items:center;justify-content:center;cursor:pointer;
      transition:border-color .2s;
    }
    .canvas-card:hover { border-color:rgba(201,169,110,.2); }
    canvas { display:none;max-width:100%; }
    canvas.show { display:block;cursor:default; }
    .empty { display:flex;flex-direction:column;align-items:center;gap:10px;padding:64px 40px; }
    .empty-ring { width:78px;height:78px;border-radius:50%;border:1.5px solid rgba(201,169,110,.28);background:rgba(201,169,110,.06);display:flex;align-items:center;justify-content:center; }
    .empty-title { margin:0;font-size:16px;font-weight:500;color:#f0eff4; }
    .empty-body { margin:0;font-size:13px;color:#9997b0;text-align:center;max-width:260px;line-height:1.55; }
    .empty-hint { font-size:11px;color:#5a5870; }
    .badge { display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.2);font-size:12px;color:#4ade80; }
    .badge.warn { background:rgba(250,204,21,.08);border-color:rgba(250,204,21,.2);color:#facc15; }
    .btn-row { display:flex;gap:8px;flex-wrap:wrap; }
    .btn-ghost { display:flex;align-items:center;gap:7px;padding:9px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#9997b0;font-size:13px;cursor:pointer;transition:all .2s; }
    .btn-ghost:hover { background:rgba(255,255,255,.08);color:#f0eff4; }
    .btn-gold { display:flex;align-items:center;gap:7px;padding:9px 16px;border-radius:10px;border:none;background:linear-gradient(135deg,#c9a96e,#a07840);color:#080810;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s; }
    .btn-gold:hover { opacity:.88;transform:translateY(-1px); }

    /* Controls */
    .controls { display:flex;flex-direction:column;gap:20px;overflow-y:auto;max-height:calc(100vh - 180px);padding-right:2px; }
    .section { display:flex;flex-direction:column;gap:8px; }
    .label { margin:0;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#5a5870; }
    .count { font-weight:400;letter-spacing:0;text-transform:none;color:#9997b0; }
    .color-lbl { font-weight:400;letter-spacing:0;text-transform:none;color:#9997b0; }

    /* Gender tabs */
    .gender-tabs { display:flex;gap:5px; }
    .gtab { flex:1;padding:9px 0;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:#9997b0;font-size:13px;cursor:pointer;transition:all .2s; }
    .gtab:hover { border-color:rgba(201,169,110,.3);color:#c9a96e; }
    .gtab.active { background:rgba(201,169,110,.12);border-color:rgba(201,169,110,.45);color:#c9a96e;font-weight:600; }

    /* Chips */
    .chips { display:flex;flex-wrap:wrap;gap:5px; }
    .chip { padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:transparent;color:#9997b0;font-size:12px;cursor:pointer;transition:all .2s; }
    .chip:hover { border-color:rgba(201,169,110,.3);color:#c9a96e; }
    .chip.active { background:rgba(201,169,110,.12);border-color:rgba(201,169,110,.4);color:#c9a96e; }

    /* Styles grid */
    .styles-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:6px; }
    .scard { position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;padding:7px 4px;border-radius:12px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);cursor:pointer;transition:all .2s; }
    .scard:hover { border-color:rgba(201,169,110,.28);background:rgba(201,169,110,.04); }
    .scard.active { border-color:rgba(201,169,110,.6);background:rgba(201,169,110,.08); }
    .prev-wrap { width:68px;height:68px;border-radius:8px;overflow:hidden;background:#0f0f1a; }
    .prev-wrap canvas { display:block; }
    .sname { font-size:10px;color:#9997b0;text-align:center;line-height:1.3; }
    .scard.active .sname { color:#c9a96e; }
    .sdot { position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;background:#c9a96e; }

    /* Colors */
    .color-row { display:flex;flex-wrap:wrap;gap:7px; }
    .cswatch { width:30px;height:30px;border-radius:7px;border:2px solid transparent;cursor:pointer;transition:all .2s;padding:0;display:flex;align-items:center;justify-content:center; }
    .cswatch:hover { transform:scale(1.12); }
    .cswatch.active { border-color:#c9a96e;box-shadow:0 0 0 2px rgba(201,169,110,.3);transform:scale(1.12); }

    /* Tip */
    .tip { display:flex;align-items:flex-start;gap:8px;padding:12px 14px;border-radius:10px;background:rgba(201,169,110,.05);border:1px solid rgba(201,169,110,.14); }
    .tip span { font-size:12px;color:#9997b0;line-height:1.55; }

    @media (max-width:900px) {
      .layout { grid-template-columns:1fr; }
      .controls { max-height:none;overflow-y:visible; }
    }
  `],
})
export class HairstyleTryonComponent implements AfterViewInit {
  @ViewChild('photoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput')   fileRef!:   ElementRef<HTMLInputElement>;
  private cdr = inject(ChangeDetectorRef);

  processing   = signal(false);
  imageLoaded  = signal(false);
  faceDetected = signal(false);
  statusMsg    = signal('Procesando...');
  selStyle     = signal<Style | null>(null);
  selColor     = signal('#2d1a0e');
  selGender    = signal<'hombre'|'mujer'|'todos'>('hombre');
  selCat       = signal<string>('todos');

  private originalImage: HTMLImageElement | null = null;
  private fm: FM | null = null;
  private modelsLoaded = false;

  readonly genders = [
    { l:'Hombre', v:'hombre' as const },
    { l:'Mujer',  v:'mujer'  as const },
    { l:'Todos',  v:'todos'  as const },
  ];
  readonly cats = [
    { l:'Todos',    v:'todos'    },
    { l:'Corto',    v:'corto'    },
    { l:'Medio',    v:'medio'    },
    { l:'Largo',    v:'largo'    },
    { l:'Especial', v:'especial' },
  ];
  readonly colors = COLORS;

  selColorLabel = computed(() => COLORS.find(c => c.value === this.selColor())?.label ?? '');

  filteredStyles = computed(() => {
    const g = this.selGender(); const c = this.selCat();
    return STYLES.filter(s =>
      (g === 'todos' || s.gender.includes(g as Gender)) &&
      (c === 'todos' || s.category === c)
    );
  });

  ngAfterViewInit(): void { setTimeout(() => this.renderPreviews(), 120); }

  setGender(v: 'hombre'|'mujer'|'todos'): void {
    this.selGender.set(v); this.selCat.set('todos');
    setTimeout(() => this.renderPreviews(), 60);
  }

  setColor(v: string): void {
    this.selColor.set(v);
    setTimeout(() => this.renderPreviews(), 10);
    if (this.selStyle()) this.redraw();
  }

  applyStyle(s: Style): void { this.selStyle.set(s); this.redraw(); }

  resetToOriginal(): void {
    if (!this.originalImage) return;
    this.drawBase(this.originalImage); this.selStyle.set(null);
  }

  triggerUpload(): void { this.fileRef.nativeElement.click(); }

  async loadFile(evt: Event): Promise<void> {
    const file = (evt.target as HTMLInputElement).files?.[0];
    if (!file) return;
    (evt.target as HTMLInputElement).value = '';

    this.processing.set(true); this.statusMsg.set('Leyendo imagen...');
    this.cdr.markForCheck();

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        this.originalImage = img;
        this.drawBase(img);             // draw image first (fixes size)
        this.statusMsg.set('Detectando rostro con IA...');
        this.cdr.markForCheck();
        await this.detectFace(img);
        this.imageLoaded.set(true);
        this.processing.set(false);
        if (this.selStyle()) this.redraw();
        setTimeout(() => this.renderPreviews(), 60);
        this.cdr.markForCheck();
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  }

  private drawBase(img: HTMLImageElement): void {
    const canvas = this.canvasRef.nativeElement;
    const maxW = 720;
    const scale = Math.min(1, maxW / img.naturalWidth);
    canvas.width  = Math.round(img.naturalWidth  * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
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
      const sx = canvas.width / img.naturalWidth;
      const sy = canvas.height / img.naturalHeight;
      const det = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize:416, scoreThreshold:.36 }))
        .withFaceLandmarks();
      if (!det) { this.fallbackMetrics(); return; }
      this.faceDetected.set(true);
      const lms = det.landmarks.positions;
      const box = det.detection.box;
      const fw = box.width * sx; const fh = box.height * sy;
      const cx = (box.x + box.width/2) * sx;
      const browY = Math.min(...[17,18,19,20,21,22,23,24,25,26].map(i => lms[i].y)) * sy;
      this.fm = {
        cx, fw, fh,
        fy: browY - fh * .03,
        ht: browY - fh * .38,
        lx: lms[0].x * sx, rx: lms[16].x * sx,
        ch: lms[8].y * sy,
      };
    } catch { this.fallbackMetrics(); }
  }

  private fallbackMetrics(): void {
    this.faceDetected.set(false);
    const c = this.canvasRef.nativeElement;
    const cx = c.width/2; const fw = c.width*.42; const fh = c.height*.52;
    const fy = c.height*.15 + fh*.12;
    this.fm = { cx, fw, fh, fy, ht: fy - fh*.34, lx: cx-fw/2, rx: cx+fw/2, ch: c.height*.15 + fh };
  }

  private redraw(): void {
    if (!this.originalImage || !this.fm) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);

    const style = this.selStyle();
    if (!style) return;

    // ── Phase 1: Pixel hair recoloring ────────────────────────────────────
    const f = this.fm;
    this.recolorZone(ctx, canvas, this.selColor(), {
      top:   Math.max(0, f.ht - f.fh * .12),
      bot:   f.fy + f.fh * .05,
      left:  Math.max(0, f.lx - f.fw * .38),
      right: Math.min(canvas.width, f.rx + f.fw * .38),
    });

    // ── Phase 2: Canvas-drawn style with strand rendering ─────────────────
    ctx.save();
    ctx.globalAlpha = .94;
    style.render(ctx, f, this.selColor());
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private recolorZone(
    ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
    col: string,
    z: { top: number; bot: number; left: number; right: number },
  ): void {
    const [nr,ng,nb] = hexRgb(col);
    const t=Math.round(z.top), b=Math.round(z.bot), l=Math.round(z.left), r=Math.round(z.right);
    const w=r-l; const h=b-t;
    if (w<=0||h<=0) return;
    const id = ctx.getImageData(l,t,w,h); const d = id.data;
    for (let i=0; i<d.length; i+=4) {
      const br = (d[i]+d[i+1]+d[i+2])/3;
      if (br>205 || br<10) continue;       // skip bright bg + deep shadows
      const str = Math.min(.92, (205-br)/180 * .95);  // darker pixel = stronger recolor
      d[i]  = Math.round(d[i]  *(1-str) + nr*str);
      d[i+1]= Math.round(d[i+1]*(1-str) + ng*str);
      d[i+2]= Math.round(d[i+2]*(1-str) + nb*str);
    }
    ctx.putImageData(id,l,t);
  }

  download(): void {
    const a = document.createElement('a');
    a.download = 'barber-ai-hairstyle.png';
    a.href = this.canvasRef.nativeElement.toDataURL('image/png');
    a.click();
  }

  /** Render a mini preview of every hairstyle into its thumbnail canvas */
  renderPreviews(): void {
    for (const style of STYLES) {
      const el = document.getElementById('pv-' + style.id) as HTMLCanvasElement | null;
      if (!el) continue;
      const ctx = el.getContext('2d'); if (!ctx) continue;
      // Background
      ctx.fillStyle = '#0e0e1a'; ctx.fillRect(0,0,68,68);
      // Face silhouette
      ctx.fillStyle = '#c8a07055';
      ctx.beginPath(); ctx.ellipse(34,42,16,20,0,0,Math.PI*2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#c8c0b0';
      ctx.beginPath(); ctx.ellipse(27,37,3,2,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(41,37,3,2,0,0,Math.PI*2); ctx.fill();
      // Nose
      ctx.strokeStyle = '#c8a07055'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(34,39); ctx.lineTo(31,44); ctx.lineTo(37,44); ctx.stroke();
      // Hair
      const fm: FM = { cx:34, fy:28, ht:10, lx:19, rx:49, ch:62, fw:30, fh:34 };
      try { style.render(ctx, fm, this.selColor()); } catch { /* ignore */ }
    }
    this.cdr.markForCheck();
  }
}
