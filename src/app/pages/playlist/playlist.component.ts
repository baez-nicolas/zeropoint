import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { Playlist } from '../../core/models/playlist.model';
import { PageLoadingService } from '../../core/services/page-loading.service';
import { PlaylistService } from '../../core/services/playlist.service';

export interface PlaylistGroup {
  baseName: string;
  variants: Playlist[];
  images: { showcase: string; missionIcon: string } | undefined;
  gameType: string;
  description: string | undefined;
  isNoBuild: boolean;
  isTournament: boolean;
}

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss'],
})
export class PlaylistComponent implements OnInit {
  playlists = signal<Playlist[]>([]);
  loading = signal(true);
  error = signal(false);
  search = signal('');
  selectedGameType = signal('all');
  selectedPlaylist = signal<PlaylistGroup | null>(null);
  modalClosing = signal(false);

  hasActiveFilters = computed(() => {
    return this.search() !== '' || this.selectedGameType() !== 'all';
  });

  constructor(
    private playlistService: PlaylistService,
    private pageLoadingService: PageLoadingService,
  ) {}

  ngOnInit() {
    this.pageLoadingService.setLoading(true);

    this.playlistService.getPlaylists().subscribe({
      next: (data) => {
        this.playlists.set(data);
        this.loading.set(false);
        this.pageLoadingService.setLoading(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
        this.pageLoadingService.setLoading(false);
      },
    });
  }

  get gameTypes(): string[] {
    const types = [...new Set(this.playlists().map((p) => this.formatGameType(p.gameType)))];
    return types.sort();
  }

  get filtered(): PlaylistGroup[] {
    const q = this.search().toLowerCase();
    const gt = this.selectedGameType();

    const filteredPlaylists = this.playlists().filter((p) => {
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q);
      const matchType = gt === 'all' || this.formatGameType(p.gameType) === gt;
      return matchSearch && matchType;
    });

    const groups = new Map<string, Playlist[]>();

    filteredPlaylists.forEach((p) => {
      const key = this.getGroupKey(p);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(p);
    });

    return Array.from(groups.entries()).map(([key, variants]) => {
      const first = variants[0];
      return {
        baseName: this.getDisplayName(variants),
        variants: variants.sort((a, b) => a.maxTeamSize - b.maxTeamSize),
        images: first.images,
        gameType: first.gameType,
        description: first.description,
        isNoBuild: this.isNoBuild(first),
        isTournament: this.isTournament(first),
      };
    });
  }

  getGroupKey(playlist: Playlist): string {
    const name = playlist.name;
    const gt = playlist.gameType;

    if (/^(Solo|Duos?|Trios?|Squads?)$/i.test(name)) {
      const noBuild = this.isNoBuild(playlist) ? 'nobuild' : 'build';
      return `${gt}_${noBuild}_standard`;
    }

    const baseName = name
      .replace(/^(Midas Presents:|Season \d+:)\s*/i, '')
      .replace(/\s*-\s*(Solo|Duos?|Trios?|Squads?|Late Game)$/i, '')
      .replace(/\s*\((Solo|Duos?|Trios?|Squads?)\)$/i, '')
      .replace(/\s*(Disarmed|Armed)$/i, '')
      .trim()
      .toLowerCase();

    return `${gt}_${baseName}`;
  }

  getDisplayName(variants: Playlist[]): string {
    const sorted = [...variants].sort((a, b) => b.name.length - a.name.length);
    let name = sorted[0].name;

    name = name
      .replace(/\s*-\s*(Solo|Duos?|Trios?|Squads?|Late Game)$/i, '')
      .replace(/\s*\((Solo|Duos?|Trios?|Squads?)\)$/i, '')
      .trim();

    if (!name || /^(Solo|Duos?|Trios?|Squads?)$/i.test(name)) {
      const first = variants[0];
      if (this.isNoBuild(first)) {
        return 'Zero Build';
      }
      return 'Battle Royale';
    }

    return name;
  }

  getBaseName(name: string): string {
    return name
      .replace(/\s*-\s*(Solo|Duos?|Trios?|Squads?|Late Game)$/i, '')
      .replace(/\s*\((Solo|Duos?|Trios?|Squads?)\)$/i, '')
      .trim();
  }

  formatGameType(raw: string): string {
    return raw.replace('EFortGameType::', '');
  }

  onSearch(event: Event) {
    this.search.set((event.target as HTMLInputElement).value);
  }

  onGameTypeChange(event: Event) {
    this.selectedGameType.set((event.target as HTMLSelectElement).value);
  }

  getTeamLabel(p: Playlist): string {
    if (p.maxTeamSize === 1) return 'Solo';
    if (p.maxTeamSize === 2) return 'Duo';
    if (p.maxTeamSize === 3) return 'Trio';
    if (p.maxTeamSize === 4) return 'Squad';
    return `${p.maxTeamSize} players`;
  }

  isNoBuild(p: Playlist): boolean {
    return (p.gameplayTags ?? []).some((t) => t.toLowerCase().includes('nobuild'));
  }

  isTournament(p: Playlist): boolean {
    return p.isTournament;
  }

  openModal(group: PlaylistGroup) {
    this.selectedPlaylist.set(group);
    this.modalClosing.set(false);
  }

  closeModal() {
    this.modalClosing.set(true);
    setTimeout(() => {
      this.selectedPlaylist.set(null);
      this.modalClosing.set(false);
    }, 200);
  }

  clearFilters() {
    this.search.set('');
    this.selectedGameType.set('all');
  }
}
