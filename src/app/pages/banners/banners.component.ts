import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { Banner } from '../../core/models/banner.model';
import { BannerService } from '../../core/services/banner.service';
import { PageLoadingService } from '../../core/services/page-loading.service';

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banners.component.html',
  styleUrls: ['./banners.component.scss'],
})
export class BannersComponent implements OnInit {
  banners = signal<Banner[]>([]);
  loading = signal(true);
  error = signal(false);
  search = signal('');
  selectedCategory = signal('all');
  selectedBanner = signal<Banner | null>(null);
  modalClosing = signal(false);
  showScrollTop = signal(false);

  hasActiveFilters = computed(() => {
    return this.search() !== '' || this.selectedCategory() !== 'all';
  });

  constructor(
    private bannerService: BannerService,
    private pageLoadingService: PageLoadingService,
  ) {}

  ngOnInit() {
    this.pageLoadingService.setLoading(true);

    this.bannerService.getBanners().subscribe({
      next: (data) => {
        this.banners.set(data);
        this.loading.set(false);
        this.pageLoadingService.setLoading(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
        this.pageLoadingService.setLoading(false);
      },
    });

    window.addEventListener('scroll', () => {
      this.showScrollTop.set(window.scrollY > 400);
    });
  }

  get categories(): string[] {
    return [...new Set(this.banners().map((b) => b.category))].sort();
  }

  get filtered(): Banner[] {
    const q = this.search().toLowerCase();
    const cat = this.selectedCategory();
    return this.banners().filter((b) => {
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.devName.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);
      const matchCat = cat === 'all' || b.category === cat;
      return matchSearch && matchCat;
    });
  }

  onSearch(event: Event) {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onCategoryChange(event: Event) {
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
  }

  openModal(banner: Banner) {
    this.selectedBanner.set(banner);
    this.modalClosing.set(false);
  }

  closeModal() {
    this.modalClosing.set(true);
    setTimeout(() => {
      this.selectedBanner.set(null);
      this.modalClosing.set(false);
    }, 200);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters() {
    this.search.set('');
    this.selectedCategory.set('all');
  }
}
