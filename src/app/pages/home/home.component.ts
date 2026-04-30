import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NewsMotd } from '../../core/models/news.model';
import { ShopEntry } from '../../core/models/shop.model';
import { NewsService } from '../../core/services/news.service';
import { PageLoadingService } from '../../core/services/page-loading.service';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  latestNews = signal<NewsMotd[]>([]);
  featuredItems = signal<ShopEntry[]>([]);
  today = signal<string>('');
  loading = signal<boolean>(true);
  selectedNews = signal<NewsMotd | null>(null);
  selectedShopItem = signal<ShopEntry | null>(null);
  modalClosing = signal(false);

  constructor(
    private newsService: NewsService,
    private shopService: ShopService,
    private pageLoadingService: PageLoadingService,
  ) {}

  ngOnInit() {
    this.pageLoadingService.setLoading(true);

    this.today.set(
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    );

    let newsLoaded = false;
    let shopLoaded = false;

    const checkAllLoaded = () => {
      if (newsLoaded && shopLoaded) {
        this.loading.set(false);
        this.pageLoadingService.setLoading(false);
      }
    };

    this.newsService.getNews().subscribe({
      next: (data) => {
        this.latestNews.set(data.br.motds.filter((m) => !m.hidden).slice(0, 3));
        newsLoaded = true;
        checkAllLoaded();
      },
      error: () => {
        newsLoaded = true;
        checkAllLoaded();
      },
    });

    this.shopService.getShop().subscribe({
      next: (data) => {
        const items = data.entries
          .filter((e) => e.brItems?.length && e.newDisplayAsset?.renderImages?.[0]?.image)
          .slice(0, 6);
        this.featuredItems.set(items);
        shopLoaded = true;
        checkAllLoaded();
      },
      error: () => {
        shopLoaded = true;
        checkAllLoaded();
      },
    });
  }

  getEntryImage(entry: ShopEntry): string {
    return (
      entry.newDisplayAsset?.renderImages?.[0]?.image ?? entry.brItems?.[0]?.images?.icon ?? ''
    );
  }

  getRarityColor(entry: ShopEntry): string {
    const rarity = entry.brItems?.[0]?.rarity?.value ?? '';
    const map: Record<string, string> = {
      common: '#b1b1b1',
      uncommon: '#4caf50',
      rare: '#2196f3',
      epic: '#9c27b0',
      legendary: '#ff9800',
      marvel: '#ed1c24',
      icon: '#00bcd4',
      dc: '#0d47a1',
      starwars: '#000000',
    };
    return map[rarity] ?? '#555';
  }

  openNewsModal(newsItem: NewsMotd) {
    this.selectedNews.set(newsItem);
    this.modalClosing.set(false);
  }

  openShopModal(shopItem: ShopEntry) {
    this.selectedShopItem.set(shopItem);
    this.modalClosing.set(false);
  }

  closeModal() {
    this.modalClosing.set(true);
    setTimeout(() => {
      this.selectedNews.set(null);
      this.selectedShopItem.set(null);
      this.modalClosing.set(false);
    }, 200);
  }

  getNewsImage(newsItem: NewsMotd): string {
    return newsItem.image;
  }

  getModalImage(entry: ShopEntry): string {
    if (entry.bundle?.image) return entry.bundle.image;
    const featured = entry.brItems?.[0]?.images?.featured;
    if (featured) return featured;
    const render = entry.newDisplayAsset?.renderImages?.[0]?.image;
    if (render) return render;
    return entry.brItems?.[0]?.images?.icon ?? '';
  }

  getOutDateLabel(outDate: string): string {
    const out = new Date(outDate);
    const now = new Date();
    const diffMs = out.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 24) return `Leaves in ${diffHours}h`;
    return `Leaves in ${diffDays}d`;
  }
}
