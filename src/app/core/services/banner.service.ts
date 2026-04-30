import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Banner } from '../models/banner.model';

@Injectable({ providedIn: 'root' })
export class BannerService {
  private readonly url = 'https://fortnite-api.com/v1/banners';

  constructor(private http: HttpClient) {}

  getBanners(): Observable<Banner[]> {
    return this.http.get<{ status: number; data: Banner[] }>(this.url).pipe(map((res) => res.data));
  }
}
