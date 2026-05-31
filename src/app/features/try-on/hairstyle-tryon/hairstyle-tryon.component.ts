import {
  Component, signal, computed, ViewChild, ElementRef,
  AfterViewInit, ChangeDetectionStrategy, inject, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaceAnalysisService } from '../../../core/services/face-analysis.service';
import { HairstyleAiService } from '../../../core/services/hairstyle-ai.service';
import {
  HairstyleStyleDef,
  AI_HAIRSTYLE_STYLES,
  GenerationProgress,
} from '../../../core/models/hairstyle-ai.model';
import { FaceAnalysisResult, FaceShape } from '../../../core/models/face-analysis.model';
import { HairstylePreviewComponent } from './hairstyle-preview.component';

type GenderFilter   = 'todos' | 'male' | 'female' | 'unisex';
type CategoryFilter = 'todos' | 'short' | 'medium' | 'long';

interface HairColor { hex: string; name: string; nameEs: string; }

const HAIR_COLORS: HairColor[] = [
  { hex: '#080503', name: 'Jet Black',    nameEs: 'Negro azabache' },
  { hex: '#2c1810', name: 'Dark Brown',   nameEs: 'Castaño oscuro' },
  { hex: '#5c3317', name: 'Brown',        nameEs: 'Castaño'        },
  { hex: '#8b5e3c', name: 'Light Brown',  nameEs: 'Castaño claro'  },
  { hex: '#b8762e', name: 'Dark Blonde',  nameEs: 'Rubio oscuro'   },
  { hex: '#d4a843', name: 'Blonde',       nameEs: 'Rubio'          },
  { hex: '#ede0b2', name: 'Platinum',     nameEs: 'Platino'        },
  { hex: '#8b1a1a', name: 'Dark Red',     nameEs: 'Rojo oscuro'    },
  { hex: '#c0392b', name: 'Red',          nameEs: 'Rojo'           },
  { hex: '#606060', name: 'Gray',         nameEs: 'Gris'           },
  { hex: '#f0f0f0', name: 'White',        nameEs: 'Blanco'         },
  { hex: '#1a2a6c', name: 'Navy Blue',    nameEs: 'Azul marino'    },
];

