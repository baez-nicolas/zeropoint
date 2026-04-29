import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private apiUrl = 'https://fortnite-api.com/v1/map';

  constructor(private http: HttpClient) {}

  getMap(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
