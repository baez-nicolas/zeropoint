import { Component, effect, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PageLoadingService } from '../../../core/services/page-loading.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  showFooter = signal(false);
  private footerTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private router: Router,
    private pageLoadingService: PageLoadingService,
  ) {
    effect(() => {
      const isLoading = this.pageLoadingService.getLoadingSignal()();

      if (this.footerTimeout) {
        clearTimeout(this.footerTimeout);
      }

      if (!isLoading) {
        this.footerTimeout = setTimeout(() => {
          this.showFooter.set(true);
        }, 500);
      }
    });
  }

  ngOnInit() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.showFooter.set(false);
      this.pageLoadingService.setLoading(true);
    });
  }
}
