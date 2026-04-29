import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Playlist } from '../../core/models/playlist.model';
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

  constructor(private playlistService: PlaylistService) {}

  ngOnInit() {
    this.playlistService.getPlaylists().subscribe({
      next: (data) => {
        this.playlists.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
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

    // Filtrar primero
    const filteredPlaylists = this.playlists().filter((p) => {
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q);
      const matchType = gt === 'all' || this.formatGameType(p.gameType) === gt;
      return matchSearch && matchType;
    });

    // Agrupar por clave única (gameType + baseName)
    const groups = new Map<string, Playlist[]>();

    filteredPlaylists.forEach((p) => {
      const key = this.getGroupKey(p);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(p);
    });

    // Convertir a PlaylistGroup[]
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

    // Si el nombre es solo una variante (Solo, Duos, etc.), agrupar por gameType + isNoBuild
    if (/^(Solo|Duos?|Trios?|Squads?)$/i.test(name)) {
      const noBuild = this.isNoBuild(playlist) ? 'nobuild' : 'build';
      return `${gt}_${noBuild}_standard`;
    }

    // Para otros nombres, limpiar y usar como clave base
    const baseName = name
      .replace(/^(Midas Presents:|Season \d+:)\s*/i, '') // Remover prefijos
      .replace(/\s*-\s*(Solo|Duos?|Trios?|Squads?|Late Game)$/i, '') // Remover sufijos
      .replace(/\s*\((Solo|Duos?|Trios?|Squads?)\)$/i, '')
      .replace(/\s*(Disarmed|Armed)$/i, '') // Remover variantes
      .trim()
      .toLowerCase();

    return `${gt}_${baseName}`;
  }

  getDisplayName(variants: Playlist[]): string {
    // Encontrar el nombre más completo/largo
    const sorted = [...variants].sort((a, b) => b.name.length - a.name.length);
    let name = sorted[0].name;

    // Limpiar sufijos de variantes
    name = name
      .replace(/\s*-\s*(Solo|Duos?|Trios?|Squads?|Late Game)$/i, '')
      .replace(/\s*\((Solo|Duos?|Trios?|Squads?)\)$/i, '')
      .trim();

    // Si el nombre resultante está vacío o es solo una variante, usar nombre del modo
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
    // Remover sufijos como "- Solo", "- Duos", etc.
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
}
