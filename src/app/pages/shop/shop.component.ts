import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { ShopEntry, ShopResponse } from '../../core/models/shop.model';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
})
export class ShopComponent implements OnInit {
  shop = signal<ShopResponse | null>(null);
  loading = signal(true);
  error = signal(false);
  activeLayout = signal<string>('all');

  layouts = computed(() => {
    if (!this.shop()) return [];
    const names = this.shop()!
      .entries.filter((e) => e.layout?.name)
      .map((e) => e.layout!.name);
    return ['all', ...new Set(names)];
  });

  filteredEntries = computed(() => {
    if (!this.shop()) return [];
    const entries = this.shop()!.entries.filter((e) => e.brItems?.length);
    if (this.activeLayout() === 'all') return entries;
    return entries.filter((e) => e.layout?.name === this.activeLayout());
  });

  constructor(private shopService: ShopService) {}

  ngOnInit() {
    this.shopService.getShop().subscribe({
      next: (data) => {
        this.shop.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  getEntryImage(entry: ShopEntry): string {
    if (entry.bundle?.image) return entry.bundle.image;
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

  setLayout(layout: string) {
    this.activeLayout.set(layout);
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
}
