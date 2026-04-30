import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Cosmetic } from '../models/cosmetic.model';

@Injectable({ providedIn: 'root' })
export class CosmeticService {
  private readonly url = 'https://fortnite-api.com/v2/cosmetics/br';

  constructor(private http: HttpClient) {}

  getCosmetics(): Observable<Cosmetic[]> {
    return this.http
      .get<{ status: number; data: Cosmetic[] }>(this.url)
      .pipe(map((res) => res.data));
  }
}
