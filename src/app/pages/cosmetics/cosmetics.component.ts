import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cosmetic } from '../../core/models/cosmetic.model';
import { CosmeticService } from '../../core/services/cosmetic.service';
import { PageLoadingService } from '../../core/services/page-loading.service';

const COSMETIC_ITEM_LIMIT = 500;

@Component({
  selector: 'app-cosmetics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cosmetics.component.html',
  styleUrls: ['./cosmetics.component.scss'],
})
export class CosmeticsComponent implements OnInit {
  allCosmetics = signal<Cosmetic[]>([]);
  loading = signal(true);
  error = signal(false);
  showScrollTop = signal(false);

  private _search = signal('');
  private _selectedType = signal('all');
  private _selectedSeries = signal('all');
  private _selectedChapter = signal('all');
  private _selectedSeason = signal('all');
  private _sortBy = signal('default');

  get search() {
    return this._search();
  }
  set search(value: string) {
    this._search.set(value);
  }

  get selectedType() {
    return this._selectedType();
  }
  set selectedType(value: string) {
    this._selectedType.set(value);
  }

  get selectedSeries() {
    return this._selectedSeries();
  }
  set selectedSeries(value: string) {
    this._selectedSeries.set(value);
  }

  get selectedChapter() {
    return this._selectedChapter();
  }
  set selectedChapter(value: string) {
    this._selectedChapter.set(value);
  }

  get selectedSeason() {
    return this._selectedSeason();
  }
  set selectedSeason(value: string) {
    this._selectedSeason.set(value);
  }

  get sortBy() {
    return this._sortBy();
  }
  set sortBy(value: string) {
    this._sortBy.set(value);
  }

  selectedCosmetic = signal<Cosmetic | null>(null);
  modalClosing = signal(false);

  readonly LIMIT = COSMETIC_ITEM_LIMIT;

  hasActiveFilters = computed(() => {
    return (
      this._search() !== '' ||
      this._selectedType() !== 'all' ||
      this._selectedSeries() !== 'all' ||
      this._selectedChapter() !== 'all' ||
      this._selectedSeason() !== 'all' ||
      this._sortBy() !== 'default'
    );
  });

  constructor(
    private cosmeticService: CosmeticService,
    private pageLoadingService: PageLoadingService,
  ) {}

