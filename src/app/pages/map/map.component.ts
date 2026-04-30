import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MapData, MapPoi } from '../../core/models/map.model';
import { MapService } from '../../core/services/map.service';
import { PageLoadingService } from '../../core/services/page-loading.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnDestroy {
  mapData = signal<MapData | null>(null);
  loading = signal(true);
  error = signal(false);
  selectedPoi = signal<MapPoi | null>(null);
  animatingPoiId = signal<string | null>(null);
  private animationTimeout?: number;

  constructor(
    private mapService: MapService,
    private pageLoadingService: PageLoadingService,
  ) {}

  ngOnInit() {
    this.pageLoadingService.setLoading(true);

    this.mapService.getMap().subscribe({
      next: (data) => {
        this.mapData.set(data);
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

  ngOnDestroy() {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }
  }

  selectPoi(poi: MapPoi) {
    this.selectedPoi.set(poi);
    this.animatingPoiId.set(poi.id);

    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }

    this.animationTimeout = window.setTimeout(() => {
      this.animatingPoiId.set(null);
    }, 1000);
  }
}
