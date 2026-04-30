export interface CosmeticImages {
  smallIcon?: string;
  icon?: string;
  featured?: string;
  lego?: { small: string; large: string };
  bean?: { small: string; large: string };
  other?: Record<string, string>;
}

export interface CosmeticType {
  value: string;
  displayValue: string;
  backendValue: string;
}

export interface CosmeticRarity {
  value: string;
  displayValue: string;
  backendValue: string;
}

export interface CosmeticSeries {
  value: string;
  image?: string;
  colors?: string[];
  backendValue: string;
}

export interface CosmeticSet {
  value: string;
  text: string;
  backendValue: string;
}

export interface CosmeticIntroduction {
  chapter: string;
  season: string;
  text: string;
  backendValue: number;
}

export interface CosmeticVariantOption {
  tag: string;
  name: string;
  image?: string;
  unlockRequirements?: string;
}

export interface CosmeticVariant {
  channel: string;
  type: string;
  options: CosmeticVariantOption[];
}

export interface Cosmetic {
  id: string;
  name: string;
  description?: string;
  type: CosmeticType;
  rarity?: CosmeticRarity;
  series?: CosmeticSeries;
  set?: CosmeticSet;
  introduction?: CosmeticIntroduction;
  images: CosmeticImages;
  variants?: CosmeticVariant[];
  showcaseVideo?: string;
  added: string;
}
