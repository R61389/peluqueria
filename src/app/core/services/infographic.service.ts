import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class InfographicService {
  async exportAsImage(elementId: string, filename = 'style-report.png'): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found: ' + elementId);

    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0a0f',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async getImageDataUrl(elementId: string): Promise<string> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('Element not found: ' + elementId);

    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0a0f',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    return canvas.toDataURL('image/png');
  }
}
