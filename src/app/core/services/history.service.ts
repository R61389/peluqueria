import { Injectable, signal } from '@angular/core';
import { FaceAnalysisResult } from '../models/face-analysis.model';
import { ColorimetryResult } from '../models/colorimetry.model';
import { HairstyleResult } from '../models/hairstyle.model';

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  imageData: string;
  faceAnalysis: FaceAnalysisResult;
  colorimetry: ColorimetryResult;
  hairstyle: HairstyleResult;
}

const STORAGE_KEY = 'peluqueria_history';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private _records = signal<AnalysisRecord[]>(this.loadFromStorage());

  get records() {
    return this._records.asReadonly();
  }

  saveRecord(
    faceAnalysis: FaceAnalysisResult,
    colorimetry: ColorimetryResult,
    hairstyle: HairstyleResult
  ): AnalysisRecord {
    const record: AnalysisRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      imageData: faceAnalysis.imageData,
      faceAnalysis,
      colorimetry,
      hairstyle,
    };

    const current = this._records();
    const updated = [record, ...current].slice(0, 20); // Keep max 20 records
    this._records.set(updated);
    this.saveToStorage(updated);
    return record;
  }

  deleteRecord(id: string): void {
    const updated = this._records().filter((r) => r.id !== id);
    this._records.set(updated);
    this.saveToStorage(updated);
  }

  clearAll(): void {
    this._records.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  private loadFromStorage(): AnalysisRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(records: AnalysisRecord[]): void {
    try {
      // Limit storage size by compressing image data
      const toStore = records.map((r) => ({
        ...r,
        imageData: r.imageData.slice(0, 5000), // Limit stored image data
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Storage full — remove oldest record and retry
      if (records.length > 1) {
        this.saveToStorage(records.slice(0, -1));
      }
    }
  }
}
