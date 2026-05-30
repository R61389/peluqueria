import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorimetryResult } from '../../core/models/colorimetry.model';
import { ConfidenceBadgeComponent } from '../../shared/components/confidence-badge/confidence-badge.component';

@Component({
  selector: 'app-colorimetry',
  standalone: true,
  imports: [CommonModule, ConfidenceBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './colorimetry.component.html',
  styleUrls: ['./colorimetry.component.scss'],
})
export class ColorimetryComponent {
  result = input.required<ColorimetryResult>();

  seasonIcon = computed(() => {
    const icons: Record<string, string> = {
      spring: '🌸',
      summer: '☀️',
      autumn: '🍂',
      winter: '❄️',
    };
    return icons[this.result().dominantSeason] ?? '✨';
  });

  seasonLabel = computed(() => {
    const s = this.result().dominantSeason;
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  metalLabel(metal: string): string {
    const labels: Record<string, string> = {
      gold: 'Gold',
      silver: 'Silver',
      'rose-gold': 'Rose Gold',
      mixed: 'Mixed Metals',
    };
    return labels[metal] ?? metal;
  }

  metalIcon(metal: string): string {
    const icons: Record<string, string> = {
      gold: '🟡',
      silver: '⚪',
      'rose-gold': '🌸',
      mixed: '✨',
    };
    return icons[metal] ?? '💍';
  }
}
