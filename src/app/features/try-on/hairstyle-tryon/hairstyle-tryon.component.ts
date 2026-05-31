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

interface HairstyleOption {
  id: string;
  name: string;
  category: 'short' | 'medium' | 'long' | 'curly' | 'fade';
  svgPath: string;
  color: string;
  anchorY: number;
  widthMultiplier: number;
  heightMultiplier: number;
}

const HAIRSTYLES: HairstyleOption[] = [
  {
    id: 'waves-long',
    name: 'Ondas Largas',
    category: 'long',
    svgPath:
      'M50,0 C30,-10 10,20 5,60 C0,100 5,140 15,180 C25,220 20,260 30,300 C40,340 60,360 80,370 C100,380 120,370 140,360 C160,350 170,320 165,280 C160,240 155,200 165,160 C175,120 180,80 175,40 C170,0 150,-10 130,0 C110,10 100,20 100,0 C100,20 90,10 70,0 Z',
    color: '#3d2b1f',
    anchorY: -0.15,
    widthMultiplier: 1.4,
    heightMultiplier: 2.2,
  },
  {
    id: 'bob-straight',
    name: 'Bob Liso',
    category: 'short',
    svgPath:
      'M10,0 C0,20 0,60 5,100 C10,130 20,150 30,155 C50,160 70,162 100,162 C130,162 150,160 170,155 C180,150 190,130 195,100 C200,60 200,20 190,0 Z',
    color: '#2d1b0e',
    anchorY: -0.12,
    widthMultiplier: 1.2,
    heightMultiplier: 0.9,
  },
  {
    id: 'curly-voluminous',
    name: 'Rizado Voluminoso',
    category: 'curly',
    svgPath:
      'M20,10 C-10,10 -20,40 -10,70 C-5,90 5,100 0,120 C-5,140 10,160 20,155 C10,170 20,200 40,195 C30,210 50,240 70,230 C65,250 90,270 110,255 C110,270 135,280 145,260 C150,275 170,270 165,250 C185,255 195,235 180,215 C200,210 205,185 185,175 C195,155 190,130 175,125 C185,100 180,75 160,70 C175,45 165,15 140,15 C135,-5 105,-15 95,5 C80,-15 50,-15 45,5 C35,-5 15,0 20,10 Z',
    color: '#1a1008',
    anchorY: -0.25,
    widthMultiplier: 1.6,
    heightMultiplier: 1.4,
  },
  {
    id: 'pixie',
    name: 'Pixie Cut',
    category: 'short',
    svgPath:
      'M20,0 C5,5 0,25 5,50 C10,70 25,80 40,82 C60,84 80,84 100,82 C115,80 130,70 135,50 C140,25 135,5 120,0 C105,-5 90,5 80,8 C70,5 60,-2 50,0 C40,2 30,-5 20,0 Z',
    color: '#5c3d1e',
    anchorY: -0.08,
    widthMultiplier: 1.1,
    heightMultiplier: 0.5,
  },
  {
    id: 'fade-high',
    name: 'Fade Alto',
    category: 'fade',
    svgPath:
      'M30,0 C15,0 5,10 2,30 C0,50 5,70 15,80 C10,90 15,100 25,100 C35,100 40,95 50,95 C60,95 65,100 75,100 C85,100 90,90 85,80 C95,70 100,50 98,30 C95,10 85,0 70,0 Z',
    color: '#1a0f08',
    anchorY: -0.05,
    widthMultiplier: 1.05,
    heightMultiplier: 0.55,
  },
  {
    id: 'braids',
    name: 'Trenzas Largas',
    category: 'long',
    svgPath:
      'M40,0 C25,0 10,20 5,50 C0,80 5,120 10,160 C15,200 10,240 20,280 C30,310 45,330 55,340 L60,340 C70,330 85,310 95,280 C105,240 100,200 105,160 C110,120 115,80 110,50 C105,20 90,0 75,0 C65,0 55,10 57.5,0 C60,10 50,0 40,0 Z',
    color: '#2d1b0e',
    anchorY: -0.12,
    widthMultiplier: 0.8,
    heightMultiplier: 2.5,
  },
];

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
            <p class="scan-text">Detectando rostro con IA...</p>
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
                <p>Sube tu foto para comenzar</p>
                <span class="upload-hint">JPG, PNG hasta 10MB</span>
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
                Descargar
              </button>
            }
          </div>
          <input #fileInput type="file" accept="image/*" style="display:none" (change)="loadFile($event)">
        </div>

        <div class="controls-panel">
          <div class="section">
            <h3 class="section-title">Estilo</h3>
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
            <div class="styles-grid">
              @for (style of filteredStyles(); track style.id) {
                <button
                  class="style-card"
                  [class.selected]="selectedStyle()?.id === style.id"
                  (click)="applyStyle(style)">
                  <div class="style-preview">
                    <svg viewBox="0 0 200 200" width="60" height="60">
                      <ellipse cx="100" cy="130" rx="45" ry="55" fill="rgba(255,255,255,0.05)"/>
                      <path [attr.d]="style.svgPath" [attr.fill]="selectedColor()" opacity="0.9" transform="scale(0.6) translate(60,10)"/>
                    </svg>
                  </div>
                  <span class="style-name">{{ style.name }}</span>
                </button>
              }
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Color del cabello</h3>
            <div class="color-row">
              @for (c of colors; track c.value) {
                <button
                  class="color-dot"
                  [style.background]="c.value"
                  [class.selected]="selectedColor() === c.value"
                  [title]="c.label"
                  (click)="changeColor(c.value)">
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hairstyle-container { position: relative; padding: 0 24px 40px; }
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
    .styles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .style-card {
      display: flex; flex-direction: column; align-items: center;
      gap: 6px; padding: 12px 8px; border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
      cursor: pointer; transition: all 0.2s;
    }
    .style-card:hover { border-color: rgba(201,169,110,0.25); background: rgba(201,169,110,0.04); }
    .style-card.selected { border-color: rgba(201,169,110,0.6); background: rgba(201,169,110,0.08); }
    .style-preview { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
    .style-name { font-size: 11px; color: #9997b0; text-align: center; }
    .style-card.selected .style-name { color: #c9a96e; }
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
export class HairstyleTryonComponent {
  @ViewChild('photoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);

  imageLoaded = signal(false);
  processing = signal(false);
  selectedStyle = signal<HairstyleOption | null>(null);
  selectedColor = signal('#3d2b1f');
  activeCategory = signal<string>('all');

  private modelsLoaded = false;
  private originalImage: HTMLImageElement | null = null;
  private faceBox: { x: number; y: number; w: number; h: number } | null = null;

  readonly hairstyles = HAIRSTYLES;

  readonly categories = [
    { label: 'Todos', value: 'all' },
    { label: 'Corto', value: 'short' },
    { label: 'Medio', value: 'medium' },
    { label: 'Largo', value: 'long' },
    { label: 'Rizado', value: 'curly' },
    { label: 'Fade', value: 'fade' },
  ];

  readonly colors = [
    { label: 'Negro', value: '#1a0a04' },
    { label: 'Castaño oscuro', value: '#3d2b1f' },
    { label: 'Castaño', value: '#6b3d1e' },
    { label: 'Rubio oscuro', value: '#8b6532' },
    { label: 'Rubio', value: '#c8a04a' },
    { label: 'Rojo', value: '#8b2500' },
    { label: 'Gris', value: '#6b6b6b' },
    { label: 'Blanco', value: '#e8e0d0' },
  ];

  filteredStyles(): HairstyleOption[] {
    const cat = this.activeCategory();
    if (cat === 'all') return HAIRSTYLES;
    return HAIRSTYLES.filter((s) => s.category === cat);
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
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      this.modelsLoaded = true;
    }
    const det = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    if (det) {
      const { x, y, width: w, height: h } = det.detection.box;
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

  applyStyle(style: HairstyleOption): void {
    this.selectedStyle.set(style);
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

    const style = this.selectedStyle();
    const face = this.faceBox;
    if (!style || !face) return;

    const scaleFactor = canvas.width / this.originalImage.naturalWidth;
    const faceX = face.x * scaleFactor;
    const faceY = face.y * scaleFactor;
    const faceW = face.w * scaleFactor;
    const faceH = face.h * scaleFactor;

    const hairW = faceW * style.widthMultiplier;
    const hairH = hairW * style.heightMultiplier;
    const hairX = faceX + (faceW - hairW) / 2;
    const hairY = faceY + faceH * style.anchorY;

    const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400" width="${hairW}" height="${hairH}"><path d="${style.svgPath}" fill="${this.selectedColor()}" opacity="0.92"/></svg>`;
    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const svgImg = new Image();
    svgImg.onload = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(svgImg, hairX, hairY, hairW, hairH);
      URL.revokeObjectURL(svgUrl);
    };
    svgImg.src = svgUrl;
  }

  download(): void {
    const canvas = this.canvasRef.nativeElement;
    const link = document.createElement('a');
    link.download = 'hairstyle-tryon.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
