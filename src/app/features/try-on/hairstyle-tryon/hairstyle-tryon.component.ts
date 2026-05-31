import {
  Component, signal, computed, ViewChild, ElementRef,
  AfterViewInit, ChangeDetectionStrategy, inject, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as faceapi from 'face-api.js';
import { HairstyleRenderService } from '../../../core/services/hairstyle-render.service';
import { HAIRSTYLE_ASSETS } from '../../../core/data/hairstyles.data';
import { HairstyleAsset } from '../../../core/models/hairstyle-asset.model';

const CDN = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

type GenderFilter = 'todos' | 'male' | 'female' | 'unisex';
type CategoryFilter = 'todos' | 'short' | 'medium' | 'long';

@Component({
  selector: 'app-hairstyle-tryon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="tryon-wrap">

  <!-- ── Upload panel ──────────────────────────────────────────────────── -->
  <div class="upload-section">
    <label class="upload-zone" [class.has-image]="photoUrl()">
      @if (!photoUrl()) {
        <div class="upload-hint">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
            <polyline points="17 8 12 3 7 8" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="3" x2="12" y2="15" stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>Sube tu foto</span>
          <small>JPG, PNG · hasta 10 MB</small>
        </div>
      } @else {
        <img [src]="photoUrl()" class="preview-thumb" alt="foto"/>
      }
      <input type="file" accept="image/*" (change)="onFile($event)" hidden/>
    </label>
    @if (photoUrl()) {
      <button class="btn-ghost" (click)="clearPhoto()">Cambiar foto</button>
    }
  </div>

  <!-- ── Filter bar ─────────────────────────────────────────────────────── -->
  @if (photoUrl()) {
  <div class="filters">
    <div class="filter-group">
      @for (g of genderOptions; track g.value) {
        <button class="chip" [class.active]="genderFilter() === g.value" (click)="genderFilter.set(g.value)">
          {{ g.label }}
        </button>
      }
    </div>
    <div class="filter-group">
      @for (c of categoryOptions; track c.value) {
        <button class="chip" [class.active]="categoryFilter() === c.value" (click)="categoryFilter.set(c.value)">
          {{ c.label }}
        </button>
      }
    </div>
  </div>

  <!-- ── Style selector ────────────────────────────────────────────────── -->
  <div class="style-grid">
    @for (asset of filteredAssets(); track asset.id) {
      <button class="style-card" [class.selected]="selectedAsset()?.id === asset.id"
              (click)="selectAsset(asset)">
        <div class="style-thumb">
          <img [src]="asset.image" [alt]="asset.name" (error)="onImgError($event)"/>
        </div>
        <div class="style-info">
          <span class="style-name">{{ asset.nameEs }}</span>
          <span class="style-cat">{{ asset.category }}</span>
        </div>
      </button>
    }
  </div>

  <!-- ── Color picker ───────────────────────────────────────────────────── -->
  <div class="color-row">
    <span class="color-label">Color:</span>
    <div class="color-swatches">
      @for (c of colors; track c.hex) {
        <button class="swatch" [style.background]="c.hex" [class.active]="hairColor() === c.hex"
                [title]="c.name" (click)="hairColor.set(c.hex)"></button>
      }
    </div>
    <input type="color" class="custom-color" [value]="hairColor()" (input)="hairColor.set($any($event.target).value)"/>
  </div>

  <!-- ── Apply button ───────────────────────────────────────────────────── -->
  <div class="apply-row">
    <button class="btn-apply" [disabled]="!selectedAsset() || applying()"
            (click)="applyHairstyle()">
      @if (applying()) {
        <span class="spinner"></span> Procesando…
      } @else {
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#080810"/>
        </svg>
        Aplicar peinado
      }
    </button>
    @if (resultReady()) {
      <button class="btn-download" (click)="download()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="1.8"/>
          <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="1.8"/>
          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="1.8"/>
        </svg>
        Descargar
      </button>
    }
  </div>

  <!-- ── Status / error ─────────────────────────────────────────────────── -->
  @if (statusMsg()) {
    <div class="status-bar" [class.error]="isError()">{{ statusMsg() }}</div>
  }

  <!-- ── Before / After canvases ───────────────────────────────────────── -->
  @if (resultReady()) {
  <div class="compare-section">
    <div class="compare-panel">
      <div class="compare-label">ANTES</div>
      <canvas #beforeCanvas class="compare-canvas"></canvas>
    </div>
    <div class="compare-divider">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M15 7l5 5-5 5" stroke="#c9a96e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="compare-panel">
      <div class="compare-label">DESPUÉS</div>
      <canvas #afterCanvas class="compare-canvas"></canvas>
    </div>
  </div>

  <!-- Style info card -->
  @if (selectedAsset()) {
  <div class="style-detail-card">
    <div class="style-detail-name">{{ selectedAsset()!.nameEs }}</div>
    <div class="style-detail-desc">{{ selectedAsset()!.description }}</div>
    <div class="style-tags">
      @for (tag of selectedAsset()!.tags; track tag) {
        <span class="tag">{{ tag }}</span>
      }
    </div>
  </div>
  }
  }

  }<!-- end if photoUrl -->
</div>
  `,
  styles: [`
    .tryon-wrap { max-width: 860px; margin: 0 auto; padding: 0 20px 60px; }

    /* Upload */
    .upload-section { display:flex; flex-direction:column; align-items:center; gap:12px; margin-bottom:28px; }
    .upload-zone {
      display:flex; align-items:center; justify-content:center;
      width:100%; max-width:420px; height:200px;
      border:2px dashed rgba(201,169,110,0.3); border-radius:16px;
      background:rgba(255,255,255,0.02); cursor:pointer;
      transition:border-color .2s, background .2s; position:relative; overflow:hidden;
    }
    .upload-zone:hover { border-color:rgba(201,169,110,0.6); background:rgba(201,169,110,0.04); }
    .upload-zone.has-image { border-style:solid; height:auto; padding:0; }
    .upload-hint { display:flex; flex-direction:column; align-items:center; gap:8px; color:#9997b0; }
    .upload-hint span { font-size:15px; font-weight:500; color:#c9a96e; }
    .upload-hint small { font-size:12px; }
    .preview-thumb { width:100%; max-width:420px; border-radius:16px; display:block; max-height:360px; object-fit:cover; }
    .btn-ghost {
      padding:7px 18px; border-radius:8px; border:1px solid rgba(255,255,255,0.12);
      background:transparent; color:#9997b0; font-size:13px; cursor:pointer;
    }
    .btn-ghost:hover { color:#f0eff4; border-color:rgba(255,255,255,0.24); }

    /* Filters */
    .filters { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px; }
    .filter-group { display:flex; gap:6px; }
    .chip {
      padding:5px 14px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);
      background:transparent; color:#9997b0; font-size:12px; cursor:pointer; transition:all .18s;
    }
    .chip:hover { color:#f0eff4; }
    .chip.active { background:rgba(201,169,110,0.15); color:#c9a96e; border-color:rgba(201,169,110,0.4); }

    /* Style grid */
    .style-grid {
      display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); gap:10px;
      margin-bottom:24px; max-height:340px; overflow-y:auto; padding-right:4px;
    }
    .style-grid::-webkit-scrollbar { width:4px; }
    .style-grid::-webkit-scrollbar-track { background:transparent; }
    .style-grid::-webkit-scrollbar-thumb { background:rgba(201,169,110,0.3); border-radius:2px; }
    .style-card {
      display:flex; flex-direction:column; align-items:center; gap:6px;
      padding:10px 6px; border-radius:12px; border:1.5px solid rgba(255,255,255,0.07);
      background:rgba(255,255,255,0.02); cursor:pointer; transition:all .18s;
    }
    .style-card:hover { border-color:rgba(201,169,110,0.35); background:rgba(201,169,110,0.05); }
    .style-card.selected { border-color:#c9a96e; background:rgba(201,169,110,0.1); }
    .style-thumb {
      width:72px; height:72px; border-radius:8px; overflow:hidden;
      background:#0f0f1a; display:flex; align-items:center; justify-content:center;
    }
    .style-thumb img { width:100%; height:100%; object-fit:contain; }
    .style-info { text-align:center; }
    .style-name { display:block; font-size:11px; font-weight:600; color:#f0eff4; }
    .style-cat { display:block; font-size:10px; color:#9997b0; text-transform:capitalize; margin-top:2px; }

    /* Color row */
    .color-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
    .color-label { font-size:13px; color:#9997b0; }
    .color-swatches { display:flex; gap:8px; flex-wrap:wrap; }
    .swatch {
      width:28px; height:28px; border-radius:50%; border:2px solid transparent;
      cursor:pointer; transition:transform .15s, border-color .15s;
    }
    .swatch:hover { transform:scale(1.15); }
    .swatch.active { border-color:#c9a96e; transform:scale(1.18); }
    .custom-color { width:36px; height:36px; border:none; background:transparent; cursor:pointer; border-radius:50%; overflow:hidden; }

    /* Apply row */
    .apply-row { display:flex; gap:12px; align-items:center; margin-bottom:20px; }
    .btn-apply {
      display:flex; align-items:center; gap:8px;
      padding:12px 32px; border-radius:10px; border:none;
      background:linear-gradient(135deg,#c9a96e,#a07840);
      color:#080810; font-size:15px; font-weight:700; cursor:pointer;
      transition:opacity .2s, transform .15s;
    }
    .btn-apply:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
    .btn-apply:disabled { opacity:.45; cursor:not-allowed; transform:none; }
    .btn-download {
      display:flex; align-items:center; gap:6px;
      padding:10px 20px; border-radius:10px; border:1px solid rgba(201,169,110,0.4);
      background:transparent; color:#c9a96e; font-size:13px; font-weight:600; cursor:pointer;
    }
    .btn-download:hover { background:rgba(201,169,110,0.08); }
    .spinner {
      width:14px; height:14px; border:2px solid rgba(0,0,0,.3); border-top-color:#080810;
      border-radius:50%; animation:spin .6s linear infinite; display:inline-block;
    }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* Status */
    .status-bar {
      padding:10px 16px; border-radius:8px; font-size:13px; margin-bottom:16px;
      background:rgba(201,169,110,0.08); border:1px solid rgba(201,169,110,0.2); color:#c9a96e;
    }
    .status-bar.error { background:rgba(220,60,60,0.08); border-color:rgba(220,60,60,0.3); color:#f07070; }

    /* Before/After */
    .compare-section {
      display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:16px;
      margin-bottom:24px;
    }
    .compare-panel { display:flex; flex-direction:column; gap:8px; }
    .compare-label {
      text-align:center; font-size:10px; font-weight:700; letter-spacing:.12em;
      color:#9997b0;
    }
    .compare-canvas { width:100%; border-radius:14px; display:block; }
    .compare-divider { display:flex; align-items:center; justify-content:center; }

    /* Style detail */
    .style-detail-card {
      padding:20px; border-radius:14px;
      background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
    }
    .style-detail-name { font-size:18px; font-weight:700; color:#f0eff4; margin-bottom:6px; }
    .style-detail-desc { font-size:13px; color:#9997b0; margin-bottom:12px; line-height:1.6; }
    .style-tags { display:flex; flex-wrap:wrap; gap:6px; }
    .tag {
      padding:3px 10px; border-radius:20px; font-size:11px;
      background:rgba(201,169,110,0.08); border:1px solid rgba(201,169,110,0.2); color:#c9a96e;
    }

    @media (max-width:600px) {
      .compare-section { grid-template-columns:1fr; gap:10px; }
      .compare-divider { transform:rotate(90deg); }
      .style-grid { grid-template-columns:repeat(3,1fr); max-height:280px; }
    }
  `],
})
export class HairstyleTryonComponent implements AfterViewInit, OnDestroy {

  @ViewChild('beforeCanvas') beforeCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('afterCanvas')  afterCanvasRef!:  ElementRef<HTMLCanvasElement>;

  private readonly renderer = inject(HairstyleRenderService);

  // ── State ────────────────────────────────────────────────────────────────────
  photoUrl    = signal<string | null>(null);
  selectedAsset = signal<HairstyleAsset | null>(null);
  hairColor   = signal('#3d2b1f');
  applying    = signal(false);
  resultReady = signal(false);
  statusMsg   = signal('');
  isError     = signal(false);
  genderFilter   = signal<GenderFilter>('todos');
  categoryFilter = signal<CategoryFilter>('todos');

  private sourceImg: HTMLImageElement | null = null;
  private landmarks: Array<{ x: number; y: number }> | null = null;
  private modelsLoaded = false;
  private objectUrls: string[] = [];

  // ── Static data ──────────────────────────────────────────────────────────────
  readonly genderOptions = [
    { value: 'todos' as GenderFilter, label: 'Todos' },
    { value: 'male'  as GenderFilter, label: 'Hombre' },
    { value: 'female' as GenderFilter, label: 'Mujer' },
    { value: 'unisex' as GenderFilter, label: 'Unisex' },
  ];
  readonly categoryOptions = [
    { value: 'todos'  as CategoryFilter, label: 'Todos' },
    { value: 'short'  as CategoryFilter, label: 'Corto' },
    { value: 'medium' as CategoryFilter, label: 'Medio' },
    { value: 'long'   as CategoryFilter, label: 'Largo' },
  ];
  readonly colors = [
    { hex: '#0a0604', name: 'Negro' },
    { hex: '#3d2b1f', name: 'Castaño oscuro' },
    { hex: '#6b4226', name: 'Castaño' },
    { hex: '#8b5e3c', name: 'Castaño claro' },
    { hex: '#c17f3c', name: 'Rubio oscuro' },
    { hex: '#e8c97a', name: 'Rubio' },
    { hex: '#f0e0b0', name: 'Rubio platino' },
    { hex: '#8c1a1a', name: 'Rojo oscuro' },
    { hex: '#c0392b', name: 'Rojo' },
    { hex: '#808080', name: 'Gris' },
    { hex: '#f5f5f5', name: 'Blanco' },
    { hex: '#1a3a5c', name: 'Azul oscuro' },
  ];

  // ── Computed ─────────────────────────────────────────────────────────────────
  filteredAssets = computed(() => {
    const g = this.genderFilter();
    const c = this.categoryFilter();
    return HAIRSTYLE_ASSETS.filter(a => {
      const gOk = g === 'todos' || a.gender === g || a.gender === 'unisex';
      const cOk = c === 'todos' || a.category === c;
      return gOk && cOk;
    });
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    this.loadModels();
  }

  ngOnDestroy(): void {
    this.objectUrls.forEach(u => URL.revokeObjectURL(u));
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  onFile(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.objectUrls.push(url);
    this.photoUrl.set(url);
    this.resultReady.set(false);
    this.landmarks = null;
    this.sourceImg = null;
    this.setStatus('Foto cargada. Selecciona un peinado y pulsa "Aplicar".', false);
  }

  clearPhoto(): void {
    this.photoUrl.set(null);
    this.resultReady.set(false);
    this.statusMsg.set('');
    this.landmarks = null;
    this.sourceImg = null;
  }

  selectAsset(asset: HairstyleAsset): void {
    this.selectedAsset.set(asset);
  }

  onImgError(ev: Event): void {
    (ev.target as HTMLImageElement).style.opacity = '0.3';
  }

  async applyHairstyle(): Promise<void> {
    if (!this.photoUrl() || !this.selectedAsset()) return;
    this.applying.set(true);
    this.setStatus('Detectando rostro…', false);

    try {
      // Load source image if not cached
      if (!this.sourceImg) {
        this.sourceImg = await this.loadImage(this.photoUrl()!);
      }

      // Detect landmarks if not cached (or re-detect if photo changed)
      if (!this.landmarks) {
        await this.ensureModels();
        this.landmarks = await this.detectLandmarks(this.sourceImg);
        if (!this.landmarks) {
          this.setStatus('No se detectó rostro. Usa una foto frontal con buena iluminación.', true);
          this.applying.set(false);
          return;
        }
      }

      this.setStatus('Renderizando peinado…', false);

      // Size canvas to image (max 700px wide)
      const maxW = Math.min(this.sourceImg.naturalWidth, 700);
      const scale = maxW / this.sourceImg.naturalWidth;
      const cW = maxW;
      const cH = Math.round(this.sourceImg.naturalHeight * scale);

      // Scale landmarks to canvas size
      const scaledLms = this.landmarks.map(p => ({ x: p.x * scale, y: p.y * scale }));

      // Before canvas: just draw the photo
      const bc = this.beforeCanvasRef.nativeElement;
      bc.width = cW; bc.height = cH;
      bc.getContext('2d')!.drawImage(this.sourceImg, 0, 0, cW, cH);

      // After canvas: full render pipeline
      const ac = this.afterCanvasRef.nativeElement;
      ac.width = cW; ac.height = cH;
      await this.renderer.renderHairstyle(
        ac, this.sourceImg, scaledLms,
        this.selectedAsset()!, this.hairColor(),
      );

      this.resultReady.set(true);
      this.setStatus(`Peinado "${this.selectedAsset()!.nameEs}" aplicado.`, false);
    } catch (err) {
      console.error(err);
      this.setStatus('Error al procesar. Intenta con otra foto.', true);
    } finally {
      this.applying.set(false);
    }
  }

  download(): void {
    if (!this.afterCanvasRef) return;
    const link = document.createElement('a');
    link.download = `barber-ai-${this.selectedAsset()?.id ?? 'tryon'}.png`;
    link.href = this.afterCanvasRef.nativeElement.toDataURL('image/png');
    link.click();
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private setStatus(msg: string, error: boolean): void {
    this.statusMsg.set(msg);
    this.isError.set(error);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  }

  private async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(CDN),
        faceapi.nets.faceLandmark68Net.loadFromUri(CDN),
      ]);
      this.modelsLoaded = true;
    } catch {
      console.warn('face-api models not loaded yet — will retry on apply.');
    }
  }

  private async ensureModels(): Promise<void> {
    if (this.modelsLoaded) return;
    await this.loadModels();
    if (!this.modelsLoaded) throw new Error('No se pudieron cargar los modelos de detección.');
  }

  private async detectLandmarks(img: HTMLImageElement): Promise<Array<{ x: number; y: number }> | null> {
    // Draw into an off-screen canvas at natural size for face-api
    const oc = document.createElement('canvas');
    oc.width  = img.naturalWidth;
    oc.height = img.naturalHeight;
    oc.getContext('2d')!.drawImage(img, 0, 0);

    const result = await faceapi
      .detectSingleFace(oc, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.35 }))
      .withFaceLandmarks();

    if (!result) return null;

    // Return positions as plain {x, y} objects (at natural image coordinates)
    return result.landmarks.positions.map(p => ({ x: p.x, y: p.y }));
  }
}
