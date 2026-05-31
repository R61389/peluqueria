import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HairstyleTryonComponent } from './hairstyle-tryon/hairstyle-tryon.component';
import { ClothesTryonComponent } from './clothes-tryon/clothes-tryon.component';

@Component({
  selector: 'app-try-on',
  standalone: true,
  imports: [CommonModule, HairstyleTryonComponent, ClothesTryonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tryon-page">
      <div class="page-header">
        <div class="ai-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#c9a96e"/>
          </svg>
          IA PREMIUM
        </div>
        <h1>Virtual Try-On</h1>
        <p class="subtitle">Prueba peinados y ropa virtualmente con inteligencia artificial</p>

        <div class="tryon-tabs">
          <button class="tab-btn" [class.active]="tab() === 'hair'" (click)="tab.set('hair')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8 2 5 5 5 9c0 2 .8 3.8 2 5l-2 8h14l-2-8c1.2-1.2 2-3 2-5 0-4-3-7-7-7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
            Peinados
          </button>
          <button class="tab-btn" [class.active]="tab() === 'clothes'" (click)="tab.set('clothes')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L2 7l4 2v11h12V9l4-2-4-5-4 2a4 4 0 0 1-8 0L6 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
            Ropa
          </button>
        </div>
      </div>

      @if (tab() === 'hair') {
        <app-hairstyle-tryon/>
      }
      @if (tab() === 'clothes') {
        <app-clothes-tryon/>
      }
    </div>
  `,
  styles: [`
    .tryon-page {
      min-height: 100vh;
      background: #080810;
      padding-top: 80px;
    }
    .page-header {
      text-align: center;
      padding: 40px 24px 32px;
    }
    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 20px;
      background: rgba(201,169,110,0.1);
      border: 1px solid rgba(201,169,110,0.25);
      color: #c9a96e;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-bottom: 16px;
    }
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 48px;
      font-weight: 700;
      color: #f0eff4;
      margin: 0 0 12px;
      line-height: 1.1;
    }
    .subtitle {
      font-size: 15px;
      color: #9997b0;
      margin: 0 0 32px;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
    }
    .tryon-tabs {
      display: inline-flex;
      gap: 4px;
      padding: 4px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 24px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: #9997b0;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: #f0eff4; background: rgba(255,255,255,0.04); }
    .tab-btn.active {
      background: rgba(201,169,110,0.12);
      color: #c9a96e;
      border: 1px solid rgba(201,169,110,0.3);
    }
    @media (max-width: 600px) {
      h1 { font-size: 32px; }
      .tab-btn { padding: 8px 16px; font-size: 13px; }
    }
  `],
})
export class TryOnComponent {
  tab = signal<'hair' | 'clothes'>('hair');
}
