import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ShopResponse } from '../models/shop.model';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly url = 'https://fortnite-api.com/v2/shop';

  constructor(private http: HttpClient) {}

  getShop(): Observable<ShopResponse> {
    return this.http
      .get<{ status: number; data: ShopResponse }>(this.url)
      .pipe(map((res) => res.data));
  }
}
