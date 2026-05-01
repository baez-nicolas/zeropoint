export interface VehicleCosmeticType {
  value: string;
  displayValue: string;
  backendValue: string;
}

export interface VehicleCosmeticRarity {
  value: string;
  displayValue: string;
  backendValue: string;
}

export interface VehicleCosmeticSeries {
  value: string;
  image: string;
  colors: string[];
  backendValue: string;
}

export interface VehicleCosmeticImages {
  small: string;
  large: string;
}

export interface VehicleCosmetic {
  id: string;
  vehicleId: string;
  name: string;
  description: string;
  type: VehicleCosmeticType;
  rarity: VehicleCosmeticRarity;
  images: VehicleCosmeticImages;
  series?: VehicleCosmeticSeries;
  added: string;
}
