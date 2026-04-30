export interface BannerImages {
  smallIcon: string;
  icon: string;
}

export interface Banner {
  id: string;
  devName: string;
  name: string;
  description: string;
  category: string;
  fullUsageRights: boolean;
  images: BannerImages;
}
