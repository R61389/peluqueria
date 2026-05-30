import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confidence-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="badge" [class]="levelClass()">
      <span class="dot"></span>
      <span class="label">{{ label() }}</span>
      <span class="value">{{ percentValue() }}%</span>
    </div>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;

      &.high {
        background: rgba(34, 197, 94, 0.15);
        color: #4ade80;
        .dot { background: #4ade80; }
      }

      &.medium {
        background: rgba(234, 179, 8, 0.15);
        color: #facc15;
        .dot { background: #facc15; }
      }

      &.low {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
        .dot { background: #f87171; }
      }

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .label {
        color: inherit;
        opacity: 0.8;
      }

      .value {
        font-weight: 600;
      }
    }
  `],
})
export class ConfidenceBadgeComponent {
  confidence = input.required<number>(); // 0-1
  label = input<string>('Confidence');

  percentValue = computed(() => Math.round(this.confidence() * 100));

  levelClass = computed(() => {
    const v = this.confidence();
    if (v >= 0.75) return 'high';
    if (v >= 0.5) return 'medium';
    return 'low';
  });
}
