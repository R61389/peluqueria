import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HistoryService, AnalysisRecord } from '../../core/services/history.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent {
  private historyService = inject(HistoryService);

  records = this.historyService.records;
  confirmDelete = signal<string | null>(null);

  deleteRecord(id: string): void {
    this.historyService.deleteRecord(id);
    this.confirmDelete.set(null);
  }

  clearAll(): void {
    this.historyService.clearAll();
    this.confirmDelete.set(null);
  }

  formatDate(timestamp: number): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  }

  capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
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
}