@Component({
  selector: 'app-hairstyle-tryon',
  standalone: true,
  imports: [CommonModule, FormsModule, HairstylePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="ai-tryon">

  <!-- ══ HERO HEADER ══════════════════════════════════════════════════════ -->
  <div class="hero-bar">
    <div class="hero-badge">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#c9a96e">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      IA GENERATIVA
    </div>
    <p class="hero-sub">
      Sube tu foto · selecciona un corte · la IA genera el resultado preservando tu identidad facial
    </p>
  </div>

  <!-- ══ STEP 1 — UPLOAD ══════════════════════════════════════════════════ -->
  <section class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3 class="step-title">Tu fotografía</h3>

      <label class="upload-zone" [class.has-photo]="photoUrl()">
        @if (!photoUrl()) {
          <div class="upload-hint">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M4 16l4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2l1.6-1.6a2 2 0 0 1 2.8 0L20 14M14 8h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
                    stroke="#c9a96e" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>Arrastra o haz clic para subir</span>
            <small>JPG, PNG · máx 10 MB · foto frontal con buena luz</small>
          </div>
        } @else {
          <img [src]="photoUrl()" class="photo-thumb" alt="Tu foto"/>
        }
        <input type="file" accept="image/*" (change)="onFile($event)" hidden/>
      </label>

      @if (photoUrl()) {
        <div class="photo-actions">
          <button class="btn-ghost" (click)="clearAll()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            Cambiar foto
          </button>
          @if (analysisResult()) {
            <div class="face-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#4ade80" stroke-width="1.8"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              Rostro detectado ·
              <strong>{{ faceShapeLabel() }}</strong>
            </div>
          }
        </div>
      }

      <!-- Analysis in progress -->
      @if (analyzing()) {
        <div class="analyzing-bar">
          <div class="dot-spinner">
            <span></span><span></span><span></span>
          </div>
          Detectando rostro y analizando características…
        </div>
      }

      @if (analysisError()) {
        <div class="inline-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#f87171" stroke-width="1.8"/>
            <path d="M12 8v4M12 16h.01" stroke="#f87171" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          {{ analysisError() }}
        </div>
      }
    </div>
  </section>

  @if (photoUrl() && !analyzing()) {

  <!-- ══ STEP 2 — SELECT STYLE ═════════════════════════════════════════════ -->
  <section class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3 class="step-title">Selecciona el peinado</h3>

      <!-- Filters -->
      <div class="filter-row">
        <div class="filter-group">
          @for (opt of genderOpts; track opt.val) {
            <button class="chip" [class.active]="genderFilter() === opt.val" (click)="genderFilter.set(opt.val)">
              {{ opt.label }}
            </button>
          }
        </div>
        <div class="filter-group">
          @for (opt of categoryOpts; track opt.val) {
            <button class="chip" [class.active]="catFilter() === opt.val" (click)="catFilter.set(opt.val)">
              {{ opt.label }}
            </button>
          }
        </div>
      </div>

      <!-- Style grid -->
      <div class="style-grid">
        @for (style of filteredStyles(); track style.id) {
          <button
            class="style-card"
            [class.selected]="selectedStyle()?.id === style.id"
            [class.recommended]="isRecommended(style)"
            (click)="selectedStyle.set(style)"
          >
            @if (isRecommended(style)) {
              <span class="rec-badge">★ Recomendado</span>
            }
            <div class="style-icon">
              {{ styleInitials(style) }}
            </div>
            <div class="style-meta">
              <span class="style-name">{{ style.labelEs }}</span>
              <span class="style-cat">{{ style.category }}</span>
            </div>
          </button>
        }
      </div>

      @if (selectedStyle()) {
        <div class="selected-info">
          <strong>{{ selectedStyle()!.labelEs }}</strong>
          <span>—</span>
          <span class="si-keywords">{{ selectedStyle()!.promptKeywords }}</span>
        </div>
      }
    </div>
  </section>

  <!-- ══ STEP 3 — COLOR ═══════════════════════════════════════════════════ -->
  <section class="step-card">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3 class="step-title">Color de cabello</h3>
      <div class="color-row">
        @for (c of hairColors; track c.hex) {
          <button
            class="swatch"
            [style.background]="c.hex"
            [class.active]="selectedColor().hex === c.hex"
            [title]="c.nameEs"
            (click)="selectColor(c)"
          ></button>
        }
        <label class="swatch custom-swatch" title="Color personalizado">
          <span class="custom-icon">+</span>
          <input type="color" [value]="selectedColor().hex" (input)="onCustomColor($event)" hidden/>
        </label>
      </div>
      <p class="color-label">{{ selectedColor().nameEs }}</p>
    </div>
  </section>

  <!-- ══ STEP 4 — PROVIDER & GENERATE ════════════════════════════════════ -->
  <section class="step-card">
    <div class="step-num">4</div>
    <div class="step-body">
      <h3 class="step-title">Generar con IA</h3>

      <!-- Provider status -->
      <div class="provider-row">
        <div class="provider-info" [class.mock]="isMockProvider()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span>Proveedor: <strong>{{ aiService.providerName }}</strong></span>
          @if (isMockProvider()) {
            <span class="mock-badge">DEMO</span>
          }
        </div>
        @if (isMockProvider()) {
          <button class="btn-link" (click)="providerHelpOpen.set(!providerHelpOpen())">
            ¿Cómo conectar IA real?
          </button>
        }
      </div>

      @if (providerHelpOpen()) {
        <div class="provider-help">
          <p><strong>Para usar un proveedor real:</strong></p>
          <p>1. Abre la consola del navegador (F12 → Console)</p>
          <p>2. Ejecuta uno de estos comandos:</p>
          <code>// Replicate (SDXL / FLUX Kontext)
localStorage.setItem('replicate_api_key', 'r8_TU_CLAVE')

// HuggingFace Inference
localStorage.setItem('hf_api_key', 'hf_TU_CLAVE')</code>
          <p>3. Para cambiar el proveedor, modifica <code>app.config.ts</code> y selecciona
             <code>ReplicateProvider</code>, <code>HuggingFaceProvider</code> o
             <code>FluxKontextProvider</code>.</p>
        </div>
      }

      <button
        class="btn-generate"
        [disabled]="!canGenerate()"
        (click)="generate()"
      >
        @if (aiService.isActive()) {
          <span class="btn-spinner"></span>
          Generando…
        } @else {
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#080810"/>
          </svg>
          Generar peinado con IA
        }
      </button>

      @if (aiService.isActive()) {
        <button class="btn-cancel" (click)="aiService.cancel()">Cancelar</button>
      }
    </div>
  </section>

  <!-- ══ PROGRESS ══════════════════════════════════════════════════════════ -->
  @if (aiService.isActive() || progress().status === 'error') {
    <section class="progress-card" [class.error]="progress().status === 'error'">
      <div class="progress-header">
        @if (progress().status === 'error') {
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#f87171" stroke-width="1.8"/>
            <path d="M12 8v4M12 16h.01" stroke="#f87171" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        } @else {
          <div class="pulse-dot"></div>
        }
        <span class="progress-msg">{{ progress().message }}</span>
        @if (progress().estimatedSecondsLeft) {
          <span class="eta">~{{ progress().estimatedSecondsLeft }}s</span>
        }
      </div>
      @if (progress().status !== 'error') {
        <div class="progress-track">
          <div class="progress-fill" [style.width]="progress().percent + '%'"></div>
        </div>
        <div class="progress-pct">{{ progress().percent }}%</div>
      }
    </section>
  }

  <!-- ══ RESULT ════════════════════════════════════════════════════════════ -->
  @if (aiService.result()) {
    <section class="result-section">
      <div class="result-header">
        <h3>Resultado</h3>
        <div class="result-actions">
          <button class="btn-download" (click)="download()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Descargar
          </button>
          <button class="btn-ghost" (click)="aiService.reset(); generate()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M4 4v5h5M20 20v-5h-5M20 9A9 9 0 0 0 5.64 5.64M4 15a9 9 0 0 0 14.36 3.36"
                    stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            Re-generar
          </button>
        </div>
      </div>

      <app-hairstyle-preview
        [beforeUrl]="photoUrl()!"
        [afterUrl]="aiService.result()!.generatedImage"
        [hairstyleLabel]="selectedStyle()?.labelEs ?? ''"
        [prompt]="aiService.result()!.prompt"
        [provider]="aiService.result()!.provider"
      />

      <div class="result-meta">
        <span>{{ aiService.result()!.provider }}</span>
        <span>{{ aiService.result()!.durationMs | number:'1.0-0' }} ms</span>
      </div>
    </section>
  }

  } <!-- end @if photoUrl -->

</div>
  `,
  styles: [`
    :host { display:block; }
    .ai-tryon { max-width:720px; margin:0 auto; padding:0 20px 60px; display:flex; flex-direction:column; gap:20px; }

    /* Hero */
    .hero-bar { text-align:center; padding:8px 0 4px; }
    .hero-badge {
      display:inline-flex; align-items:center; gap:6px;
      padding:4px 12px; border-radius:20px;
      background:rgba(201,169,110,0.1); border:1px solid rgba(201,169,110,0.22);
      color:#c9a96e; font-size:11px; font-weight:800; letter-spacing:.1em; margin-bottom:8px;
    }
    .hero-sub { font-size:13px; color:#9997b0; margin:0; line-height:1.5; }

    /* Step cards */
    .step-card {
      display:flex; gap:16px; padding:20px;
      background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07);
      border-radius:16px;
    }
    .step-num {
      flex-shrink:0; width:28px; height:28px; border-radius:50%;
      background:rgba(201,169,110,0.12); border:1px solid rgba(201,169,110,0.3);
      color:#c9a96e; font-size:12px; font-weight:800;
      display:flex; align-items:center; justify-content:center;
    }
    .step-body { flex:1; min-width:0; }
    .step-title { margin:0 0 16px; font-size:15px; font-weight:700; color:#f0eff4; }

    /* Upload */
    .upload-zone {
      display:flex; align-items:center; justify-content:center;
      width:100%; min-height:160px; border:2px dashed rgba(201,169,110,0.3);
      border-radius:12px; background:rgba(201,169,110,0.02); cursor:pointer;
      transition:border-color .2s, background .2s; overflow:hidden;
    }
    .upload-zone:hover { border-color:rgba(201,169,110,0.55); background:rgba(201,169,110,0.04); }
    .upload-zone.has-photo { border-style:solid; min-height:auto; }
    .upload-hint { display:flex; flex-direction:column; align-items:center; gap:8px; color:#9997b0; text-align:center; padding:16px; }
    .upload-hint span { font-size:14px; font-weight:600; color:#c9a96e; }
    .upload-hint small { font-size:11px; }
    .photo-thumb { width:100%; max-height:340px; object-fit:cover; border-radius:10px; display:block; }
    .photo-actions { display:flex; align-items:center; gap:12px; margin-top:10px; flex-wrap:wrap; }
    .face-chip {
      display:flex; align-items:center; gap:5px; padding:4px 10px;
      border-radius:20px; background:rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.22);
      font-size:11px; color:#9997b0;
    }
    .face-chip strong { color:#4ade80; }
    .analyzing-bar {
      display:flex; align-items:center; gap:10px; padding:10px 14px; margin-top:10px;
      background:rgba(201,169,110,0.06); border-radius:8px; font-size:12px; color:#9997b0;
    }
    .dot-spinner { display:flex; gap:4px; }
    .dot-spinner span {
      width:5px; height:5px; border-radius:50%; background:#c9a96e;
      animation:dotBounce 1s ease-in-out infinite;
    }
    .dot-spinner span:nth-child(2) { animation-delay:.15s; }
    .dot-spinner span:nth-child(3) { animation-delay:.3s; }
    @keyframes dotBounce { 0%,80%,100%{transform:scale(.8);opacity:.5} 40%{transform:scale(1.2);opacity:1} }
    .inline-error {
      display:flex; align-items:center; gap:7px; padding:8px 12px; margin-top:10px;
      background:rgba(248,113,113,0.07); border-radius:8px; border:1px solid rgba(248,113,113,0.2);
      font-size:12px; color:#f87171;
    }

    /* Filters */
    .filter-row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
    .filter-group { display:flex; flex-wrap:wrap; gap:5px; }
    .chip {
      padding:4px 12px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);
      background:transparent; color:#9997b0; font-size:12px; cursor:pointer; transition:all .15s;
    }
    .chip:hover { color:#f0eff4; }
    .chip.active { background:rgba(201,169,110,0.14); color:#c9a96e; border-color:rgba(201,169,110,0.38); }

    /* Style grid */
    .style-grid {
      display:grid; grid-template-columns:repeat(auto-fill,minmax(108px,1fr)); gap:8px;
      max-height:320px; overflow-y:auto; padding-right:4px; margin-bottom:10px;
    }
    .style-grid::-webkit-scrollbar { width:4px; }
    .style-grid::-webkit-scrollbar-thumb { background:rgba(201,169,110,0.25); border-radius:2px; }
    .style-card {
      position:relative; display:flex; flex-direction:column; align-items:center; gap:6px;
      padding:12px 6px 10px; border-radius:12px; border:1.5px solid rgba(255,255,255,0.07);
      background:rgba(255,255,255,0.02); cursor:pointer; transition:all .16s;
    }
    .style-card:hover { border-color:rgba(201,169,110,0.35); background:rgba(201,169,110,0.05); }
    .style-card.selected { border-color:#c9a96e; background:rgba(201,169,110,0.1); }
    .style-card.recommended { border-color:rgba(201,169,110,0.5); }
    .rec-badge {
      position:absolute; top:4px; left:50%; transform:translateX(-50%);
      background:rgba(201,169,110,0.15); color:#c9a96e; font-size:8px; font-weight:700;
      padding:1px 6px; border-radius:10px; white-space:nowrap;
    }
    .style-icon {
      width:48px; height:48px; border-radius:10px;
      background:rgba(201,169,110,0.08); border:1px solid rgba(201,169,110,0.15);
      display:flex; align-items:center; justify-content:center;
      font-size:14px; font-weight:800; color:#c9a96e; letter-spacing:.02em;
    }
    .style-meta { text-align:center; }
    .style-name { display:block; font-size:11px; font-weight:600; color:#f0eff4; }
    .style-cat  { display:block; font-size:10px; color:#9997b0; margin-top:2px; text-transform:capitalize; }
    .selected-info {
      display:flex; gap:8px; flex-wrap:wrap; padding:8px 12px;
      background:rgba(201,169,110,0.06); border-radius:8px; font-size:11px;
    }
    .selected-info strong { color:#c9a96e; }
    .si-keywords { color:#9997b0; font-style:italic; }

    /* Colors */
    .color-row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
    .swatch {
      width:30px; height:30px; border-radius:50%; border:2.5px solid transparent;
      cursor:pointer; transition:transform .15s, border-color .15s; flex-shrink:0;
    }
    .swatch:hover { transform:scale(1.18); }
    .swatch.active { border-color:#c9a96e; transform:scale(1.2); }
    .custom-swatch {
      display:flex; align-items:center; justify-content:center;
      background:linear-gradient(135deg,#ff6b6b,#ffd93d,#6bcb77,#4d96ff);
      border:2px solid rgba(255,255,255,0.2);
    }
    .custom-icon { color:white; font-size:16px; font-weight:300; }
    .color-label { font-size:12px; color:#c9a96e; margin:0; }

    /* Provider */
    .provider-row { display:flex; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
    .provider-info {
      display:flex; align-items:center; gap:7px; padding:6px 12px;
      border-radius:8px; background:rgba(74,222,128,0.07); border:1px solid rgba(74,222,128,0.18);
      font-size:12px; color:#9997b0;
    }
    .provider-info.mock { background:rgba(201,169,110,0.07); border-color:rgba(201,169,110,0.2); }
    .provider-info strong { color:#f0eff4; }
    .mock-badge {
      padding:1px 7px; border-radius:10px; background:rgba(201,169,110,0.15);
      border:1px solid rgba(201,169,110,0.3); color:#c9a96e; font-size:9px; font-weight:800;
    }
    .btn-link { background:none; border:none; color:#c9a96e; font-size:12px; cursor:pointer; text-decoration:underline; }
    .provider-help {
      padding:14px; margin-bottom:14px; border-radius:10px;
      background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.07);
      font-size:12px; color:#9997b0; line-height:1.6;
    }
    .provider-help p { margin:0 0 6px; }
    .provider-help code {
      display:block; padding:8px; margin:6px 0;
      background:rgba(0,0,0,0.4); border-radius:6px;
      color:#c9a96e; font-size:11px; white-space:pre;
    }

    /* Generate button */
    .btn-generate {
      display:flex; align-items:center; justify-content:center; gap:10px;
      width:100%; padding:14px; border-radius:12px; border:none;
      background:linear-gradient(135deg,#c9a96e,#a07840);
      color:#080810; font-size:15px; font-weight:800; cursor:pointer;
      transition:opacity .2s, transform .15s;
    }
    .btn-generate:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); }
    .btn-generate:disabled { opacity:.38; cursor:not-allowed; transform:none; }
    .btn-spinner {
      width:16px; height:16px; border:2.5px solid rgba(0,0,0,.25); border-top-color:#080810;
      border-radius:50%; animation:spin .6s linear infinite;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
    .btn-cancel {
      display:block; width:100%; margin-top:8px; padding:9px;
      border-radius:8px; border:1px solid rgba(255,255,255,0.12);
      background:transparent; color:#9997b0; font-size:13px; cursor:pointer;
    }
    .btn-cancel:hover { color:#f0eff4; border-color:rgba(255,255,255,0.25); }

    /* Ghost button (shared) */
    .btn-ghost {
      display:flex; align-items:center; gap:6px;
      padding:7px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.12);
      background:transparent; color:#9997b0; font-size:13px; cursor:pointer;
    }
    .btn-ghost:hover { color:#f0eff4; border-color:rgba(255,255,255,0.25); }

    /* Progress */
    .progress-card {
      padding:16px 20px; border-radius:12px;
      background:rgba(201,169,110,0.06); border:1px solid rgba(201,169,110,0.18);
    }
    .progress-card.error { background:rgba(248,113,113,0.06); border-color:rgba(248,113,113,0.22); }
    .progress-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .pulse-dot {
      width:10px; height:10px; border-radius:50%; background:#c9a96e;
      animation:pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
    .progress-msg { font-size:13px; color:#f0eff4; flex:1; }
    .eta { font-size:11px; color:#9997b0; }
    .progress-track { height:6px; background:rgba(255,255,255,0.07); border-radius:3px; overflow:hidden; }
    .progress-fill { height:100%; background:linear-gradient(90deg,#c9a96e,#e8c87a); border-radius:3px; transition:width .4s ease; }
    .progress-pct { text-align:right; font-size:11px; color:#9997b0; margin-top:4px; }

    /* Result */
    .result-section { display:flex; flex-direction:column; gap:14px; }
    .result-header { display:flex; align-items:center; justify-content:space-between; }
    .result-header h3 { margin:0; font-size:16px; font-weight:700; color:#f0eff4; }
    .result-actions { display:flex; gap:8px; }
    .btn-download {
      display:flex; align-items:center; gap:6px;
      padding:8px 16px; border-radius:8px;
      background:rgba(201,169,110,0.12); border:1px solid rgba(201,169,110,0.35);
      color:#c9a96e; font-size:13px; font-weight:600; cursor:pointer;
    }
    .btn-download:hover { background:rgba(201,169,110,0.2); }
    .result-meta { display:flex; justify-content:space-between; font-size:11px; color:#6b6980; }

    @media (max-width:500px) {
      .ai-tryon { padding:0 12px 40px; }
      .step-card { flex-direction:column; gap:10px; padding:14px; }
      .style-grid { grid-template-columns:repeat(3,1fr); max-height:260px; }
      .filter-row { gap:6px; }
    }
  `],
})
export class HairstyleTryonComponent implements AfterViewInit, OnDestroy {

  @ViewChild('canvasRef') canvasRef?: ElementRef<HTMLCanvasElement>;

  readonly aiService      = inject(HairstyleAiService);
  private readonly faceAnalysis = inject(FaceAnalysisService);

  // ── State ─────────────────────────────────────────────────────────────────
  photoUrl       = signal<string | null>(null);
  analysisResult = signal<FaceAnalysisResult | null>(null);
  analyzing      = signal(false);
  analysisError  = signal('');
  selectedStyle  = signal<HairstyleStyleDef | null>(null);
  genderFilter   = signal<GenderFilter>('todos');
  catFilter      = signal<CategoryFilter>('todos');
  providerHelpOpen = signal(false);

  private currentColorIdx = 0;
  selectedColor = signal<HairColor>(HAIR_COLORS[1]); // Dark Brown default

  private objectUrls: string[] = [];
  private sourceImg: HTMLImageElement | null = null;

  // ── Catalog ───────────────────────────────────────────────────────────────
  readonly hairColors = HAIR_COLORS;

  readonly genderOpts = [
    { val: 'todos' as GenderFilter,  label: 'Todos'   },
    { val: 'male'  as GenderFilter,  label: 'Hombre'  },
    { val: 'female' as GenderFilter, label: 'Mujer'   },
    { val: 'unisex' as GenderFilter, label: 'Unisex'  },
  ];
  readonly categoryOpts = [
    { val: 'todos'  as CategoryFilter, label: 'Todos'  },
    { val: 'short'  as CategoryFilter, label: 'Corto'  },
    { val: 'medium' as CategoryFilter, label: 'Medio'  },
    { val: 'long'   as CategoryFilter, label: 'Largo'  },
  ];

  // ── Computed ──────────────────────────────────────────────────────────────
  progress = computed(() => this.aiService.progress());

  filteredStyles = computed(() => {
    const g = this.genderFilter();
    const c = this.catFilter();
    return AI_HAIRSTYLE_STYLES.filter(s => {
      const gOk = g === 'todos' || s.gender === g || s.gender === 'unisex';
      const cOk = c === 'todos' || s.category === c;
      return gOk && cOk;
    });
  });

  faceShapeLabel = computed(() => {
    const r = this.analysisResult();
    if (!r) return '';
    const map: Record<FaceShape, string> = {
      oval: 'Ovalado', round: 'Redondo', square: 'Cuadrado',
      rectangular: 'Rectangular', heart: 'Corazón', triangular: 'Triangular',
    };
    return map[r.faceShape] ?? r.faceShape;
  });

  canGenerate = computed(
    () => !!this.photoUrl() && !!this.selectedStyle() && !this.aiService.isActive(),
  );

  isMockProvider = computed(() => this.aiService.providerName === 'mock');

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.objectUrls.forEach(u => URL.revokeObjectURL(u));
  }

  // ── File upload ───────────────────────────────────────────────────────────
  async onFile(ev: Event): Promise<void> {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    this.objectUrls.push(url);
    this.photoUrl.set(url);
    this.aiService.reset();
    this.analysisResult.set(null);
    this.analysisError.set('');
    this.sourceImg = null;

    await this.runFaceAnalysis(url);
  }

  clearAll(): void {
    this.photoUrl.set(null);
    this.analysisResult.set(null);
    this.analysisError.set('');
    this.sourceImg = null;
    this.aiService.reset();
  }

  // ── Face analysis ─────────────────────────────────────────────────────────
  private async runFaceAnalysis(url: string): Promise<void> {
    this.analyzing.set(true);
    this.analysisError.set('');
    try {
      const img = await this.loadImage(url);
      this.sourceImg = img;
      const canvas = document.createElement('canvas');
      const result = await this.faceAnalysis.analyzeImage(img, canvas);
      this.analysisResult.set(result);
      // Auto-select gender filter based on detected gender
      if (result.gender === 'male')   this.genderFilter.set('male');
      if (result.gender === 'female') this.genderFilter.set('female');
    } catch (err) {
      this.analysisError.set(
        'No se detectó rostro. Usa una foto frontal, bien iluminada, con el rostro centrado.',
      );
    } finally {
      this.analyzing.set(false);
    }
  }

  // ── Color selection ───────────────────────────────────────────────────────
  selectColor(c: HairColor): void {
    this.selectedColor.set(c);
  }

  onCustomColor(ev: Event): void {
    const hex = (ev.target as HTMLInputElement).value;
    this.selectedColor.set({ hex, name: 'Custom', nameEs: 'Personalizado' });
  }

  // ── Style helpers ─────────────────────────────────────────────────────────
  styleInitials(s: HairstyleStyleDef): string {
    return s.label.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  isRecommended(s: HairstyleStyleDef): boolean {
    const shape = this.analysisResult()?.faceShape;
    return !!shape && s.compatibleFaceShapes.includes(shape);
  }

  // ── AI Generation ─────────────────────────────────────────────────────────
  async generate(): Promise<void> {
    if (!this.canGenerate()) return;

    const photo = this.photoUrl()!;
    const style = this.selectedStyle()!;
    const color = this.selectedColor();
    const shape = this.analysisResult()?.faceShape ?? 'oval';

    // Ensure photo is base64 (convert blob URL if needed)
    const imageBase64 = await this.toBase64(photo);

    await this.aiService.generate({
      imageBase64,
      hairstyle: style.id,
      hairstyleLabel: style.label,
      faceShape: shape,
      hairColor: color.hex,
      hairColorName: color.nameEs,
    }).catch(() => {/* error already in progress signal */});
  }

  download(): void {
    const result = this.aiService.result();
    if (!result) return;
    const link = document.createElement('a');
    link.download = `barber-ai-${this.selectedStyle()?.id ?? 'tryon'}.jpg`;
    link.href = result.generatedImage;
    link.click();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = src;
    });
  }

  private toBase64(src: string): Promise<string> {
    // If already a data URL, return as-is
    if (src.startsWith('data:')) return Promise.resolve(src);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const maxW = Math.min(img.naturalWidth, 1024);
        const scale = maxW / img.naturalWidth;
        const canvas = document.createElement('canvas');
        canvas.width  = maxW;
        canvas.height = Math.round(img.naturalHeight * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = src;
    });
  }
}
