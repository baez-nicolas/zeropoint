import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Banner } from '../../core/models/banner.model';
import { Cosmetic } from '../../core/models/cosmetic.model';
import { NewsMotd } from '../../core/models/news.model';
import { ShopEntry } from '../../core/models/shop.model';
import { BannerService } from '../../core/services/banner.service';
import { CosmeticService } from '../../core/services/cosmetic.service';
import { CreatorCodeService } from '../../core/services/creator-code.service';
import { NewsService } from '../../core/services/news.service';
import { PageLoadingService } from '../../core/services/page-loading.service';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  latestNews = signal<NewsMotd[]>([]);
  featuredItems = signal<ShopEntry[]>([]);
  featuredBanners = signal<Banner[]>([]);
  featuredCosmetics = signal<Cosmetic[]>([]);
  today = signal<string>('');
  loading = signal<boolean>(true);
  selectedNews = signal<NewsMotd | null>(null);
  selectedShopItem = signal<ShopEntry | null>(null);
  selectedBanner = signal<Banner | null>(null);
  selectedCosmetic = signal<Cosmetic | null>(null);
  modalClosing = signal(false);
  creatorCodeModalOpen = signal(false);
  private _creatorCode = signal<string>('');
  checkingCode = signal<boolean>(false);

  get creatorCode() {
    return this._creatorCode();
  }
  set creatorCode(value: string) {
    this._creatorCode.set(value);
  }

  constructor(
    private newsService: NewsService,
    private shopService: ShopService,
    private bannerService: BannerService,
    private cosmeticService: CosmeticService,
    private creatorCodeService: CreatorCodeService,
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
    let bannersLoaded = false;
    let cosmeticsLoaded = false;

    const checkAllLoaded = () => {
      if (newsLoaded && shopLoaded && bannersLoaded && cosmeticsLoaded) {
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

    this.bannerService.getBanners().subscribe({
      next: (data) => {
        const featured = data
          .filter((b) => b.fullUsageRights || b.category === 'Other')
          .slice(0, 8);
        this.featuredBanners.set(featured);
        bannersLoaded = true;
        checkAllLoaded();
      },
      error: () => {
        bannersLoaded = true;
        checkAllLoaded();
      },
    });

    this.cosmeticService.getCosmetics().subscribe({
      next: (data) => {
        const featuredNames = [
          'midoriya',
          'optimus prime',
          'ben tennyson',
          'kratos',
          'travis scott',
          'green roots billie',
        ];
        const featured = data.filter((c) => {
          const nameValue = c.name.toLowerCase();
          const isOutfit = c.type.value === 'outfit';
          const isLegendary = c.rarity?.value === 'legendary';

          if (nameValue === 'the foundation' && isOutfit && isLegendary) {
            return true;
          }

          if (nameValue === 'lionel messi' && isOutfit) {
            return true;
          }

          return isOutfit && featuredNames.some((fn) => nameValue.includes(fn));
        });
        this.featuredCosmetics.set(featured.slice(0, 8));
        cosmeticsLoaded = true;
        checkAllLoaded();
      },
      error: () => {
        cosmeticsLoaded = true;
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

  openBannerModal(banner: Banner) {
    this.selectedBanner.set(banner);
    this.modalClosing.set(false);
  }

  openCosmeticModal(cosmetic: Cosmetic) {
    this.selectedCosmetic.set(cosmetic);
    this.modalClosing.set(false);
  }

  closeModal() {
    this.modalClosing.set(true);
    setTimeout(() => {
      this.selectedNews.set(null);
      this.selectedShopItem.set(null);
      this.selectedBanner.set(null);
      this.selectedCosmetic.set(null);
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

  getCosmeticImage(cosmetic: Cosmetic): string {
    return cosmetic.images.icon ?? '';
  }

  getCosmeticRarityClass(cosmetic: Cosmetic): string {
    const rarity = cosmetic.rarity?.value ?? '';
    return `rarity-${rarity}`;
  }
  openCreatorCodeModal() {
    this.creatorCodeModalOpen.set(true);
  }

  closeCreatorCodeModal() {
    this.creatorCodeModalOpen.set(false);
    this._creatorCode.set('');
  }
  checkCreatorCode() {
    const code = this._creatorCode().trim();
    if (!code) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty code',
        text: 'Please enter a creator code',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#ffc107',
        customClass: {
          container: 'swal-high-z-index',
        },
      });
      return;
    }

    this.checkingCode.set(true);
    this.creatorCodeService.getCreatorCode(code).subscribe({
      next: (response) => {
        this.checkingCode.set(false);
        if (response.data.status === 'ACTIVE') {
          Swal.fire({
            icon: 'success',
            title: 'Creator code active!',
            html: `
              <p>Code: <strong>${response.data.code}</strong></p>
              <p>Creator: <strong>${response.data.account.name}</strong></p>
              <p>Status: <strong class="text-success">ACTIVE</strong></p>
              ${response.data.verified ? '<p><i class="bi bi-patch-check-fill text-primary"></i> Verified</p>' : ''}
            `,
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#ffc107',
            customClass: {
              container: 'swal-high-z-index',
            },
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Code inactive',
            html: `
              <p>The creator code <strong>${response.data.code}</strong> exists but is not active.</p>
              <p>Status: <strong class="text-danger">${response.data.status}</strong></p>
            `,
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#ffc107',
            customClass: {
              container: 'swal-high-z-index',
            },
          });
        }
        this._creatorCode.set('');
      },
      error: (err) => {
        this.checkingCode.set(false);
        if (err.status === 404) {
          Swal.fire({
            icon: 'error',
            title: 'Code not found',
            text: `The creator code "${code}" does not exist.`,
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#ffc107',
            customClass: {
              container: 'swal-high-z-index',
            },
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while checking the creator code. Please try again.',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#ffc107',
            customClass: {
              container: 'swal-high-z-index',
            },
          });
        }
        this._creatorCode.set('');
      },
    });
  }
}
