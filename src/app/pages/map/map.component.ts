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
  poiModalOpen = signal(false);
  poiModalClosing = signal(false);
  mapModalOpen = signal(false);
  mapModalClosing = signal(false);
  mapZoomLevel = signal(1);
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

  selectPoiMobile(poi: MapPoi) {
    this.selectPoi(poi);
    this.openPoiModal();
  }

  openPoiModal() {
    this.poiModalOpen.set(true);
    this.poiModalClosing.set(false);
  }

  closePoiModal() {
    this.poiModalClosing.set(true);
    setTimeout(() => {
      this.poiModalOpen.set(false);
      this.poiModalClosing.set(false);
    }, 300);
  }

  openMapModal() {
    this.mapModalOpen.set(true);
    this.mapModalClosing.set(false);
    this.mapZoomLevel.set(1);
  }

  closeMapModal() {
    this.mapModalClosing.set(true);
    setTimeout(() => {
      this.mapModalOpen.set(false);
      this.mapModalClosing.set(false);
      this.mapZoomLevel.set(1);
    }, 300);
  }

  zoomIn() {
    const current = this.mapZoomLevel();
    if (current < 3) {
      this.mapZoomLevel.set(current + 0.5);
    }
  }

  zoomOut() {
    const current = this.mapZoomLevel();
    if (current > 1) {
      this.mapZoomLevel.set(current - 0.5);
    }
  }

  resetZoom() {
    this.mapZoomLevel.set(1);
  }
}
