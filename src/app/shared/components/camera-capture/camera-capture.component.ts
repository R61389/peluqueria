import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal,
  ElementRef,
  viewChild,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-camera-capture',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="camera-container">
      <div class="video-wrapper">
        <video #videoEl autoplay playsinline muted class="video-feed"></video>
        <div class="face-guide">
          <div class="guide-oval"></div>
        </div>
        @if (!isActive()) {
          <div class="camera-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <p>Camera not active</p>
          </div>
        }
      </div>

      <canvas #canvasEl style="display: none"></canvas>

      <div class="camera-controls">
        @if (!isActive()) {
          <button class="btn-primary" (click)="startCamera()">Start Camera</button>
        } @else {
          <button class="btn-primary capture-btn" (click)="capturePhoto()">
            <span class="capture-icon"></span>
            Capture
          </button>
          <button class="btn-secondary" (click)="stopCamera()">Cancel</button>
        }
      </div>

      @if (errorMessage()) {
        <p class="error-msg">{{ errorMessage() }}</p>
      }
    </div>
  `,
  styles: [`
    .camera-container {
      width: 100%;
    }

    .video-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 4/3;
      background: #0a0a0f;
      border-radius: 16px;
      overflow: hidden;
    }

    .video-feed {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    }

    .face-guide {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;

      .guide-oval {
        width: 45%;
        height: 65%;
        border: 2px dashed rgba(201,169,110,0.5);
        border-radius: 50%;
      }
    }

    .camera-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: rgba(255,255,255,0.2);
      font-size: 14px;
    }

    .camera-controls {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 16px;

      .btn-primary {
        background: linear-gradient(135deg, #c9a96e, #e8c990);
        color: #0a0a0f;
        border: none;
        border-radius: 12px;
        padding: 12px 24px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s;

        &:hover { transform: translateY(-2px); }
      }

      .btn-secondary {
        background: transparent;
        color: #f0eff4;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 12px 24px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover { border-color: #c9a96e; color: #c9a96e; }
      }

      .capture-btn .capture-icon {
        display: inline-block;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #0a0a0f;
        border: 2px solid #0a0a0f;
      }
    }

    .error-msg {
      color: #f87171;
      font-size: 13px;
      text-align: center;
      margin-top: 8px;
    }
  `],
})
export class CameraCaptureComponent implements OnDestroy {
  photoCaptured = output<HTMLImageElement>();
  closed = output<void>();

  videoEl = viewChild.required<ElementRef<HTMLVideoElement>>('videoEl');
  canvasEl = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasEl');

  isActive = signal(false);
  errorMessage = signal<string | null>(null);

  private stream: MediaStream | null = null;

  async startCamera(): Promise<void> {
    try {
      this.errorMessage.set(null);
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const video = this.videoEl().nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.isActive.set(true);
    } catch (err) {
      this.errorMessage.set('Camera access denied. Please allow camera permissions.');
    }
  }

  capturePhoto(): void {
    const video = this.videoEl().nativeElement;
    const canvas = this.canvasEl().nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const img = new Image();
    img.src = canvas.toDataURL('image/jpeg', 0.9);
    img.onload = () => {
      this.photoCaptured.emit(img);
      this.stopCamera();
    };
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.isActive.set(false);
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
