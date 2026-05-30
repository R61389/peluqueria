import { Component, ChangeDetectionStrategy, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaceAnalysisResult } from '../../core/models/face-analysis.model';
import { ColorimetryResult } from '../../core/models/colorimetry.model';
import { HairstyleResult } from '../../core/models/hairstyle.model';
import { InfographicService } from '../../core/services/infographic.service';

@Component({
  selector: 'app-infographic',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './infographic.component.html',
  styleUrls: ['./infographic.component.scss'],
})
export class InfographicComponent {
  faceAnalysis = input.required<FaceAnalysisResult>();
  colorimetry = input.required<ColorimetryResult>();
  hairstyle = input.required<HairstyleResult>();

  private infographicService = inject(InfographicService);

  isExporting = signal(false);

  async exportInfographic(): Promise<void> {
    this.isExporting.set(true);
    try {
      await this.infographicService.exportAsImage('style-infographic', 'my-style-report.png');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      this.isExporting.set(false);
    }
  }

  seasonEmoji(season: string): string {
    const map: Record<string, string> = {
      spring: '🌸',
      summer: '☀️',
      autumn: '🍂',
      winter: '❄️',
    };
    return map[season] ?? '✨';
  }

  capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
