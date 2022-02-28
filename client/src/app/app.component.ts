import { Component, AfterViewInit, OnDestroy } from '@angular/core';

// services
import { AuthService } from "./server.service";
import { NotificationService } from "@progress/kendo-angular-notification";

// rxjs
import { Subscription } from "rxjs";

// other
import { NGXLogger } from 'ngx-logger';
import { environment } from "../environments/environment";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  public isLoggedIn: boolean = false;
  // navigation selected
  public homeSelected: boolean = false;
  // subscriptions
  isLoggedIn$!: Subscription;
  homeSelected$!: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private logger: NGXLogger,
  ) {
  }

  ngAfterViewInit() {
    this.isLoggedIn$ = this.authService.isLoggedInEvent.subscribe((isLoggedIn: boolean) => {
      this.isLoggedIn = isLoggedIn;
    });

    this.homeSelected$ = this.authService.homeSelectedEvent.subscribe(() => {
      this.resetSelection();
      this.homeSelected = true;
    });
  }

  private resetSelection(): void {
    this.homeSelected = false;
  }

  ngOnDestroy() {
    this.isLoggedIn$.unsubscribe();
    this.homeSelected$.unsubscribe();
  }

}
