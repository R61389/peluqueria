import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaceAnalysisResult } from '../../core/models/face-analysis.model';
import { ConfidenceBadgeComponent } from '../../shared/components/confidence-badge/confidence-badge.component';

@Component({
  selector: 'app-face-analysis',
  standalone: true,
  imports: [CommonModule, ConfidenceBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './face-analysis.component.html',
  styleUrls: ['./face-analysis.component.scss'],
})
export class FaceAnalysisComponent {
  result = input.required<FaceAnalysisResult>();

  faceShapeLabel = computed(() => {
    const shapes: Record<string, string> = {
      oval: 'Oval',
      round: 'Round',
      square: 'Square',
      rectangular: 'Rectangular',
      triangular: 'Triangular',
      heart: 'Heart',
    };
    return shapes[this.result().faceShape] ?? this.result().faceShape;
  });

  genderLabel = computed(() => {
    const g = this.result().gender;
    return g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Non-binary';
  });

  skinToneLabel = computed(() => {
    const tones: Record<string, string> = {
      'very-fair': 'Very Fair',
      fair: 'Fair',
      medium: 'Medium',
      olive: 'Olive',
      tan: 'Tan',
      dark: 'Dark',
      'very-dark': 'Very Dark',
    };
    return tones[this.result().skinTone] ?? this.result().skinTone;
  });

  skinToneHex = computed(() => {
    const colors: Record<string, string> = {
      'very-fair': '#FDEBD0',
      fair: '#FADDBD',
      medium: '#D4A574',
      olive: '#B8860B',
      tan: '#A0522D',
      dark: '#6B3A2A',
      'very-dark': '#3C1810',
    };
    return colors[this.result().skinTone] ?? '#D4A574';
  });

  undertoneLabel = computed(() => {
    const u = this.result().skinUndertone;
    return u.charAt(0).toUpperCase() + u.slice(1);
  });

  contrastLabel = computed(() => {
    const c = this.result().facialContrast;
    return c.charAt(0).toUpperCase() + c.slice(1);
  });

  symmetryDashOffset = computed(() => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    return circumference * (1 - this.result().facialSymmetry / 100);
  });

  circumference = 2 * Math.PI * 36;
}
