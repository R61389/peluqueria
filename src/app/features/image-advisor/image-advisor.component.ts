import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FaceAnalysisService } from '../../core/services/face-analysis.service';
import { ColorimetryService } from '../../core/services/colorimetry.service';
import { HairstyleService } from '../../core/services/hairstyle.service';
import { HistoryService } from '../../core/services/history.service';

import { FaceAnalysisResult } from '../../core/models/face-analysis.model';
import { ColorimetryResult } from '../../core/models/colorimetry.model';
import { HairstyleResult } from '../../core/models/hairstyle.model';

import { PhotoUploadComponent } from '../../shared/components/photo-upload/photo-upload.component';
import { CameraCaptureComponent } from '../../shared/components/camera-capture/camera-capture.component';
import { FaceAnalysisComponent } from '../face-analysis/face-analysis.component';
import { ColorimetryComponent } from '../colorimetry/colorimetry.component';
import { HairstyleComponent } from '../hairstyle/hairstyle.component';
import { StylingComponent } from '../styling/styling.component';
import { InfographicComponent } from '../infographic/infographic.component';
import { HairstyleTryonComponent } from '../try-on/hairstyle-tryon/hairstyle-tryon.component';

export type Step = 'upload' | 'analyze' | 'results';
export type ResultTab = 'face' | 'color' | 'hair' | 'tryon' | 'style' | 'report';

@Component({
  selector: 'app-image-advisor',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PhotoUploadComponent,
    CameraCaptureComponent,
    FaceAnalysisComponent,
    ColorimetryComponent,
    HairstyleComponent,
    StylingComponent,
    InfographicComponent,
    HairstyleTryonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-advisor.component.html',
  styleUrls: ['./image-advisor.component.scss'],
})
export class ImageAdvisorComponent {
  private faceAnalysisService = inject(FaceAnalysisService);
  private colorimetryService = inject(ColorimetryService);
  private hairstyleService = inject(HairstyleService);
  private historyService = inject(HistoryService);

  @ViewChild('analysisCanvas') analysisCanvas!: ElementRef<HTMLCanvasElement>;

  currentStep = signal<Step>('upload');
  currentTab = signal<ResultTab>('face');
  isAnalyzing = signal(false);
  errorMessage = signal<string | null>(null);
  showCamera = signal(false);

  faceAnalysisResult = signal<FaceAnalysisResult | null>(null);
  colorimetryResult = signal<ColorimetryResult | null>(null);
  hairstyleResult = signal<HairstyleResult | null>(null);

  capturedImage = signal<HTMLImageElement | null>(null);

  hasResults = computed(
    () =>
      this.faceAnalysisResult() !== null &&
      this.colorimetryResult() !== null &&
      this.hairstyleResult() !== null
  );

  tabs: { id: ResultTab; label: string; icon: string }[] = [
    { id: 'face', label: 'Face', icon: '◈' },
    { id: 'color', label: 'Color', icon: '◉' },
    { id: 'hair', label: 'Hair', icon: '◎' },
    { id: 'tryon', label: 'Try-On IA', icon: '✦' },
    { id: 'style', label: 'Style', icon: '◇' },
    { id: 'report', label: 'Report', icon: '◆' },
  ];

  async analyzePhoto(imageEl: HTMLImageElement | null): Promise<void> {
    if (!imageEl) {
      this.errorMessage.set('No image provided');
      return;
    }

    this.isAnalyzing.set(true);
    this.errorMessage.set(null);
    this.currentStep.set('analyze');

    try {
      const canvas = this.analysisCanvas?.nativeElement;
      const faceResult = await this.faceAnalysisService.analyzeImage(imageEl, canvas);
      this.faceAnalysisResult.set(faceResult);

      const colorResult = this.colorimetryService.analyze(faceResult);
      this.colorimetryResult.set(colorResult);

      const hairResult = this.hairstyleService.getRecommendations(faceResult.faceShape);
      this.hairstyleResult.set(hairResult);

      // Save to history
      this.historyService.saveRecord(faceResult, colorResult, hairResult);

      this.currentStep.set('results');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed. Please try another photo.';
      this.errorMessage.set(message);
      this.currentStep.set('upload');
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  onCameraCapture(img: HTMLImageElement): void {
    this.showCamera.set(false);
    this.capturedImage.set(img);
    this.analyzePhoto(img);
  }

  resetAnalysis(): void {
    this.currentStep.set('upload');
    this.faceAnalysisResult.set(null);
    this.colorimetryResult.set(null);
    this.hairstyleResult.set(null);
    this.errorMessage.set(null);
    this.capturedImage.set(null);
  }
}
