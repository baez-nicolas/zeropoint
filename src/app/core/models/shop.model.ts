export interface ShopItemImage {
  smallIcon?: string;
  icon?: string;
  featured?: string;
}

export interface ShopBrItem {
  id: string;
  name: string;
  description: string;
  type: { value: string; displayValue: string };
  rarity: { value: string; displayValue: string };
  series?: { value: string; colors: string[] };
  set?: { value: string; text: string };
  images: ShopItemImage;
}

export interface ShopTrack {
  id: string;
  title: string;
  artist: string;
  releaseYear: number;
  bpm: number;
  duration: number;
  albumArt: string;
  difficulty?: Record<string, number>;
}

export interface ShopCarItem {
  id: string;
  name: string;
  description: string;
  type: { value: string; displayValue: string };
  rarity: { value: string; displayValue: string };
  images: { small?: string; large?: string };
}

export interface ShopEntryLayout {
  id: string;
  name: string;
}

export interface ShopEntryBundle {
  name: string;
  info: string;
  image: string;
}

export interface ShopEntryRenderImage {
  productTag: string;
  image: string;
}

export interface ShopEntryBanner {
  value: string;
  intensity: string;
  backendValue: string;
}

export interface ShopEntry {
  regularPrice: number;
  finalPrice: number;
  offerId: string;
  inDate: string;
  outDate: string;
  giftable: boolean;
  tileSize: string;
  layout?: ShopEntryLayout;
  bundle?: ShopEntryBundle;
  banner?: ShopEntryBanner;
  brItems?: ShopBrItem[];
  tracks?: ShopTrack[];
  cars?: ShopCarItem[];
  newDisplayAsset?: { renderImages: ShopEntryRenderImage[] };
}

export interface ShopResponse {
  hash: string;
  date: string;
  entries: ShopEntry[];
}
