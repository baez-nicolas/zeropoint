import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { NewsResponse } from '../../core/models/news.model';
import { NewsService } from '../../core/services/news.service';
import { PageLoadingService } from '../../core/services/page-loading.service';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent implements OnInit {
  news = signal<NewsResponse | null>(null);
  loading = signal(true);
  error = signal(false);
  activeTab = signal<'br' | 'stw'>('br');

  constructor(
    private newsService: NewsService,
    private pageLoadingService: PageLoadingService,
  ) {}

  ngOnInit() {
    this.pageLoadingService.setLoading(true);

    this.newsService.getNews().subscribe({
      next: (data) => {
        this.news.set(data);
        this.loading.set(false);
        this.pageLoadingService.setLoading(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
        this.pageLoadingService.setLoading(false);
      },
    });
  }

  setTab(tab: 'br' | 'stw') {
    this.activeTab.set(tab);
  }
}
