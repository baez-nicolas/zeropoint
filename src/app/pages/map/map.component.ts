import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { MapData, MapPoi } from '../../core/models/map.model';
import { MapService } from '../../core/services/map.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  mapData = signal<MapData | null>(null);
  loading = signal(true);
  error = signal(false);
  selectedPoi = signal<MapPoi | null>(null);

  private readonly MAP_WORLD_MIN_X = -130000;
  private readonly MAP_WORLD_MAX_X = 130000;
  private readonly MAP_WORLD_MIN_Y = -130000;
  private readonly MAP_WORLD_MAX_Y = 130000;

  constructor(private mapService: MapService) {}

  ngOnInit() {
    this.mapService.getMap().subscribe({
      next: (data) => {
        this.mapData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  ngAfterViewInit() {}

  getPoiPosition(poi: MapPoi): { left: string; top: string } {
    const px =
      ((poi.location.x - this.MAP_WORLD_MIN_X) / (this.MAP_WORLD_MAX_X - this.MAP_WORLD_MIN_X)) *
      100;
    const py =
      ((poi.location.y * -1 - this.MAP_WORLD_MIN_Y) /
        (this.MAP_WORLD_MAX_Y - this.MAP_WORLD_MIN_Y)) *
      100;
    return {
      left: `${Math.min(Math.max(px, 1), 99)}%`,
      top: `${Math.min(Math.max(py, 1), 99)}%`,
    };
  }

  selectPoi(poi: MapPoi, event: MouseEvent) {
    event.stopPropagation();
    this.selectedPoi.set(this.selectedPoi()?.id === poi.id ? null : poi);
  }

  clearSelection() {
    this.selectedPoi.set(null);
  }
}