  ngOnInit() {
    this.loadFiltersFromStorage();

    this.pageLoadingService.setLoading(true);
    this.cosmeticService.getCosmetics().subscribe({
      next: (data) => {
        const filtered = data.filter((c) => {
          const nameValue = c.name?.toLowerCase() || '';
          return (
            !nameValue.includes('null') && !nameValue.includes('npc') && !nameValue.includes('tbd')
          );
        });
        this.allCosmetics.set(filtered);
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

  get types(): string[] {
    return [
      ...new Set(
        this.allCosmetics()
          .map((c) => c.type?.value)
          .filter(Boolean),
      ),
    ].sort();
  }

  get seriesList(): string[] {
    return [
      ...new Set(
        this.allCosmetics()
          .map((c) => c.series?.value)
          .filter(Boolean) as string[],
      ),
    ].sort();
  }

  get chapters(): string[] {
    return [
      ...new Set(
        this.allCosmetics()
          .map((c) => c.introduction?.chapter)
          .filter(Boolean) as string[],
      ),
    ].sort((a, b) => Number(a) - Number(b));
  }

  get seasons(): string[] {
    const chapter = this.selectedChapter;
    let cosmetics = this.allCosmetics();

    if (chapter !== 'all') {
      cosmetics = cosmetics.filter((c) => c.introduction?.chapter === chapter);
    }

    const all = cosmetics.map((c) => c.introduction?.season).filter(Boolean) as string[];
    const unique = [...new Set(all)];
    return unique.sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      if (!isNaN(na)) return -1;
      if (!isNaN(nb)) return 1;
      return a.localeCompare(b);
    });
  }

  get filtered(): Cosmetic[] {
    const q = this._search().toLowerCase().trim();
    const type = this._selectedType();
    const series = this._selectedSeries();
    const chapter = this._selectedChapter();
    const season = this._selectedSeason();
    const sortBy = this._sortBy();

    const noFilters =
      !q && type === 'all' && series === 'all' && chapter === 'all' && season === 'all';

    return this.allCosmetics()
      .filter((c) => {
        if (q) {
          const nameMatch = c.name?.toLowerCase().includes(q);
          const setMatch = c.set?.value?.toLowerCase().includes(q);
          if (!nameMatch && !setMatch) return false;
        }
        if (type !== 'all' && c.type?.value !== type) return false;
        if (series === 'no-series' && c.series) return false;
        if (series !== 'all' && series !== 'no-series' && c.series?.value !== series) return false;
        if (chapter !== 'all' && c.introduction?.chapter !== chapter) return false;
        if (season !== 'all' && c.introduction?.season !== season) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          const dateA = new Date(a.added).getTime();
          const dateB = new Date(b.added).getTime();
          return dateB - dateA;
        }

        const seriesPriority = (series: string | undefined): number => {
          if (!series) return 999;
          const lower = series.toLowerCase();
          if (lower.includes('icon')) return 1;
          if (lower.includes('marvel')) return 2;
          if (lower.includes('star wars')) return 3;
          if (lower.includes('gaming')) return 4;
          if (lower.includes('dc')) return 5;
          return 10;
        };

        const aSeries = seriesPriority(a.series?.value);
        const bSeries = seriesPriority(b.series?.value);

        if (aSeries !== bSeries) return aSeries - bSeries;

        if (aSeries < 10 && bSeries < 10) {
          return (a.name || '').localeCompare(b.name || '');
        }

        if (a.series?.value && b.series?.value && a.series.value === b.series.value) {
          return (a.name || '').localeCompare(b.name || '');
        }

        return (a.series?.value || '').localeCompare(b.series?.value || '');
      })
      .slice(0, this.LIMIT);
  }

  get totalFiltered(): number {
    const q = this._search().toLowerCase().trim();
    const type = this._selectedType();
    const series = this._selectedSeries();
    const chapter = this._selectedChapter();
    const season = this._selectedSeason();
    const sortBy = this.sortBy;

    const noFilters =
      !q && type === 'all' && series === 'all' && chapter === 'all' && season === 'all';

    return this.allCosmetics().filter((c) => {
      if (q) {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const setMatch = c.set?.value?.toLowerCase().includes(q);
        if (!nameMatch && !setMatch) return false;
      }
      if (type !== 'all' && c.type?.value !== type) return false;
      if (series === 'no-series' && c.series) return false;
      if (series !== 'all' && series !== 'no-series' && c.series?.value !== series) return false;
      if (chapter !== 'all' && c.introduction?.chapter !== chapter) return false;
      if (season !== 'all' && c.introduction?.season !== season) return false;
      return true;
    }).length;
  }

  get isLimitReached(): boolean {
    return this.totalFiltered > this.LIMIT;
  }

  onSearch(event: Event) {
    this._search.set((event.target as HTMLInputElement).value);
    this.saveFiltersToStorage();
  }

  onTypeChange(event: Event) {
    this._selectedType.set((event.target as HTMLSelectElement).value);
    this.saveFiltersToStorage();
  }

  onSeriesChange(event: Event) {
    this._selectedSeries.set((event.target as HTMLSelectElement).value);
    this.saveFiltersToStorage();
  }

  onChapterChange(event: Event) {
    this._selectedChapter.set((event.target as HTMLSelectElement).value);
    this._selectedSeason.set('all');
    this.saveFiltersToStorage();
  }

  onSeasonChange(event: Event) {
    this._selectedSeason.set((event.target as HTMLSelectElement).value);
    this.saveFiltersToStorage();
  }

  onSortChange(event: Event) {
    this._sortBy.set((event.target as HTMLSelectElement).value);
    this.saveFiltersToStorage();
  }

  onChapterChangeValue(value: string) {
    this._selectedChapter.set(value);
    this._selectedSeason.set('all');
    this.saveFiltersToStorage();
  }

  onSeasonChangeValue(value: string) {
    this._selectedSeason.set(value);
    this.saveFiltersToStorage();
  }

  onSeriesChangeValue(value: string) {
    this._selectedSeries.set(value);
    this.saveFiltersToStorage();
  }

  onTypeChangeValue(value: string) {
    this._selectedType.set(value);
    this.saveFiltersToStorage();
  }

  onSortChangeValue(value: string) {
    this._sortBy.set(value);
    this.saveFiltersToStorage();
  }

  openModal(c: Cosmetic) {
    this.selectedCosmetic.set(c);
    this.modalClosing.set(false);
  }

  closeModal() {
    this.modalClosing.set(true);
    setTimeout(() => {
      this.selectedCosmetic.set(null);
      this.modalClosing.set(false);
    }, 200);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters() {
    this._search.set('');
    this._selectedType.set('all');
    this._selectedSeries.set('all');
    this._selectedChapter.set('all');
    this._selectedSeason.set('all');
    this._sortBy.set('default');
    this.saveFiltersToStorage();
  }

  private loadFiltersFromStorage() {
    const saved = localStorage.getItem('cosmeticsFilters');
    if (saved) {
      try {
        const filters = JSON.parse(saved);
        this._search.set(filters.search || '');
        this._selectedType.set(filters.type || 'all');
        this._selectedSeries.set(filters.series || 'all');
        this._selectedChapter.set(filters.chapter || 'all');
        this._selectedSeason.set(filters.season || 'all');
        this._sortBy.set(filters.sortBy || 'default');
      } catch (e) {
        console.error('Error loading filters from localStorage', e);
      }
    }
  }

  saveFiltersToStorage() {
    const filters = {
      search: this._search(),
      type: this._selectedType(),
      series: this._selectedSeries(),
      chapter: this._selectedChapter(),
      season: this._selectedSeason(),
      sortBy: this._sortBy(),
    };
    localStorage.setItem('cosmeticsFilters', JSON.stringify(filters));
  }

  getImage(c: Cosmetic): string {
    return c.images?.icon || c.images?.smallIcon || '';
  }

  getRarityClass(rarity: string | undefined): string {
    const map: Record<string, string> = {
      common: 'rarity-common',
      uncommon: 'rarity-uncommon',
      rare: 'rarity-rare',
      epic: 'rarity-epic',
      legendary: 'rarity-legendary',
      marvel: 'rarity-marvel',
      dc: 'rarity-dc',
      icon: 'rarity-icon',
      gaminglegends: 'rarity-gaming',
      starwars: 'rarity-starwars',
    };
    return map[rarity ?? ''] ?? 'rarity-common';
  }

  formatTypeLabel(value: string): string {
    if (!value) return value;

    const map: Record<string, string> = {
      outfit: 'Outfit',
      backpack: 'Back Bling',
      pickaxe: 'Pickaxe',
      glider: 'Glider',
      contrail: 'Contrail',
      emote: 'Emote',
      emoji: 'Emoticon',
      spray: 'Spray',
      wrap: 'Wrap',
      loadingscreen: 'Loading Screen',
      music: 'Music Pack',
      pet: 'Pet',
      petcarrier: 'Pet Carrier',
      toy: 'Toy',
      banner: 'Banner',
    };

    const mapped = map[value.toLowerCase()];
    if (mapped) return mapped;

    return value
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatSeriesLabel(value: string): string {
    if (!value) return value;
    return value
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
