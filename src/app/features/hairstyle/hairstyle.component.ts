import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HairstyleResult } from '../../core/models/hairstyle.model';

@Component({
  selector: 'app-hairstyle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hairstyle.component.html',
  styleUrls: ['./hairstyle.component.scss'],
})
export class HairstyleComponent {
  result = input.required<HairstyleResult>();

  lengthLabel(length: string): string {
    const map: Record<string, string> = {
      pixie: 'Pixie',
      short: 'Short',
      bob: 'Bob',
      medium: 'Medium',
      long: 'Long',
      'extra-long': 'Extra Long',
    };
    return map[length] ?? length;
  }

  textureLabel(texture: string): string {
    const map: Record<string, string> = {
      straight: 'Straight',
      wavy: 'Wavy',
      curly: 'Curly',
      coily: 'Coily',
    };
    return map[texture] ?? texture;
  }

  partingLabel(parting: string): string {
    const map: Record<string, string> = {
      center: 'Center Part',
      'side-left': 'Left Side Part',
      'side-right': 'Right Side Part',
      'deep-side': 'Deep Side Part',
      none: 'No Part',
    };
    return map[parting] ?? parting;
  }
}
