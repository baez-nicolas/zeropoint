import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private apiUrl = 'https://fortnite-api.com/v2/shop/br';

  constructor(private http: HttpClient) {}

  getShop(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
