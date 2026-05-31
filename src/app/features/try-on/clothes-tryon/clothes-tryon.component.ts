import {
  Component,
  signal,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as faceapi from 'face-api.js';

interface ClothingItem {
  id: string;
  name: string;
  category: 'casual' | 'formal' | 'sport' | 'elegant';
  emoji: string;
  svgTemplate: string;
  anchorType: 'chest' | 'full-body';
  colors: string[];
}

const CLOTHING_ITEMS: ClothingItem[] = [
  {
    id: 'tshirt-white',
    name: 'Camiseta Casual',
    category: 'casual',
    emoji: '👕',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180" width="{W}" height="{H}">
      <path d="M60,10 L20,40 L40,55 L40,170 L160,170 L160,55 L180,40 L140,10 Q120,0 100,0 Q80,0 60,10Z" fill="{COLOR}" opacity="0.93"/>
      <path d="M60,10 Q80,30 100,28 Q120,30 140,10" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
    </svg>`,
    anchorType: 'chest',
    colors: ['#ffffff', '#1a1a2e', '#2d4a7a', '#8b2500', '#2d5a2d'],
  },
  {
    id: 'blazer-black',
    name: 'Blazer Negro',
    category: 'formal',
    emoji: '🧥',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 190" width="{W}" height="{H}">
      <path d="M55,5 L10,45 L35,60 L35,185 L165,185 L165,60 L190,45 L145,5 L115,25 L100,20 L85,25 Z" fill="{COLOR}" opacity="0.95"/>
      <path d="M100,20 L100,185" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      <path d="M55,5 L85,25 L100,20 L115,25 L145,5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
      <rect x="88" y="80" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/>
      <rect x="88" y="90" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/>
    </svg>`,
    anchorType: 'chest',
    colors: ['#1a1a1a', '#1e2d4a', '#2d1a0e', '#1a2d1a', '#3d2b1f'],
  },
  {
    id: 'denim-jacket',
    name: 'Chaqueta Denim',
    category: 'casual',
    emoji: '🧥',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 185" width="{W}" height="{H}">
      <path d="M58,8 L12,48 L38,62 L38,180 L162,180 L162,62 L188,48 L142,8 L118,28 L100,22 L82,28 Z" fill="{COLOR}" opacity="0.93"/>
      <path d="M58,8 L82,28 L100,22 L118,28 L142,8" fill="{COLOR_DARK}" opacity="0.5"/>
      <line x1="100" y1="22" x2="100" y2="180" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <rect x="55" y="70" width="30" height="20" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    </svg>`,
    anchorType: 'chest',
    colors: ['#2d4a7a', '#1a2d5a', '#0e1a3d', '#3a5a8a', '#4a6a9a'],
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    category: 'casual',
    emoji: '🧥',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="{W}" height="{H}">
      <path d="M55,15 C30,20 10,50 12,60 L38,70 L38,195 L162,195 L162,70 L188,60 C190,50 170,20 145,15 C130,5 115,0 100,0 C85,0 70,5 55,15Z" fill="{COLOR}" opacity="0.94"/>
      <path d="M55,15 C70,25 85,30 100,28 C115,30 130,25 145,15" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      <ellipse cx="100" cy="15" rx="18" ry="12" fill="{COLOR}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <line x1="100" y1="28" x2="100" y2="195" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    </svg>`,
    anchorType: 'chest',
    colors: ['#2d2d3a', '#1a1a2e', '#2d1a0e', '#0e2d1a', '#3a2d0e'],
  },
  {
    id: 'dress-shirt',
    name: 'Camisa Elegante',
    category: 'elegant',
    emoji: '👔',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 185" width="{W}" height="{H}">
      <path d="M62,8 L18,42 L40,56 L40,180 L160,180 L160,56 L182,42 L138,8 L115,22 L100,18 L85,22 Z" fill="{COLOR}" opacity="0.94"/>
      <path d="M100,18 L100,180" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/>
      <circle cx="100" cy="40" r="3" fill="rgba(0,0,0,0.2)"/>
      <circle cx="100" cy="58" r="3" fill="rgba(0,0,0,0.2)"/>
      <circle cx="100" cy="76" r="3" fill="rgba(0,0,0,0.2)"/>
      <path d="M85,22 L100,18 L115,22" fill="rgba(255,255,255,0.3)" opacity="0.5"/>
    </svg>`,
    anchorType: 'chest',
    colors: ['#f5f5f0', '#e8e4d4', '#d4e8d4', '#d4d4e8', '#e8d4d4'],
  },
  {
    id: 'polo-striped',
    name: 'Polo Rayas',
    category: 'casual',
    emoji: '👕',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 175" width="{W}" height="{H}">
      <path d="M62,10 L22,42 L42,56 L42,170 L158,170 L158,56 L178,42 L138,10 Q120,2 100,2 Q80,2 62,10Z" fill="{COLOR}" opacity="0.93"/>
      <clipPath id="shirt-clip-{ID}"><path d="M62,10 L22,42 L42,56 L42,170 L158,170 L158,56 L178,42 L138,10 Q120,2 100,2 Q80,2 62,10Z"/></clipPath>
      <g clip-path="url(#shirt-clip-{ID})">
        <rect x="0" y="50" width="200" height="8" fill="rgba(255,255,255,0.15)"/>
        <rect x="0" y="70" width="200" height="8" fill="rgba(255,255,255,0.15)"/>
        <rect x="0" y="90" width="200" height="8" fill="rgba(255,255,255,0.15)"/>
        <rect x="0" y="110" width="200" height="8" fill="rgba(255,255,255,0.15)"/>
        <rect x="0" y="130" width="200" height="8" fill="rgba(255,255,255,0.15)"/>
        <rect x="0" y="150" width="200" height="8" fill="rgba(255,255,255,0.15)"/>
      </g>
      <path d="M84,10 Q100,18 116,10" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    </svg>`,
    anchorType: 'chest',
    colors: ['#2d4a7a', '#8b2500', '#1a1a2e', '#2d5a2d', '#5a2d5a'],
  },
  {
    id: 'suit-jacket',
    name: 'Traje',
    category: 'formal',
    emoji: '🤵',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 195" width="{W}" height="{H}">
      <path d="M52,6 L8,46 L32,62 L32,190 L168,190 L168,62 L192,46 L148,6 L118,28 L100,22 L82,28 Z" fill="{COLOR}" opacity="0.96"/>
      <path d="M100,22 L85,38 L75,190" fill="{COLOR_LIGHT}" opacity="0.7"/>
      <path d="M100,22 L115,38 L125,190" fill="{COLOR_LIGHT}" opacity="0.7"/>
      <path d="M52,6 L82,28 L100,22 L118,28 L148,6" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
      <rect x="90" y="95" width="20" height="16" rx="2" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
    </svg>`,
    anchorType: 'chest',
    colors: ['#1a1a2e', '#0e1a0e', '#1e1a0e', '#2e1a1a', '#1a1e2e'],
  },
  {
    id: 'turtleneck',
    name: 'Cuello Alto',
    category: 'elegant',
    emoji: '🧥',
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 190" width="{W}" height="{H}">
      <path d="M55,25 L15,55 L38,68 L38,185 L162,185 L162,68 L185,55 L145,25 C130,8 115,0 100,0 C85,0 70,8 55,25Z" fill="{COLOR}" opacity="0.94"/>
      <path d="M68,25 C80,18 90,16 100,16 C110,16 120,18 132,25 C120,30 110,32 100,32 C90,32 80,30 68,25Z" fill="{COLOR_DARK}" opacity="0.6"/>
    </svg>`,
    anchorType: 'chest',
    colors: ['#1a1a1a', '#f0efe8', '#2d1a0e', '#0e1a2d', '#1a2d0e'],
  },
];

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
              <path d="M28 35 L28 55 L52 55 L52 35 Q40 28 28 35Z" fill="#c9a96e" opacity="0.5"/>
            </svg>
            <p class="scan-text">Analizando postura...</p>
          </div>
        </div>
      }

      <div class="layout">
        <div class="canvas-panel">
          <div class="canvas-wrapper">
            @if (!imageLoaded()) {
              <div class="upload-placeholder" (click)="fileInputRef.nativeElement.click()">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#c9a96e" stroke-width="1.5"/>
                  <polyline points="17 8 12 3 7 8" stroke="#c9a96e" stroke-width="1.5"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="#c9a96e" stroke-width="1.5"/>
                </svg>
                <p>Sube tu foto para probar ropa</p>
                <span class="upload-hint">Mejor con foto de cuerpo completo</span>
              </div>
            }
            <canvas #photoCanvas [style.display]="imageLoaded() ? 'block' : 'none'"></canvas>
          </div>

          <div class="canvas-actions">
            <button class="btn-secondary" (click)="fileInputRef.nativeElement.click()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="1.5"/></svg>
              Subir foto
            </button>
            @if (imageLoaded()) {
              <button class="btn-primary" (click)="download()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="1.5"/></svg>
                Guardar Look
              </button>
            }
          </div>
          <input #fileInput type="file" accept="image/*" style="display:none" (change)="loadFile($event)">
        </div>

        <div class="controls-panel">
          <div class="section">
            <h3 class="section-title">Categoría</h3>
            <div class="cat-tabs">
              @for (cat of categories; track cat.value) {
                <button
                  class="cat-tab"
                  [class.active]="activeCategory() === cat.value"
                  (click)="activeCategory.set(cat.value)">
                  {{ cat.label }}
                </button>
              }
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Prendas</h3>
            <div class="items-grid">
              @for (item of filteredItems(); track item.id) {
                <button
                  class="item-card"
                  [class.selected]="selectedItem()?.id === item.id"
                  (click)="applyItem(item)">
                  <div class="item-preview">
                    <span class="item-emoji">{{ item.emoji }}</span>
                  </div>
                  <span class="item-name">{{ item.name }}</span>
                </button>
              }
            </div>
          </div>

          @if (selectedItem()) {
            <div class="section">
              <h3 class="section-title">Color</h3>
              <div class="color-row">
                @for (c of selectedItem()!.colors; track c) {
                  <button
                    class="color-dot"
                    [style.background]="c"
                    [class.selected]="selectedColor() === c"
                    (click)="changeColor(c)">
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clothes-container { position: relative; padding: 0 24px 40px; }
    .processing-overlay {
      position: fixed; inset: 0;
      background: rgba(8,8,16,0.85); z-index: 200;
      display: flex; align-items: center; justify-content: center;
    }
    .scanner-anim {
      display: flex; flex-direction: column; align-items: center;
      gap: 16px; position: relative;
    }
    .scanner-bar {
      position: absolute; top: 0; left: -10px; right: -10px; height: 2px;
      background: linear-gradient(90deg, transparent, #c9a96e, transparent);
      animation: scan 1.8s ease-in-out infinite;
    }
    @keyframes scan { 0%,100% { top:0; opacity:1; } 50% { top:80px; opacity:0.6; } }
    .scan-text { color: #c9a96e; font-size: 14px; margin: 0; }
    .layout {
      display: grid; grid-template-columns: 1fr 340px;
      gap: 24px; max-width: 1100px; margin: 0 auto;
    }
    .canvas-panel { display: flex; flex-direction: column; gap: 12px; }
    .canvas-wrapper {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.07); border-radius: 16px;
      overflow: hidden; min-height: 400px;
      display: flex; align-items: center; justify-content: center;
    }
    canvas { max-width: 100%; display: block; border-radius: 16px; }
    .upload-placeholder {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 60px 40px; cursor: pointer;
      color: #9997b0; transition: color 0.2s;
    }
    .upload-placeholder:hover { color: #c9a96e; }
    .upload-placeholder p { margin: 0; font-size: 15px; }
    .upload-hint { font-size: 12px; color: #5a5870; }
    .canvas-actions { display: flex; gap: 10px; }
    .btn-secondary {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.04); color: #9997b0;
      font-size: 13px; cursor: pointer; transition: all 0.2s;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.08); color: #f0eff4; }
    .btn-primary {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #c9a96e, #a07840);
      color: #080810; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .controls-panel { display: flex; flex-direction: column; gap: 20px; }
    .section { display: flex; flex-direction: column; gap: 12px; }
    .section-title {
      font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; color: #5a5870; margin: 0;
    }
    .cat-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
    .cat-tab {
      padding: 6px 14px; border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.08);
      background: transparent; color: #9997b0;
      font-size: 12px; cursor: pointer; transition: all 0.2s;
    }
    .cat-tab:hover { border-color: rgba(201,169,110,0.3); color: #c9a96e; }
    .cat-tab.active { background: rgba(201,169,110,0.12); border-color: rgba(201,169,110,0.4); color: #c9a96e; }
    .items-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .item-card {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 14px 8px; border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
      cursor: pointer; transition: all 0.2s;
    }
    .item-card:hover { border-color: rgba(201,169,110,0.25); background: rgba(201,169,110,0.04); }
    .item-card.selected { border-color: rgba(201,169,110,0.6); background: rgba(201,169,110,0.08); }
    .item-preview { font-size: 32px; line-height: 1; }
    .item-emoji { display: block; }
    .item-name { font-size: 11px; color: #9997b0; text-align: center; }
    .item-card.selected .item-name { color: #c9a96e; }
    .color-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .color-dot {
      width: 28px; height: 28px; border-radius: 50%;
      border: 2px solid transparent; cursor: pointer;
      transition: all 0.2s; padding: 0;
    }
    .color-dot:hover { transform: scale(1.15); }
    .color-dot.selected { border-color: #c9a96e; transform: scale(1.15); box-shadow: 0 0 0 2px rgba(201,169,110,0.3); }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
  `],
})
export class ClothesTryonComponent {
  @ViewChild('photoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);

  imageLoaded = signal(false);
  processing = signal(false);
  selectedItem = signal<ClothingItem | null>(null);
  selectedColor = signal('#1a1a1a');
  activeCategory = signal<string>('all');

  private modelsLoaded = false;
  private originalImage: HTMLImageElement | null = null;
  private faceBox: { x: number; y: number; w: number; h: number } | null = null;

  readonly categories = [
    { label: 'Todos', value: 'all' },
    { label: 'Casual', value: 'casual' },
    { label: 'Formal', value: 'formal' },
    { label: 'Sport', value: 'sport' },
    { label: 'Elegante', value: 'elegant' },
  ];

  filteredItems(): ClothingItem[] {
    const cat = this.activeCategory();
    if (cat === 'all') return CLOTHING_ITEMS;
    return CLOTHING_ITEMS.filter((i) => i.category === cat);
  }

  async loadFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.processing.set(true);
    this.cdr.markForCheck();

    const img = new Image();
    img.onload = async () => {
      this.originalImage = img;
      await this.detectFace(img);
      this.drawBase();
      this.imageLoaded.set(true);
      this.processing.set(false);
      this.cdr.markForCheck();
    };
    img.src = URL.createObjectURL(file);
  }

  private async detectFace(img: HTMLImageElement): Promise<void> {
    if (!this.modelsLoaded) {
      const MODEL_URL =
        'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      this.modelsLoaded = true;
    }
    const det = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions());
    if (det) {
      const { x, y, width: w, height: h } = det.box;
      this.faceBox = { x, y, w, h };
    }
  }

  private drawBase(): void {
    if (!this.originalImage || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const maxW = canvas.parentElement?.clientWidth ?? 600;
    const scale = Math.min(1, maxW / this.originalImage.naturalWidth);
    canvas.width = this.originalImage.naturalWidth * scale;
    canvas.height = this.originalImage.naturalHeight * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);
  }

  applyItem(item: ClothingItem): void {
    this.selectedItem.set(item);
    this.selectedColor.set(item.colors[0]);
    this.redraw();
  }

  changeColor(color: string): void {
    this.selectedColor.set(color);
    this.redraw();
  }

  private redraw(): void {
    if (!this.originalImage) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);

    const item = this.selectedItem();
    const face = this.faceBox;
    if (!item || !face) return;

    const scaleFactor = canvas.width / this.originalImage.naturalWidth;
    const faceX = face.x * scaleFactor;
    const faceY = face.y * scaleFactor;
    const faceW = face.w * scaleFactor;
    const faceH = face.h * scaleFactor;

    // Estimate shoulder/chest position from face
    const shirtW = faceW * 1.85;
    const shirtH = shirtW * 0.95;
    const shirtX = faceX + (faceW - shirtW) / 2;
    const shirtY = faceY + faceH * 1.15; // just below chin

    const color = this.selectedColor();
    // Derive slightly darker/lighter variants for multi-tone SVGs
    const colorDark = this.darkenColor(color, 0.7);
    const colorLight = this.lightenColor(color, 1.3);

    const svgStr = item.svgTemplate
      .replace(/{W}/g, String(Math.round(shirtW)))
      .replace(/{H}/g, String(Math.round(shirtH)))
      .replace(/{COLOR_DARK}/g, colorDark)
      .replace(/{COLOR_LIGHT}/g, colorLight)
      .replace(/{COLOR}/g, color)
      .replace(/{ID}/g, item.id);

    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const svgImg = new Image();
    svgImg.onload = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(svgImg, shirtX, shirtY, shirtW, shirtH);
      URL.revokeObjectURL(svgUrl);
    };
    svgImg.src = svgUrl;
  }

  private darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const dr = Math.round(Math.min(255, r * factor));
    const dg = Math.round(Math.min(255, g * factor));
    const db = Math.round(Math.min(255, b * factor));
    return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
  }

  private lightenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lr = Math.round(Math.min(255, r * factor));
    const lg = Math.round(Math.min(255, g * factor));
    const lb = Math.round(Math.min(255, b * factor));
    return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
  }

  download(): void {
    const canvas = this.canvasRef.nativeElement;
    const link = document.createElement('a');
    link.download = 'look-tryon.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
