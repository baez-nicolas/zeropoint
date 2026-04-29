import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Playlist } from '../models/playlist.model';

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private readonly url = 'https://fortnite-api.com/v1/playlists';

  constructor(private http: HttpClient) {}

  getPlaylists(): Observable<Playlist[]> {
    return this.http
      .get<{ status: number; data: Playlist[] }>(this.url)
      .pipe(map((res) => res.data.filter((p) => !!p.images?.showcase)));
  }
}
