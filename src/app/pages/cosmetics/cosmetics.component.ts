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

  search = signal('');
  selectedType = signal('all');
  selectedSeries = signal('all');
  selectedChapter = signal('all');
  selectedSeason = signal('all');
  sortBy = signal('default');

  selectedCosmetic = signal<Cosmetic | null>(null);
  modalClosing = signal(false);

  readonly LIMIT = COSMETIC_ITEM_LIMIT;

  hasActiveFilters = computed(() => {
    return (
      this.search() !== '' ||
      this.selectedType() !== 'all' ||
      this.selectedSeries() !== 'all' ||
      this.selectedChapter() !== 'all' ||
      this.selectedSeason() !== 'all' ||
      this.sortBy() !== 'default'
    );
  });

  constructor(
    private cosmeticService: CosmeticService,
    private pageLoadingService: PageLoadingService,
  ) {}

  ngOnInit() {
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
    const chapter = this.selectedChapter();
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
    const q = this.search().toLowerCase().trim();
    const type = this.selectedType();
    const series = this.selectedSeries();
    const chapter = this.selectedChapter();
    const season = this.selectedSeason();
    const sortBy = this.sortBy();

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
    const q = this.search().toLowerCase().trim();
    const type = this.selectedType();
    const series = this.selectedSeries();
    const chapter = this.selectedChapter();
    const season = this.selectedSeason();
    const sortBy = this.sortBy();

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
    this.search.set((event.target as HTMLInputElement).value);
  }

  onTypeChange(event: Event) {
    this.selectedType.set((event.target as HTMLSelectElement).value);
  }

  onSeriesChange(event: Event) {
    this.selectedSeries.set((event.target as HTMLSelectElement).value);
  }

  onChapterChange(event: Event) {
    this.selectedChapter.set((event.target as HTMLSelectElement).value);
    this.selectedSeason.set('all');
  }

  onSeasonChange(event: Event) {
    this.selectedSeason.set((event.target as HTMLSelectElement).value);
  }

  onSortChange(event: Event) {
    this.sortBy.set((event.target as HTMLSelectElement).value);
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
    this.search.set('');
    this.selectedType.set('all');
    this.selectedSeries.set('all');
    this.selectedChapter.set('all');
    this.selectedSeason.set('all');
    this.sortBy.set('default');
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
