import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cosmetic, CosmeticSeries } from '../../core/models/cosmetic.model';
import { VehicleCosmetic } from '../../core/models/vehicle-cosmetic.model';
import { CosmeticService } from '../../core/services/cosmetic.service';
import { PageLoadingService } from '../../core/services/page-loading.service';
import { VehicleCosmeticService } from '../../core/services/vehicle-cosmetic.service';

const COSMETIC_ITEM_LIMIT = 500;

@Component({
  selector: 'app-cosmetics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cosmetics.component.html',
  styleUrls: ['./cosmetics.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, height: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ opacity: 1, height: '*' })),
      ]),
      transition(':leave', [
        style({ opacity: 1, height: '*', overflow: 'hidden' }),
        animate('300ms ease-in', style({ opacity: 0, height: 0 })),
      ]),
    ]),
  ],
})
export class CosmeticsComponent implements OnInit {
  allCosmetics = signal<Cosmetic[]>([]);
  allVehicleCosmetics = signal<VehicleCosmetic[]>([]);
  loading = signal(true);
  error = signal(false);
  showScrollTop = signal(false);

  private _search = signal('');
  private _selectedType = signal('all');
  private _selectedVehicleType = signal('all');
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

  get selectedVehicleType() {
    return this._selectedVehicleType();
  }
  set selectedVehicleType(value: string) {
    this._selectedVehicleType.set(value);
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

  selectedCosmetic = signal<Cosmetic | VehicleCosmetic | null>(null);
  modalClosing = signal(false);
  filtersModalOpen = signal(false);
  filtersModalClosing = signal(false);

  readonly LIMIT = COSMETIC_ITEM_LIMIT;

  hasActiveFilters = computed(() => {
    return (
      this._search() !== '' ||
      this._selectedType() !== 'all' ||
      this._selectedVehicleType() !== 'all' ||
      this._selectedSeries() !== 'all' ||
      this._selectedChapter() !== 'all' ||
      this._selectedSeason() !== 'all' ||
      this._sortBy() !== 'default'
    );
  });

  constructor(
    private cosmeticService: CosmeticService,
    private vehicleCosmeticService: VehicleCosmeticService,
    private pageLoadingService: PageLoadingService,
  ) {}

  ngOnInit() {
    this.loadFiltersFromStorage();

    this.pageLoadingService.setLoading(true);

    let cosmeticsLoaded = false;
    let vehiclesLoaded = false;

    const checkAllLoaded = () => {
      if (cosmeticsLoaded && vehiclesLoaded) {
        this.loading.set(false);
        this.pageLoadingService.setLoading(false);
      }
    };

    this.cosmeticService.getCosmetics().subscribe({
      next: (data) => {
        const filtered = data.filter((c) => {
          const nameValue = c.name?.toLowerCase() || '';
          return (
            !nameValue.includes('null') && !nameValue.includes('npc') && !nameValue.includes('tbd')
          );
        });
        this.allCosmetics.set(filtered);
        cosmeticsLoaded = true;
        checkAllLoaded();
      },
      error: () => {
        this.error.set(true);
        cosmeticsLoaded = true;
        checkAllLoaded();
      },
    });

    this.vehicleCosmeticService.getVehicleCosmetics().subscribe({
      next: (data) => {
        this.allVehicleCosmetics.set(data);
        vehiclesLoaded = true;
        checkAllLoaded();
      },
      error: () => {
        vehiclesLoaded = true;
        checkAllLoaded();
      },
    });

    window.addEventListener('scroll', () => {
      this.showScrollTop.set(window.scrollY > 400);
    });
  }

  get types(): string[] {
    const regularTypes = [
      ...new Set(
        this.allCosmetics()
          .map((c) => c.type?.value)
          .filter((type) => type && type !== 'pet' && type !== 'banner'),
      ),
    ].sort();
    return [...regularTypes, 'vehicles'];
  }

  get vehicleTypes(): string[] {
    const typeOrder = ['body', 'wheel', 'drifttrail', 'decal'];
    const availableTypes = [
      ...new Set(
        this.allVehicleCosmetics()
          .map((v) => v.type?.value)
          .filter(Boolean) as string[],
      ),
    ];
    return typeOrder.filter((type) => availableTypes.includes(type));
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

  get filtered(): (Cosmetic | VehicleCosmetic)[] {
    const q = this._search().toLowerCase().trim();
    const type = this._selectedType();
    const vehicleType = this._selectedVehicleType();
    const series = this._selectedSeries();
    const chapter = this._selectedChapter();
    const season = this._selectedSeason();
    const sortBy = this._sortBy();

    if (type === 'vehicles') {
      return this.allVehicleCosmetics()
        .filter((v) => {
          if (!v.name || !v.type || !v.rarity || !v.images) return false;
          if (v.name.toLowerCase() === 'null') return false;
          if (!v.description || v.description.toLowerCase() === 'null') return false;
          if (q && !v.name?.toLowerCase().includes(q)) return false;
          if (vehicleType !== 'all' && v.type?.value !== vehicleType) return false;
          return true;
        })
        .sort((a, b) => {
          const typeOrder = ['body', 'wheel', 'drifttrail', 'decal'];
          const aIndex = typeOrder.indexOf(a.type?.value || '');
          const bIndex = typeOrder.indexOf(b.type?.value || '');

          if (aIndex !== bIndex) {
            return aIndex - bIndex;
          }

          if (sortBy === 'newest') {
            return new Date(b.added).getTime() - new Date(a.added).getTime();
          }

          return (a.name || '').localeCompare(b.name || '');
        })
        .slice(0, this.LIMIT);
    }

    const filteredCosmetics = this.allCosmetics().filter((c) => {
      if (c.type?.value === 'pet') return false;
      if (c.type?.value === 'banner') return false;
      if (q) {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const setMatch = c.set?.value?.toLowerCase().includes(q);
        if (!nameMatch && !setMatch) return false;
      }
      if (type !== 'all' && type !== 'vehicles' && c.type?.value !== type) return false;
      if (series === 'no-series' && c.series) return false;
      if (series !== 'all' && series !== 'no-series' && c.series?.value !== series) return false;
      if (chapter !== 'all' && c.introduction?.chapter !== chapter) return false;
      if (season !== 'all' && c.introduction?.season !== season) return false;
      return true;
    });

    if (type === 'all' && chapter === 'all' && season === 'all' && series === 'all' && !q) {
      const filteredVehicles = this.allVehicleCosmetics().filter((v) => {
        if (!v.name || !v.type || !v.rarity || !v.images) return false;
        if (v.name.toLowerCase() === 'null') return false;
        if (!v.description || v.description.toLowerCase() === 'null') return false;
        return true;
      });

      return [...filteredCosmetics, ...filteredVehicles]
        .sort((a, b) => {
          if (sortBy === 'newest') {
            const dateA = new Date(a.added).getTime();
            const dateB = new Date(b.added).getTime();
            return dateB - dateA;
          }
          return (a.name || '').localeCompare(b.name || '');
        })
        .slice(0, this.LIMIT);
    }

    return filteredCosmetics
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
    const vehicleType = this._selectedVehicleType();
    const series = this._selectedSeries();
    const chapter = this._selectedChapter();
    const season = this._selectedSeason();

    if (type === 'vehicles') {
      return this.allVehicleCosmetics().filter((v) => {
        if (!v.name || !v.type || !v.rarity || !v.images) return false;
        if (v.name.toLowerCase() === 'null') return false;
        if (!v.description || v.description.toLowerCase() === 'null') return false;
        if (q && !v.name?.toLowerCase().includes(q)) return false;
        if (vehicleType !== 'all' && v.type?.value !== vehicleType) return false;
        return true;
      }).length;
    }

    const cosmeticsCount = this.allCosmetics().filter((c) => {
      if (c.type?.value === 'pet') return false;
      if (q) {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const setMatch = c.set?.value?.toLowerCase().includes(q);
        if (!nameMatch && !setMatch) return false;
      }
      if (type !== 'all' && type !== 'vehicles' && c.type?.value !== type) return false;
      if (series === 'no-series' && c.series) return false;
      if (series !== 'all' && series !== 'no-series' && c.series?.value !== series) return false;
      if (chapter !== 'all' && c.introduction?.chapter !== chapter) return false;
      if (season !== 'all' && c.introduction?.season !== season) return false;
      return true;
    }).length;

    if (type === 'all' && chapter === 'all' && season === 'all' && series === 'all' && !q) {
      const vehiclesCount = this.allVehicleCosmetics().filter((v) => {
        if (!v.name || !v.type || !v.rarity || !v.images) return false;
        if (v.name.toLowerCase() === 'null') return false;
        if (!v.description || v.description.toLowerCase() === 'null') return false;
        return true;
      }).length;

      return cosmeticsCount + vehiclesCount;
    }

    return cosmeticsCount;
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
    if (value !== 'vehicles') {
      this._selectedVehicleType.set('all');
    } else {
      this._selectedChapter.set('all');
      this._selectedSeason.set('all');
      this._selectedSeries.set('all');
    }
    this.saveFiltersToStorage();
  }

  onVehicleTypeChangeValue(value: string) {
    this._selectedVehicleType.set(value);
    this.saveFiltersToStorage();
  }

  onSortChangeValue(value: string) {
    this._sortBy.set(value);
    this.saveFiltersToStorage();
  }

  openModal(c: Cosmetic | VehicleCosmetic) {
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

  openFiltersModal() {
    this.filtersModalOpen.set(true);
    this.filtersModalClosing.set(false);
  }

  closeFiltersModal() {
    this.filtersModalClosing.set(true);
    setTimeout(() => {
      this.filtersModalOpen.set(false);
      this.filtersModalClosing.set(false);
    }, 300);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters() {
    this._search.set('');
    this._selectedType.set('all');
    this._selectedVehicleType.set('all');
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
        this._selectedVehicleType.set(filters.vehicleType || 'all');
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
      vehicleType: this._selectedVehicleType(),
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
      vehicles: 'Vehicles',
      body: 'Body',
      wheel: 'Wheels',
      drifttrail: 'Trail',
      decal: 'Decal',
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

  isVehicleCosmetic(item: Cosmetic | VehicleCosmetic | null): item is VehicleCosmetic {
    return item !== null && 'vehicleId' in item;
  }

  getVehicleImage(v: VehicleCosmetic): string {
    return v.images?.small || v.images?.large || '';
  }

  getItemImage(item: Cosmetic | VehicleCosmetic): string {
    if (this.isVehicleCosmetic(item)) {
      return this.getVehicleImage(item);
    }
    return this.getImage(item);
  }

  formatVehicleTypeLabel(value: string): string {
    const map: Record<string, string> = {
      body: 'Body',
      wheel: 'Wheels',
      drifttrail: 'Trail',
      decal: 'Decal',
    };
    return map[value.toLowerCase()] || value;
  }

  getSelectedCosmeticFeaturedImage(): string | null {
    const selected = this.selectedCosmetic();
    if (!selected || this.isVehicleCosmetic(selected)) return null;
    return (selected as Cosmetic).images?.featured || null;
  }

  getSelectedCosmeticSet(): { value: string; text: string; backendValue: string } | null {
    const selected = this.selectedCosmetic();
    if (!selected || this.isVehicleCosmetic(selected)) return null;
    return (selected as Cosmetic).set || null;
  }

  getSelectedCosmeticIntroduction(): {
    chapter: string;
    season: string;
    text: string;
    backendValue: number;
  } | null {
    const selected = this.selectedCosmetic();
    if (!selected || this.isVehicleCosmetic(selected)) return null;
    return (selected as Cosmetic).introduction || null;
  }

  getSelectedCosmeticShowcaseVideo(): string | null {
    const selected = this.selectedCosmetic();
    if (!selected || this.isVehicleCosmetic(selected)) return null;
    return (selected as Cosmetic).showcaseVideo || null;
  }

  getSelectedCosmeticVariants(): any[] {
    const selected = this.selectedCosmetic();
    if (!selected || this.isVehicleCosmetic(selected)) return [];
    return (selected as Cosmetic).variants || [];
  }

  getSelectedCosmeticSeries(): CosmeticSeries | null {
    const selected = this.selectedCosmetic();
    if (!selected || this.isVehicleCosmetic(selected)) return null;
    return (selected as Cosmetic).series || null;
  }
}
