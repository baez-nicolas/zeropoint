import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MapData } from '../models/map.model';

@Injectable({ providedIn: 'root' })
export class MapService {
  private readonly url = 'https://fortnite-api.com/v1/map';

  constructor(private http: HttpClient) {}

  getMap(): Observable<MapData> {
    return this.http.get<{ status: number; data: MapData }>(this.url).pipe(map((res) => res.data));
  }
}
