import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PageLoadingService {
  private isLoading = signal(true);

  setLoading(loading: boolean) {
    this.isLoading.set(loading);
  }

  getLoadingSignal() {
    return this.isLoading.asReadonly();
  }
}
