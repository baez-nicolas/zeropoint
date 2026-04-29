export interface PlaylistImages {
  showcase: string;
  missionIcon: string;
}

export interface Playlist {
  id: string;
  name: string;
  subName?: string;
  description?: string;
  gameType: string;
  ratingType?: string;
  minPlayers: number;
  maxPlayers: number;
  maxTeams: number;
  maxTeamSize: number;
  isDefault: boolean;
  isTournament: boolean;
  isLimitedTimeMode: boolean;
  accumulateToProfileStats: boolean;
  images?: PlaylistImages;
  gameplayTags?: string[];
  added: string;
}
