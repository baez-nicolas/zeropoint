import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
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
export class MapComponent implements OnInit {
  mapData = signal<MapData | null>(null);
  loading = signal(true);
  error = signal(false);
  selectedPoi = signal<MapPoi | null>(null);

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
}
