import { Injectable } from '@angular/core';
import {
  FaceAnalysisResult,
  FaceLandmark,
  FaceShape,
  Gender,
  SkinTone,
  SkinUndertone,
} from '../models/face-analysis.model';

@Injectable({ providedIn: 'root' })
export class FaceAnalysisService {
  private modelsLoaded = false;
  private faceapi: typeof import('face-api.js') | null = null;

  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;
    const faceapi = await import('face-api.js');
    this.faceapi = faceapi;
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
    ]);
    this.modelsLoaded = true;
  }

  async analyzeImage(
    imageElement: HTMLImageElement | HTMLVideoElement,
    canvasElement?: HTMLCanvasElement
  ): Promise<FaceAnalysisResult> {
    await this.loadModels();
    const faceapi = this.faceapi!;

    const detections = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withAgeAndGender()
      .withFaceExpressions();

    if (!detections) throw new Error('No face detected in the image');

    const landmarks: FaceLandmark[] = detections.landmarks.positions.map((p) => ({
      x: p.x,
      y: p.y,
    }));

    const faceShapeResult = this.calculateFaceShape(landmarks);
    const skinResult = await this.estimateSkinTone(imageElement, detections.detection.box);
    const symmetry = this.calculateSymmetry(landmarks);
    const contrast = this.calculateContrast(landmarks);

    let imageData = '';
    if (canvasElement && imageElement instanceof HTMLImageElement) {
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        canvasElement.width = imageElement.naturalWidth || imageElement.width;
        canvasElement.height = imageElement.naturalHeight || imageElement.height;
        ctx.drawImage(imageElement, 0, 0);
        imageData = canvasElement.toDataURL('image/jpeg', 0.8);
      }
    }

    const genderRaw = detections.gender as string;
    const gender: Gender =
      genderRaw === 'male' ? 'male' : genderRaw === 'female' ? 'female' : 'non-binary';

    return {
      faceShape: faceShapeResult.shape,
      faceShapeConfidence: faceShapeResult.confidence,
      estimatedAge: Math.round(detections.age),
      ageConfidence: 0.85,
      gender,
      genderConfidence: detections.genderProbability,
      facialContrast: contrast,
      skinTone: skinResult.tone,
      skinUndertone: skinResult.undertone,
      facialSymmetry: symmetry,
      landmarks,
      imageData,
    };
  }

  private calculateFaceShape(landmarks: FaceLandmark[]): {
    shape: FaceShape;
    confidence: number;
  } {
    const jaw = landmarks.slice(0, 17);
    const faceWidth = Math.abs(jaw[16].x - jaw[0].x);
    const faceHeight = Math.abs(landmarks[8].y - landmarks[27].y) * 1.4;
    const jawWidth = Math.abs(jaw[4].x - jaw[12].x);
    const foreheadWidth = Math.abs(landmarks[17].x - landmarks[26].x) * 1.1;

    const ratio = faceHeight / faceWidth;

    if (ratio > 1.5 && Math.abs(foreheadWidth - jawWidth) / faceWidth < 0.1) {
      return { shape: 'rectangular', confidence: 0.78 };
    } else if (ratio > 1.3 && faceWidth > jawWidth * 1.1) {
      return { shape: 'oval', confidence: 0.82 };
    } else if (ratio < 1.1) {
      return { shape: 'round', confidence: 0.8 };
    } else if (Math.abs(foreheadWidth - jawWidth) / faceWidth < 0.08 && ratio < 1.3) {
      return { shape: 'square', confidence: 0.76 };
    } else if (foreheadWidth > jawWidth * 1.2) {
      return { shape: 'heart', confidence: 0.74 };
    } else if (jawWidth > foreheadWidth * 1.1) {
      return { shape: 'triangular', confidence: 0.73 };
    }
    return { shape: 'oval', confidence: 0.65 };
  }

  private async estimateSkinTone(
    imageElement: HTMLImageElement | HTMLVideoElement,
    box: { x: number; y: number; width: number; height: number }
  ): Promise<{ tone: SkinTone; undertone: SkinUndertone }> {
    try {
      const canvas = document.createElement('canvas');
      const size = 50;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { tone: 'medium', undertone: 'neutral' };

      const sampleX = box.x + box.width * 0.3;
      const sampleY = box.y + box.height * 0.35;
      const sampleW = box.width * 0.4;
      const sampleH = box.height * 0.3;

      ctx.drawImage(imageElement, sampleX, sampleY, sampleW, sampleH, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;

      let totalR = 0, totalG = 0, totalB = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
        count++;
      }

      const avgR = totalR / count;
      const avgG = totalG / count;
      const avgB = totalB / count;
      const brightness = (avgR + avgG + avgB) / 3;

      let tone: SkinTone;
      if (brightness > 220) tone = 'very-fair';
      else if (brightness > 190) tone = 'fair';
      else if (brightness > 160) tone = 'medium';
      else if (brightness > 130) tone = 'olive';
      else if (brightness > 100) tone = 'tan';
      else if (brightness > 70) tone = 'dark';
      else tone = 'very-dark';

      // Undertone: warm = more red/yellow, cool = more blue/pink
      const warmScore = avgR - avgB;
      let undertone: SkinUndertone;
      if (warmScore > 20) undertone = 'warm';
      else if (warmScore < -10) undertone = 'cool';
      else undertone = 'neutral';

      return { tone, undertone };
    } catch {
      return { tone: 'medium', undertone: 'neutral' };
    }
  }

  private calculateSymmetry(landmarks: FaceLandmark[]): number {
    const centerX = landmarks[27].x;
    let symmetryScore = 0;
    const pairs: [number, number][] = [
      [0, 16], [1, 15], [2, 14], [3, 13], [4, 12], [5, 11], [6, 10],
      [36, 45], [39, 42], [17, 26], [18, 25],
    ];
    pairs.forEach(([l, r]) => {
      const leftDist = Math.abs(landmarks[l].x - centerX);
      const rightDist = Math.abs(landmarks[r].x - centerX);
      const maxDist = Math.max(leftDist, rightDist);
      if (maxDist > 0) {
        const diff = Math.abs(leftDist - rightDist) / maxDist;
        symmetryScore += 1 - diff;
      } else {
        symmetryScore += 1;
      }
    });
    return Math.round((symmetryScore / pairs.length) * 100);
  }

  private calculateContrast(landmarks: FaceLandmark[]): 'low' | 'medium' | 'high' {
    // Based on facial feature spacing - a rough heuristic
    const eyeWidth = Math.abs(landmarks[36].x - landmarks[45].x);
    const faceWidth = Math.abs(landmarks[0].x - landmarks[16].x);
    const ratio = eyeWidth / faceWidth;
    if (ratio > 0.55) return 'high';
    if (ratio > 0.45) return 'medium';
    return 'low';
  }
}
