import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { VehicleCosmetic } from '../models/vehicle-cosmetic.model';

@Injectable({
  providedIn: 'root',
})
export class VehicleCosmeticService {
  private readonly apiUrl = 'https://fortnite-api.com/v2/cosmetics/cars';

  constructor(private http: HttpClient) {}

  getVehicleCosmetics(): Observable<VehicleCosmetic[]> {
    return this.http
      .get<{ status: number; data: VehicleCosmetic[] }>(this.apiUrl)
      .pipe(map((response) => response.data));
  }
}
