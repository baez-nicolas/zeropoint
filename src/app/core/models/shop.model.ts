export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: string;
  type: string;
  images: {
    icon: string;
    featured?: string;
  };
}

export interface Shop {
  featured: ShopItem[];
  daily: ShopItem[];
  lastUpdate: string;
}
