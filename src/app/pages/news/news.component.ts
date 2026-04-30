import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { NewsMotd, NewsResponse, NewsStwMessage } from '../../core/models/news.model';
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
  selectedNews = signal<NewsMotd | NewsStwMessage | null>(null);
  modalClosing = signal(false);

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

  openModal(newsItem: NewsMotd | NewsStwMessage) {
    this.selectedNews.set(newsItem);
    this.modalClosing.set(false);
  }

  closeModal() {
    this.modalClosing.set(true);
    setTimeout(() => {
      this.selectedNews.set(null);
      this.modalClosing.set(false);
    }, 200);
  }

  getNewsImage(newsItem: NewsMotd | NewsStwMessage): string {
    if ('image' in newsItem && 'tileImage' in newsItem) {
      return newsItem.image;
    }
    return (newsItem as NewsStwMessage).image;
  }
}
