import { Routes } from '@angular/router';
import { BannersComponent } from './pages/banners/banners.component';
import { HomeComponent } from './pages/home/home.component';
import { MapComponent } from './pages/map/map.component';
import { NewsComponent } from './pages/news/news.component';
import { PlaylistComponent } from './pages/playlist/playlist.component';
import { ShopComponent } from './pages/shop/shop.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'news', component: NewsComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'map', component: MapComponent },
  { path: 'playlists', component: PlaylistComponent },
  { path: 'banners', component: BannersComponent },
  { path: '**', redirectTo: '' },
];
