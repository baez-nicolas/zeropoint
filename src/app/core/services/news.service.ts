import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NewsResponse } from '../models/news.model';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly url = 'https://fortnite-api.com/v2/news';

  constructor(private http: HttpClient) {}

  getNews(): Observable<NewsResponse> {
    return this.http
      .get<{ status: number; data: NewsResponse }>(this.url)
      .pipe(map((res) => res.data));
  }
}
