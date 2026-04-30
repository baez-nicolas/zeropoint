import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Banner } from '../../core/models/banner.model';
import { BannerService } from '../../core/services/banner.service';
import { PageLoadingService } from '../../core/services/page-loading.service';

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './banners.component.html',
  styleUrls: ['./banners.component.scss'],
})
export class BannersComponent implements OnInit {
  banners = signal<Banner[]>([]);
  loading = signal(true);
  error = signal(false);
  private _search = signal('');
  private _selectedCategory = signal('all');
  selectedBanner = signal<Banner | null>(null);
  modalClosing = signal(false);
  showScrollTop = signal(false);

  get search() {
    return this._search();
  }
  set search(value: string) {
    this._search.set(value);
  }

  get selectedCategory() {
    return this._selectedCategory();
  }
  set selectedCategory(value: string) {
    this._selectedCategory.set(value);
  }

  hasActiveFilters = computed(() => {
    return this._search() !== '' || this._selectedCategory() !== 'all';
  });

  constructor(
    private bannerService: BannerService,
    private pageLoadingService: PageLoadingService,
  ) {}

  ngOnInit() {
    this.loadFiltersFromStorage();

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
    const q = this._search().toLowerCase();
    const cat = this._selectedCategory();
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
    this._search.set((event.target as HTMLInputElement).value);
    this.saveFiltersToStorage();
  }

  onCategoryChange(event: Event) {
    this._selectedCategory.set((event.target as HTMLSelectElement).value);
    this.saveFiltersToStorage();
  }

  onCategoryChangeValue(value: string) {
    this._selectedCategory.set(value);
    this.saveFiltersToStorage();
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
    this._search.set('');
    this._selectedCategory.set('all');
    this.saveFiltersToStorage();
  }

  private loadFiltersFromStorage() {
    const saved = localStorage.getItem('bannersFilters');
    if (saved) {
      try {
        const filters = JSON.parse(saved);
        this._search.set(filters.search || '');
        this._selectedCategory.set(filters.category || 'all');
      } catch (e) {
        console.error('Error loading filters from localStorage', e);
      }
    }
  }

  saveFiltersToStorage() {
    const filters = {
      search: this._search(),
      category: this._selectedCategory(),
    };
    localStorage.setItem('bannersFilters', JSON.stringify(filters));
  }
}
