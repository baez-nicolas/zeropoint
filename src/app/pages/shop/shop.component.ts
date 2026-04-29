import { CommonModule, ViewportScroller } from '@angular/common';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ShopEntry, ShopResponse } from '../../core/models/shop.model';
import { ShopService } from '../../core/services/shop.service';

interface ShopSection {
  title: string;
  entries: ShopEntry[];
  type: 'br' | 'tracks' | 'cars';
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
})
export class ShopComponent implements OnInit, OnDestroy {
  shop = signal<ShopResponse | null>(null);
  loading = signal(true);
  error = signal(false);
  showScrollTop = signal(false);
  selectedEntry = signal<ShopEntry | null>(null);
  modalClosing = signal(false);
  countdown = signal<string>('');

  private countdownInterval?: ReturnType<typeof setInterval>;

  sections = computed(() => {
    if (!this.shop()) return [];
    const sections: ShopSection[] = [];
    const entries = this.shop()!.entries;

    const layoutGroups = new Map<string, ShopEntry[]>();
    entries.forEach((entry) => {
      if (entry.brItems?.length) {
        const layoutName = entry.layout?.name ?? 'Other';
        if (!layoutGroups.has(layoutName)) layoutGroups.set(layoutName, []);
        layoutGroups.get(layoutName)!.push(entry);
      }
    });

    layoutGroups.forEach((groupEntries, layoutName) => {
      const sorted = groupEntries.sort((a, b) => {
        const hasBannerA = a.banner ? 1 : 0;
        const hasBannerB = b.banner ? 1 : 0;
        if (hasBannerB !== hasBannerA) return hasBannerB - hasBannerA;
        const priorityA = this.getItemTypePriority(a);
        const priorityB = this.getItemTypePriority(b);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return b.finalPrice - a.finalPrice;
      });
      sections.push({ title: layoutName, entries: sorted, type: 'br' });
    });

    const trackEntries = entries
      .filter((e) => e.tracks?.length && e.finalPrice <= 500)
      .sort((a, b) => b.finalPrice - a.finalPrice);
    if (trackEntries.length)
      sections.push({ title: 'Jam Tracks', entries: trackEntries, type: 'tracks' });

    const carEntries = entries
      .filter((e) => e.cars?.length)
      .sort((a, b) => b.finalPrice - a.finalPrice);
    if (carEntries.length)
      sections.push({ title: 'Vehicle Cosmetics', entries: carEntries, type: 'cars' });

    return sections;
  });

  constructor(
    private shopService: ShopService,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
  ) {
    this.viewportScroller.setOffset([0, 100]);
  }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.showScrollTop.set(window.scrollY > 400);
      });
    }

    this.shopService.getShop().subscribe({
      next: (data) => {
        this.shop.set(data);
        this.loading.set(false);
        this.route.fragment.subscribe((fragment) => {
          if (fragment) {
            setTimeout(() => this.viewportScroller.scrollToAnchor(fragment), 100);
          }
        });
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });

    // Iniciar countdown
    this.updateCountdown();
    this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  openModal(entry: ShopEntry) {
    this.selectedEntry.set(entry);
    this.modalClosing.set(false);
  }

  closeModal() {
    this.modalClosing.set(true);
    setTimeout(() => {
      this.selectedEntry.set(null);
      this.modalClosing.set(false);
    }, 200);
  }

  getItemTypePriority(entry: ShopEntry): number {
    if (entry.bundle) return 0;
    if (!entry.brItems?.length) return 999;
    const types = entry.brItems.map((item) => item.type.value.toLowerCase());
    const priorityMap: Record<string, number> = {
      outfit: 1,
      backpack: 2,
      emote: 3,
      pickaxe: 4,
      glider: 5,
      wrap: 6,
      shoes: 7,
      pet: 8,
    };
    return Math.min(...types.map((t) => priorityMap[t] ?? 999));
  }

  getEntryImage(entry: ShopEntry): string {
    if (entry.bundle?.image) return entry.bundle.image;
    const render = entry.newDisplayAsset?.renderImages?.[0]?.image;
    if (render) return render;
    return entry.brItems?.[0]?.images?.icon ?? '';
  }

  getModalImage(entry: ShopEntry): string {
    if (entry.bundle?.image) return entry.bundle.image;
    const featured = entry.brItems?.[0]?.images?.featured;
    if (featured) return featured;
    const render = entry.newDisplayAsset?.renderImages?.[0]?.image;
    if (render) return render;
    return entry.brItems?.[0]?.images?.icon ?? '';
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

  getOutDateLabel(outDate: string): string {
    const out = new Date(outDate);
    const now = new Date();
    const diffMs = out.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 24) return `Leaves in ${diffHours}h`;
    return `Leaves in ${diffDays}d`;
  }

  getDifficultyStars(value: number): number[] {
    return Array.from({ length: Math.min(value, 7) }, (_, i) => i);
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getShopDate(): string {
    const d = this.shop()?.date;
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getSectionId(section: ShopSection): string {
    return section.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  scrollToSection(sectionId: string) {
    this.viewportScroller.scrollToAnchor(sectionId);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateCountdown() {
    const now = new Date();
    const nextReset = this.getNextResetTime(now);
    const diff = nextReset.getTime() - now.getTime();

    if (diff <= 0) {
      this.countdown.set('Actualizando...');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.countdown.set(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    );
  }

  private getNextResetTime(now: Date): Date {
    // Hora Argentina (UTC-3): 21:00 = 00:00 UTC del día siguiente
    const resetHourUTC = 0; // 21:00 Argentina = 00:00 UTC
    const nowUTC = new Date(now.toISOString());

    // Crear fecha de reset para hoy a las 00:00 UTC
    const todayReset = new Date(
      Date.UTC(
        nowUTC.getUTCFullYear(),
        nowUTC.getUTCMonth(),
        nowUTC.getUTCDate(),
        resetHourUTC,
        0,
        0,
        0,
      ),
    );

    // Si ya pasó el reset de hoy, usar el de mañana
    if (nowUTC.getTime() >= todayReset.getTime()) {
      return new Date(todayReset.getTime() + 24 * 60 * 60 * 1000);
    }

    return todayReset;
  }
}
