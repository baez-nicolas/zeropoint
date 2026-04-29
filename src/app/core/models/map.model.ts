export interface MapData {
  id: string;
  name: string;
  image: string;
  pois: POI[];
}

export interface POI {
  id: string;
  name: string;
  location: {
    x: number;
    y: number;
  };
}
