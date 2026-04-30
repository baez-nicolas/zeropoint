import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CreatorCodeResponse {
  status: number;
  data: {
    code: string;
    account: {
      id: string;
      name: string;
    };
    status: string;
    verified: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CreatorCodeService {
  private readonly apiUrl = 'https://fortnite-api.com/v2/creatorcode';

  constructor(private http: HttpClient) {}

  getCreatorCode(code: string): Observable<CreatorCodeResponse> {
    return this.http.get<CreatorCodeResponse>(this.apiUrl, {
      params: { name: code },
    });
  }
}
