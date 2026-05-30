import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="upload-container">
      <div
        class="drop-zone"
        [class.drag-over]="isDragging()"
        [class.has-image]="previewUrl()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave()"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        @if (previewUrl()) {
          <div class="preview-container">
            <img
              #previewImg
              [src]="previewUrl()"
              alt="Preview"
              class="preview-image"
              (load)="onImageLoad()"
            />
            <div class="preview-overlay">
              <button class="change-btn" (click)="$event.stopPropagation(); fileInput.click()">
                Change Photo
              </button>
            </div>
          </div>
        } @else {
          <div class="upload-placeholder">
            <div class="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3 class="upload-title">Upload your photo</h3>
            <p class="upload-hint">Drag & drop or click to browse</p>
            <p class="upload-formats">Supports JPG, PNG, WEBP</p>
          </div>
        }

        @if (isLoading()) {
          <div class="loading-overlay">
            <div class="spinner"></div>
            <span>Processing...</span>
          </div>
        }
      </div>

      <div class="upload-actions">
        <button class="btn-secondary camera-btn" (click)="cameraClick.emit()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Use Camera
        </button>

        @if (previewUrl()) {
          <button class="btn-primary analyze-btn" (click)="analyzeClick.emit(previewImage())">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Analyze Photo
          </button>
        }
      </div>

      <input
        #fileInput
        type="file"
        accept="image/*"
        style="display: none"
        (change)="onFileSelected($event)"
      />
    </div>
  `,
  styles: [`
    .upload-container {
      width: 100%;
    }

    .drop-zone {
      width: 100%;
      min-height: 300px;
      border: 2px dashed rgba(255,255,255,0.15);
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.02);

      &:hover {
        border-color: rgba(201, 169, 110, 0.4);
        background: rgba(201, 169, 110, 0.03);
      }

      &.drag-over {
        border-color: #c9a96e;
        background: rgba(201, 169, 110, 0.08);
        transform: scale(1.01);
      }

      &.has-image {
        border-style: solid;
        border-color: rgba(255,255,255,0.1);
      }
    }

    .upload-placeholder {
      text-align: center;
      padding: 40px 20px;

      .upload-icon {
        color: rgba(255,255,255,0.2);
        margin-bottom: 16px;
      }

      .upload-title {
        font-family: 'Playfair Display', serif;
        font-size: 20px;
        color: #f0eff4;
        margin-bottom: 8px;
      }

      .upload-hint {
        font-size: 14px;
        color: #9997b0;
        margin-bottom: 4px;
      }

      .upload-formats {
        font-size: 12px;
        color: #5a5870;
      }
    }

    .preview-container {
      width: 100%;
      height: 100%;
      position: relative;
      min-height: 300px;

      .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        max-height: 400px;
      }

      .preview-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.5);
        opacity: 0;
        transition: opacity 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &:hover .preview-overlay {
        opacity: 1;
      }

      .change-btn {
        background: rgba(201,169,110,0.9);
        color: #0a0a0f;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-weight: 600;
        cursor: pointer;
      }
    }

    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(10,10,15,0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: #c9a96e;
      font-size: 14px;

      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid rgba(201,169,110,0.2);
        border-top-color: #c9a96e;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }

    .upload-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      justify-content: center;
      flex-wrap: wrap;

      .camera-btn, .analyze-btn {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-secondary {
        background: transparent;
        color: #f0eff4;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: #c9a96e;
          color: #c9a96e;
        }
      }

      .btn-primary {
        background: linear-gradient(135deg, #c9a96e, #e8c990);
        color: #0a0a0f;
        border: none;
        border-radius: 12px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(201,169,110,0.3);
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class PhotoUploadComponent {
  analyzeClick = output<HTMLImageElement | null>();
  cameraClick = output<void>();

  isDragging = signal(false);
  isLoading = signal(false);
  previewUrl = signal<string | null>(null);

  private _previewImage: HTMLImageElement | null = null;
  previewImgRef = viewChild<ElementRef<HTMLImageElement>>('previewImg');

  previewImage(): HTMLImageElement | null {
    return this.previewImgRef()?.nativeElement ?? null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.loadFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.loadFile(file);
    }
  }

  onImageLoad(): void {
    this._previewImage = this.previewImgRef()?.nativeElement ?? null;
  }

  private loadFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }
}
