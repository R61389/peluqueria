import {
  Component, Input, signal, ChangeDetectionStrategy,
  HostListener, ElementRef, inject, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * HairstylePreviewComponent
 *
 * Interactive Before / After comparison slider.
 * Drag the divider handle left-right to reveal more of the "after" image.
 *
 * Usage:
 *   <app-hairstyle-preview
 *     [beforeUrl]="photoUrl"
 *     [afterUrl]="generatedUrl"
 *     [hairstyleLabel]="'Wolf Cut'"
 *     [prompt]="aiPrompt"
 *     [provider]="'FLUX Kontext'"
 *   />
 */
@Component({
  selector: 'app-hairstyle-preview',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="preview-wrap">

  <!-- ── Drag comparison ─────────────────────────────────────────────── -->
  <div
    class="compare"
    [class.dragging]="dragging()"
    (mousedown)="onDragStart($event)"
    (touchstart)="onTouchStart($event)"
  >
    <!-- Before -->
    <img [src]="beforeUrl" class="img-base" alt="Antes" draggable="false"/>

    <!-- After (clip reveals from left) -->
    <div class="img-after-wrap" [style.clip-path]="afterClip()">
      <img [src]="afterUrl" class="img-base" alt="Después" draggable="false"/>
    </div>

    <!-- Labels -->
    <span class="label label-before">ANTES</span>
    <span class="label label-after">DESPUÉS</span>

    <!-- Drag handle -->
    <div class="drag-handle" [style.left]="handleLeft()">
      <div class="handle-bar"></div>
      <div class="handle-knob" aria-label="Arrastrar para comparar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M8 5l-5 7 5 7M16 5l5 7-5 7" stroke="white" stroke-width="2.2"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  </div>

  <!-- ── Hairstyle label ──────────────────────────────────────────────── -->
  @if (hairstyleLabel) {
    <div class="style-badge">{{ hairstyleLabel }}</div>
  }

  <!-- ── Prompt accordion ─────────────────────────────────────────────── -->
  @if (prompt) {
  <div class="prompt-section">
    <button class="prompt-toggle" (click)="promptOpen.set(!promptOpen())">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"
              stroke="#c9a96e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Prompt de IA usado
      <span class="caret" [class.open]="promptOpen()">▾</span>
      @if (provider) { <span class="provider-chip">{{ provider }}</span> }
    </button>
    @if (promptOpen()) {
      <pre class="prompt-body">{{ prompt }}</pre>
    }
  </div>
  }

</div>
  `,
  styles: [`
    .preview-wrap { display:flex; flex-direction:column; gap:12px; }

    /* Comparison area */
    .compare {
      position:relative; overflow:hidden; border-radius:16px;
      cursor:ew-resize; user-select:none; line-height:0;
      box-shadow:0 8px 32px rgba(0,0,0,0.5);
    }
    .compare.dragging { cursor:ew-resize; }
    .img-base { width:100%; display:block; pointer-events:none; max-height:520px; object-fit:cover; }
    .img-after-wrap { position:absolute; inset:0; overflow:hidden; }
    .img-after-wrap .img-base { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }

    /* Labels */
    .label {
      position:absolute; top:12px;
      padding:4px 12px; border-radius:20px;
      font-size:10px; font-weight:800; letter-spacing:.1em;
      pointer-events:none;
    }
    .label-before { left:12px; background:rgba(0,0,0,0.55); color:#aaa; }
    .label-after  { right:12px; background:rgba(201,169,110,0.25); color:#c9a96e; border:1px solid rgba(201,169,110,0.4); }

    /* Drag handle */
    .drag-handle {
      position:absolute; top:0; bottom:0; transform:translateX(-50%);
      display:flex; flex-direction:column; align-items:center; pointer-events:none;
    }
    .handle-bar {
      flex:1; width:2px;
      background:linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(201,169,110,0.8));
    }
    .handle-knob {
      position:absolute; top:50%; transform:translateY(-50%);
      width:40px; height:40px; border-radius:50%;
      background:linear-gradient(135deg,#c9a96e,#a07840);
      border:2px solid rgba(255,255,255,0.4);
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 16px rgba(0,0,0,0.4);
    }

    /* Style badge */
    .style-badge {
      text-align:center; font-size:14px; font-weight:700;
      color:#f0eff4; letter-spacing:.04em;
    }

    /* Prompt section */
    .prompt-section { border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.07); }
    .prompt-toggle {
      display:flex; align-items:center; gap:8px; width:100%;
      padding:10px 14px; background:rgba(255,255,255,0.03);
      border:none; color:#9997b0; font-size:12px; cursor:pointer; text-align:left;
    }
    .prompt-toggle:hover { color:#f0eff4; }
    .caret { margin-left:auto; transition:transform .2s; font-size:14px; }
    .caret.open { transform:rotate(180deg); }
    .provider-chip {
      margin-left:auto; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700;
      background:rgba(201,169,110,0.12); color:#c9a96e; border:1px solid rgba(201,169,110,0.25);
    }
    .prompt-body {
      margin:0; padding:12px 14px;
      background:rgba(0,0,0,0.25); color:#8a89a0;
      font-size:11px; line-height:1.65; white-space:pre-wrap; word-break:break-word;
      border-top:1px solid rgba(255,255,255,0.05);
    }
  `],
})
export class HairstylePreviewComponent implements OnInit {
  @Input() beforeUrl = '';
  @Input() afterUrl  = '';
  @Input() hairstyleLabel = '';
  @Input() prompt = '';
  @Input() provider = '';

  sliderPos  = signal(50);
  promptOpen = signal(false);
  dragging   = signal(false);

  private readonly el = inject(ElementRef);

  ngOnInit(): void { this.sliderPos.set(50); }

  handleLeft(): string { return `${this.sliderPos()}%`; }
  afterClip():  string { return `inset(0 ${100 - this.sliderPos()}% 0 0)`; }

  // ── Drag (mouse) ──────────────────────────────────────────────────────────

  onDragStart(e: MouseEvent): void {
    this.dragging.set(true);
    this.updatePos(e.clientX);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.dragging()) return;
    this.updatePos(e.clientX);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void { this.dragging.set(false); }

  // ── Drag (touch) ──────────────────────────────────────────────────────────

  onTouchStart(e: TouchEvent): void {
    this.dragging.set(true);
    this.updatePos(e.touches[0].clientX);
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(e: TouchEvent): void {
    if (!this.dragging()) return;
    this.updatePos(e.touches[0].clientX);
  }

  @HostListener('document:touchend')
  onTouchEnd(): void { this.dragging.set(false); }

  // ─────────────────────────────────────────────────────────────────────────

  private updatePos(clientX: number): void {
    const rect = (this.el.nativeElement as HTMLElement)
      .querySelector('.compare')?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    this.sliderPos.set(Math.round(pct));
  }
}
