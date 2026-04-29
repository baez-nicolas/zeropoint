export interface MapLocation {
  x: number;
  y: number;
  z: number;
}

export interface MapPoi {
  id: string;
  name: string;
  location: MapLocation;
}

export interface MapImages {
  blank: string;
  pois: string;
}

export interface MapData {
  images: MapImages;
  pois: MapPoi[];
}
